// Config de las 4 secciones de la agenda. Cada una define su clave de
// storage local y los campos del formulario rápido de captura.
// isSupabaseConfigured=true en el futuro -> estas mismas keys deberían
// mapear 1:1 a tablas de Supabase (ver erp_comex_schema.sql como base).

import { getMonthRangeFromMesValue, summarizeDespachos } from '../lib/despachosSummary.js';

export const SECTIONS = {
  cierres: {
    key: 'agenda_cierres',
    label: 'Cierres mensuales',
    icon: 'calendar-check',
    fields: [
      { name: 'mes', label: 'Mes', type: 'month', required: true },
      {
        name: 'ingresos',
        label: 'Ingresos (USD)',
        type: 'computed',
        required: true,
        computeFrom: ['mes'],
        // Iteración (vínculo Despachos → Cierres): antes era un número
        // escrito a mano, sin ninguna relación con Despachos — cada uno
        // vivía en su propia tabla, lo que producía cifras que no
        // cuadraban entre sí (un despacho de $10M sin relación con el
        // cierre mensual del mismo período). Ahora se calcula sumando
        // despachos.monto de todos los despachos cuya `fecha` cae dentro
        // del mes elegido (misma función que usa Resumen semanal, ver
        // src/lib/despachosSummary.js) — así ambos números salen
        // siempre de la misma fuente y nunca pueden desalinearse. Un mes
        // sin despachos da $0 (válido, no bloquea guardar); `null` solo
        // antes de elegir mes.
        compute: (v, externalData) => {
          const range = getMonthRangeFromMesValue(v.mes);
          if (!range) return null;
          return summarizeDespachos(externalData?.despachos, range).totalIngresos;
        },
        format: (total) => (total == null
          ? 'Selecciona un mes para calcular'
          : `$${Number(total).toLocaleString('es-VE')} USD (calculado desde Despachos)`),
      },
      { name: 'costos', label: 'Costos (USD)', type: 'number', required: true },
      { name: 'despachos_cerrados', label: 'Despachos cerrados', type: 'number', required: true },
      { name: 'notas', label: 'Notas', type: 'textarea' },
    ],
  },
  despachos: {
    key: 'agenda_despachos',
    label: 'Despachos',
    icon: 'ship',
    // Iteración (Distribución y Destinos): `monto` YA existía y ya era el
    // campo que representa el valor monetario del despacho (usado en la
    // tabla del PDF, ver src/lib/pdfReport.js). No se crea una columna
    // `total` nueva -> `monto` pasa a ser un campo `computed` (toneladas ×
    // precio_tonelada), calculado en vivo por DynamicForm y enviado ya
    // resuelto en el submit.
    //
    // Actualización (vínculo Despachos → Cierres): la nota original de
    // esta sección decía que ningún KPI del Dashboard dependía de
    // despachos.monto porque computeKpis() solo lee `cierres`. Eso seguía
    // siendo técnicamente cierto pero ya no es la historia completa:
    // computeKpis() sigue leyendo solo `cierres.ingresos`, pero ese valor
    // ahora se calcula (arriba, campo `ingresos`) sumando despachos.monto
    // del mes correspondiente. El Dashboard sí depende de Despachos ahora,
    // solo que indirectamente, vía el cierre de ese mes.
    fields: [
      { name: 'proveedor', label: 'Proveedor', type: 'text', required: true },
      { name: 'producto', label: 'Producto', type: 'text' },
      { name: 'toneladas', label: 'Toneladas', type: 'number', required: true, min: 0.01, step: 0.01 },
      { name: 'precio_tonelada', label: 'Precio por tonelada (USD)', type: 'number', required: true, min: 0, step: 0.01 },
      {
        name: 'monto',
        label: 'Total del despacho (USD)',
        type: 'computed',
        required: true,
        computeFrom: ['toneladas', 'precio_tonelada'],
        // Regla funcional pedida: total = toneladas × precio_tonelada.
        // Devuelve null (nunca NaN/Infinity) si falta un valor, es
        // negativo, o toneladas es 0 — DynamicForm bloquea el submit
        // mientras el resultado sea null, así `monto` (NOT NULL en el
        // esquema) siempre llega con un número válido a Supabase.
        compute: (v) => {
          if (v.toneladas === undefined || v.toneladas === '' || v.precio_tonelada === undefined || v.precio_tonelada === '') return null;
          const t = Number(v.toneladas);
          const p = Number(v.precio_tonelada);
          if (!Number.isFinite(t) || !Number.isFinite(p) || t <= 0 || p < 0) return null;
          return t * p;
        },
        format: (total, v) => {
          if (total == null) return 'Pendiente — completa toneladas y precio por tonelada';
          const t = Number(v.toneladas);
          const p = Number(v.precio_tonelada);
          return `${t.toLocaleString('es-VE')} t × $${p.toLocaleString('es-VE')}/t = $${total.toLocaleString('es-VE')} USD`;
        },
      },
      { name: 'destino_pais', label: 'Destino — País', type: 'text' },
      { name: 'destino_ciudad', label: 'Destino — Ciudad', type: 'text' },
      { name: 'incoterm', label: 'Incoterm', type: 'select', options: ['FOB', 'CIF', 'EXW', 'DDP'], required: true },
      { name: 'estado', label: 'Estado', type: 'select', options: ['En tránsito', 'En aduana', 'Cerrado', 'Retrasado'], required: true },
      { name: 'fecha', label: 'Fecha', type: 'date', required: true },
      { name: 'notas', label: 'Notas', type: 'textarea' },
    ],
    // Columnas de tabla/PDF con orden de negocio (distinto del orden del
    // formulario) y con Destino combinado en una sola columna visual.
    // Compatibilidad: registros viejos sin estos campos -> deriveRow los
    // muestra como '—', nunca undefined/null/NaN crudo.
    tableColumns: [
      { key: 'proveedor', label: 'Proveedor' },
      { key: 'producto', label: 'Producto' },
      { key: 'toneladas', label: 'Toneladas' },
      { key: 'precio_tonelada', label: 'Precio/ton (USD)' },
      { key: 'monto', label: 'Total (USD)' },
      { key: 'destino', label: 'Destino' },
      { key: 'incoterm', label: 'Incoterm' },
      { key: 'estado', label: 'Estado' },
      { key: 'fecha', label: 'Fecha' },
      { key: 'notas', label: 'Notas' },
    ],
    deriveRow: (r) => ({
      ...r,
      // Se guarda el registro crudo (sin formatear) para que RecordsTable
      // pueda pasárselo tal cual a DynamicForm al editar — los valores de
      // abajo (toneladas, precio_tonelada, monto, destino) son strings ya
      // formateados para mostrar en la tabla/PDF y romperían el formulario
      // de edición (inputs numéricos, campo computed) si se usaran ahí.
      __raw: r,
      producto: r.producto || '—',
      toneladas: r.toneladas !== null && r.toneladas !== undefined && r.toneladas !== '' && Number.isFinite(Number(r.toneladas))
        ? Number(r.toneladas).toLocaleString('es-VE')
        : '—',
      precio_tonelada: r.precio_tonelada !== null && r.precio_tonelada !== undefined && r.precio_tonelada !== '' && Number.isFinite(Number(r.precio_tonelada))
        ? `$${Number(r.precio_tonelada).toLocaleString('es-VE')}`
        : '—',
      monto: r.monto !== null && r.monto !== undefined && r.monto !== '' && Number.isFinite(Number(r.monto))
        ? `$${Number(r.monto).toLocaleString('es-VE')}`
        : '—',
      destino: r.destino_pais || r.destino_ciudad ? [r.destino_pais, r.destino_ciudad].filter(Boolean).join(' — ') : '—',
    }),
  },
  proveedores: {
    key: 'agenda_proveedores',
    label: 'Proveedores',
    icon: 'building-2',
    fields: [
      { name: 'nombre', label: 'Nombre', type: 'text', required: true },
      { name: 'municipio', label: 'Municipio', type: 'text' },
      { name: 'rubro', label: 'Rubro', type: 'text' },
      { name: 'capacidad_mensual', label: 'Capacidad mensual', type: 'text' },
      { name: 'contacto', label: 'Contacto', type: 'text' },
    ],
  },
};

