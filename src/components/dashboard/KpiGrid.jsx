import Icon from '../common/Icon.jsx';

// Portado desde el bloque de #kpi-grid en dashboard.js (renderDashboard).
export default function KpiGrid({ kpis }) {
  return (
    <div id="kpi-grid" className="grid grid-cols-2 lg:grid-cols-4 gap-4 animate-fade">
      {kpis.map((kpi, i) => {
        const positive = !kpi.delta.startsWith('-');
        return (
          <div key={kpi.label} className={`card p-5 animate-fade-up stagger-${i + 1}`}>
            <div className="flex items-center justify-between mb-3">
              <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ background: `${kpi.color}22` }}>
                <Icon name={kpi.icon} className="w-4 h-4" style={{ color: kpi.color }} />
              </div>
              <span className={`text-xs font-medium ${positive ? 'text-emerald-400' : 'text-rose-400'}`}>{kpi.delta}</span>
            </div>
            <p className="text-2xl font-bold">{kpi.value}</p>
            <p className="text-xs text-[var(--text-tertiary)] mt-1">{kpi.label}</p>
          </div>
        );
      })}
    </div>
  );
}
