// Utilidades para agregar Despachos por rango de fechas. Comparten esta
// misma lógica dos lugares: la sección "Resumen semanal" (nueva) y el
// campo "Ingresos" de Cierres mensuales (ver agendaConfig.js), que ahora
// se calcula desde Despachos en vez de escribirse a mano. Antes ambas
// tablas vivían totalmente desconectadas — Despachos no aportaba nada a
// ningún cierre ni KPI (ver comentario viejo en agendaConfig.js) — lo que
// producía cifras que no cuadraban entre sí (despachos por $10M sin
// relación con los cierres mensuales registrados). Que ambos lugares
// llamen a la misma función es a propósito: así nunca pueden desalinearse
// entre sí, salen del mismo cálculo sobre el mismo dato.
//
// `fecha` en despachos es 'YYYY-MM-DD' (input type="date" sin hora ni
// zona horaria) — comparar como string ordena igual que comparar como
// fecha real para ese formato exacto, así que el filtro por rango no
// necesita tocar Date en ningún momento.

function toISODate(d) {
  // A propósito NO se usa d.toISOString() acá: eso convierte a UTC, y
  // dependiendo de la zona horaria del navegador podría correr la fecha
  // un día. Se arma el string a mano con los getters LOCALES para que
  // "hoy" siempre sea "hoy", sin importar la zona horaria de quien abra
  // la app.
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

// Semana lunes-domingo que contiene `date` (hoy por defecto).
export function getISOWeekRange(date = new Date()) {
  const d = new Date(date);
  const day = d.getDay(); // 0 (domingo) .. 6 (sábado)
  const diffToMonday = day === 0 ? -6 : 1 - day;
  const monday = new Date(d);
  monday.setDate(d.getDate() + diffToMonday);
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  const fmt = (x) => x.toLocaleDateString('es-VE', { day: 'numeric', month: 'short' });
  return { start: toISODate(monday), end: toISODate(sunday), label: `${fmt(monday)} – ${fmt(sunday)}` };
}

// Mes calendario completo que contiene `date` (hoy por defecto).
export function getMonthRange(date = new Date()) {
  const d = new Date(date);
  const start = new Date(d.getFullYear(), d.getMonth(), 1);
  const end = new Date(d.getFullYear(), d.getMonth() + 1, 0); // día 0 del mes siguiente = último día de este mes
  return {
    start: toISODate(start),
    end: toISODate(end),
    label: start.toLocaleDateString('es-VE', { month: 'long', year: 'numeric' }),
  };
}

// 'YYYY-MM' (valor crudo del <input type="month"> de Cierres) -> rango
// del mes completo. null si todavía no se ha elegido mes.
export function getMonthRangeFromMesValue(mesValue) {
  if (!mesValue) return null;
  const [year, month] = mesValue.split('-').map(Number);
  if (!year || !month) return null;
  const start = new Date(year, month - 1, 1);
  const end = new Date(year, month, 0);
  return { start: toISODate(start), end: toISODate(end) };
}

// Agrega despachos dentro de [start, end] (ambos 'YYYY-MM-DD', inclusive).
// Nunca lanza ni devuelve NaN — un despacho sin fecha/monto/toneladas
// válidos simplemente no suma, mismo criterio de tolerancia que ya usa
// deriveRow() en agendaConfig.js para registros viejos/incompletos.
export function summarizeDespachos(despachos, range) {
  const { start, end } = range || {};
  const inRange = (despachos || []).filter((d) => d.fecha && start && end && d.fecha >= start && d.fecha <= end);
  let totalIngresos = 0;
  let totalToneladas = 0;
  const porProducto = {};
  inRange.forEach((d) => {
    const monto = Number(d.monto);
    const toneladas = Number(d.toneladas);
    if (Number.isFinite(monto)) totalIngresos += monto;
    if (Number.isFinite(toneladas)) totalToneladas += toneladas;
    const key = (d.producto || '').trim() || 'Sin especificar';
    if (!porProducto[key]) porProducto[key] = { toneladas: 0, monto: 0, count: 0 };
    if (Number.isFinite(toneladas)) porProducto[key].toneladas += toneladas;
    if (Number.isFinite(monto)) porProducto[key].monto += monto;
    porProducto[key].count += 1;
  });
  return {
    count: inRange.length,
    totalIngresos,
    totalToneladas,
    porProducto: Object.entries(porProducto)
      .map(([producto, v]) => ({ producto, ...v }))
      .sort((a, b) => b.monto - a.monto),
  };
}