export function computeKpis(cierres) {
  if (!cierres.length) {
    return [
      { label: 'Ingresos totales', value: '$0', delta: '+0%', icon: 'trending-up', color: '#f59e0b' },
      { label: 'Costos totales', value: '$0', delta: '+0%', icon: 'trending-down', color: '#14b8a6' },
      { label: 'Margen promedio', value: '0%', delta: '+0%', icon: 'percent', color: '#f59e0b' },
      { label: 'Despachos cerrados', value: '0', delta: '+0%', icon: 'ship', color: '#14b8a6' },
    ];
  }
  const sorted = [...cierres].sort((a, b) => (a.mes > b.mes ? 1 : -1));
  const totalIngresos = sorted.reduce((s, c) => s + Number(c.ingresos || 0), 0);
  const totalCostos = sorted.reduce((s, c) => s + Number(c.costos || 0), 0);
  const totalDespachos = sorted.reduce((s, c) => s + Number(c.despachos_cerrados || 0), 0);
  const margen = totalIngresos ? (((totalIngresos - totalCostos) / totalIngresos) * 100).toFixed(1) : 0;

  const last = sorted[sorted.length - 1];
  const prev = sorted[sorted.length - 2];
  const delta = (a, b) => (b ? (((a - b) / b) * 100).toFixed(0) + '%' : '+0%');

  return [
    { label: 'Ingresos totales', value: `$${totalIngresos.toLocaleString('es-VE')}`, delta: prev ? delta(last.ingresos, prev.ingresos) : '+0%', icon: 'trending-up', color: '#f59e0b' },
    { label: 'Costos totales', value: `$${totalCostos.toLocaleString('es-VE')}`, delta: prev ? delta(last.costos, prev.costos) : '+0%', icon: 'trending-down', color: '#14b8a6' },
    { label: 'Margen promedio', value: `${margen}%`, delta: '', icon: 'percent', color: '#f59e0b' },
    { label: 'Despachos cerrados', value: `${totalDespachos}`, delta: '', icon: 'ship', color: '#14b8a6' },
  ];
}
