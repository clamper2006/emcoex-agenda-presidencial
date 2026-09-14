import { useMemo } from 'react';
import Icon from '../common/Icon.jsx';
import { getISOWeekRange, getMonthRange, summarizeDespachos } from '../../lib/despachosSummary.js';

// A propósito no es una sección más de SECTIONS (agendaConfig.js): no
// tiene formulario ni tabla propia en Supabase, es una vista calculada en
// vivo sobre los registros de Despachos que ya se capturan en esa
// sección. Esto es el pedido original de cero fricción — el presidente
// no llena nada nuevo acá, solo lee cómo van los despachos de esta
// semana y cómo eso aporta al mes en curso. Mismo cálculo (misma
// función, mismo dato) que ahora también alimenta el campo Ingresos de
// Cierres mensuales, así que los números de ambos lugares siempre
// cuadran entre sí.
export default function WeeklySummary({ despachos }) {
  const week = useMemo(() => getISOWeekRange(), []);
  const month = useMemo(() => getMonthRange(), []);
  const weekSummary = useMemo(() => summarizeDespachos(despachos, week), [despachos, week]);
  const monthSummary = useMemo(() => summarizeDespachos(despachos, month), [despachos, month]);
  const aporte = monthSummary.totalIngresos
    ? Math.min(100, Math.round((weekSummary.totalIngresos / monthSummary.totalIngresos) * 100))
    : 0;

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-xl font-bold">Resumen semanal</h1>
        <p className="text-xs text-[var(--text-tertiary)]">
          Semana del {week.label} · calculado en vivo desde Despachos, nada que llenar acá
        </p>
      </header>

      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        <SummaryCard icon="ship" color="#14b8a6" label="Despachos esta semana" value={weekSummary.count} />
        <SummaryCard
          icon="truck"
          color="#f59e0b"
          label="Toneladas despachadas"
          value={weekSummary.totalToneladas.toLocaleString('es-VE')}
        />
        <SummaryCard
          icon="trending-up"
          color="#f59e0b"
          label="Ingresos de la semana"
          value={`$${weekSummary.totalIngresos.toLocaleString('es-VE')}`}
        />
      </div>

      <div className="card p-5">
        <h3 className="text-sm font-semibold mb-4">Por producto — esta semana</h3>
        {weekSummary.porProducto.length ? (
          <div className="space-y-3">
            {weekSummary.porProducto.map((p) => (
              <div key={p.producto} className="flex items-center justify-between text-sm">
                <span className="text-[var(--text-secondary)]">
                  {p.producto} <span className="text-[var(--text-tertiary)] text-xs">({p.count})</span>
                </span>
                <span className="font-medium">
                  {p.toneladas.toLocaleString('es-VE')} t · ${p.monto.toLocaleString('es-VE')}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-xs text-[var(--text-tertiary)]">Sin despachos registrados esta semana todavía.</p>
        )}
      </div>

      <div className="card p-5">
        <h3 className="text-sm font-semibold mb-1">Aporte al mes en curso</h3>
        <p className="text-xs text-[var(--text-tertiary)] mb-4 capitalize">{month.label}</p>
        <div className="flex items-end justify-between gap-4">
          <div>
            <p className="text-2xl font-bold">${monthSummary.totalIngresos.toLocaleString('es-VE')}</p>
            <p className="text-xs text-[var(--text-tertiary)] mt-1">
              Ingresos del mes hasta ahora ({monthSummary.count} despacho{monthSummary.count === 1 ? '' : 's'})
            </p>
          </div>
          <div className="text-right shrink-0">
            <p className="text-lg font-bold text-[var(--accent)]">{aporte}%</p>
            <p className="text-xs text-[var(--text-tertiary)]">de eso es esta semana</p>
          </div>
        </div>
      </div>
    </div>
  );
}

function SummaryCard({ icon, color, label, value }) {
  return (
    <div className="card p-5">
      <div className="w-9 h-9 rounded-lg flex items-center justify-center mb-3" style={{ background: `${color}22` }}>
        <Icon name={icon} className="w-4 h-4" style={{ color }} />
      </div>
      <p className="text-2xl font-bold">{value}</p>
      <p className="text-xs text-[var(--text-tertiary)] mt-1">{label}</p>
    </div>
  );
}
