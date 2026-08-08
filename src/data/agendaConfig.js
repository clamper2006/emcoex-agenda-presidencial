// Config de las 4 secciones de la agenda. Cada una define su clave de
// storage local y los campos del formulario rápido de captura.
// isSupabaseConfigured=true en el futuro -> estas mismas keys deberían
// mapear 1:1 a tablas de Supabase (ver erp_comex_schema.sql como base).

export const SECTIONS = {
  cierres: {
    key: 'agenda_cierres',
    label: 'Cierres mensuales',
    icon: 'calendar-check',
    fields: [
      { name: 'mes', label: 'Mes', type: 'month', required: true },
      { name: 'ingresos', label: 'Ingresos (USD)', type: 'number', required: true },
      { name: 'costos', label: 'Costos (USD)', type: 'number', required: true },
      { name: 'despachos_cerrados', label: 'Despachos cerrados', type: 'number', required: true },
      { name: 'notas', label: 'Notas', type: 'textarea' },
    ],
  },
  despachos: {
    key: 'agenda_despachos',
    label: 'Despachos',
    icon: 'ship',
    fields: [
      { name: 'proveedor', label: 'Proveedor', type: 'text', required: true },
      { name: 'incoterm', label: 'Incoterm', type: 'select', options: ['FOB', 'CIF', 'EXW', 'DDP'], required: true },
      { name: 'estado', label: 'Estado', type: 'select', options: ['En tránsito', 'En aduana', 'Cerrado', 'Retrasado'], required: true },
      { name: 'fecha', label: 'Fecha', type: 'date', required: true },
      { name: 'monto', label: 'Monto (USD)', type: 'number', required: true },
      { name: 'notas', label: 'Notas', type: 'textarea' },
    ],
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
