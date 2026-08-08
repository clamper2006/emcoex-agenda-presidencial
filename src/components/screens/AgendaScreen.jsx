import { useEffect, useMemo, useState } from 'react';
import Icon from '../common/Icon.jsx';
import KpiGrid from '../dashboard/KpiGrid.jsx';
import LineChart from '../dashboard/LineChart.jsx';
import DonutChart from '../dashboard/DonutChart.jsx';
import DynamicForm from '../dashboard/DynamicForm.jsx';
import RecordsTable from '../dashboard/RecordsTable.jsx';
import { useTheme } from '../../context/ThemeContext.jsx';
import { useToast } from '../../context/ToastContext.jsx';
import { useAuth } from '../../context/AuthContext.jsx';
import { getRecords, saveRecord, deleteRecordItem } from '../../utils/storage.js';
import { SECTIONS, computeKpis } from '../../data/agendaConfig.js';
import { exportGeneralPdf, exportSectionPdf } from '../../lib/pdfReport.js';

const NAV = [
  { id: 'dashboard', label: 'Dashboard', icon: 'layout-dashboard' },
  { id: 'cierres', label: 'Cierres mensuales', icon: 'calendar-check' },
  { id: 'despachos', label: 'Despachos', icon: 'ship' },
  { id: 'proveedores', label: 'Proveedores', icon: 'building-2' },
];

export default function AgendaScreen() {
  const [tab, setTab] = useState('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [version, setVersion] = useState(0); // fuerza refresco tras guardar/borrar
  const [dataBySection, setDataBySection] = useState({ cierres: [], despachos: [], proveedores: [] });
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false); // guardando/borrando (deshabilita botones)
  const { theme, toggleTheme } = useTheme();
  const { showToast } = useToast();
  const { user, signOut } = useAuth();

  useEffect(() => {
    let active = true;
    setLoading(true);
    Promise.all([
      getRecords(SECTIONS.cierres.key),
      getRecords(SECTIONS.despachos.key),
      getRecords(SECTIONS.proveedores.key),
    ])
      .then(([cierres, despachos, proveedores]) => {
        if (!active) return;
        setDataBySection({ cierres, despachos, proveedores });
      })
      .catch(() => {
        if (!active) return;
        showToast('error', 'Error', 'No se pudieron cargar los datos desde Supabase.');
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [version]);

  const kpis = useMemo(() => computeKpis(dataBySection.cierres), [dataBySection.cierres]);

  const lineSeries = useMemo(() => {
    const sorted = [...dataBySection.cierres].sort((a, b) => (a.mes > b.mes ? 1 : -1));
    return {
      labels: sorted.map((c) => c.mes),
      values: sorted.map((c) => Number(c.ingresos || 0)),
    };
  }, [dataBySection.cierres]);

  const donutData = useMemo(() => {
    const counts = {};
    dataBySection.despachos.forEach((d) => {
      counts[d.estado] = (counts[d.estado] || 0) + 1;
    });
    return Object.entries(counts).map(([label, value]) => ({ label, value }));
  }, [dataBySection.despachos]);

  function refresh() {
    setVersion((v) => v + 1);
  }

  async function handleSave(sectionKey, values) {
    setBusy(true);
    try {
      // id/created_at/usuario_id los resuelve Supabase (defaults en el
      // esquema SQL: gen_random_uuid(), now(), auth.uid()) — el cliente
      // solo manda los campos del formulario.
      await saveRecord(SECTIONS[sectionKey].key, values);
      refresh();
      showToast('success', 'Guardado', `${SECTIONS[sectionKey].label}: registro agregado.`);
    } catch {
      showToast('error', 'Error', 'No se pudo guardar el registro. Intenta de nuevo.');
    } finally {
      setBusy(false);
    }
  }

  async function handleDelete(sectionKey, id) {
    setBusy(true);
    try {
      await deleteRecordItem(SECTIONS[sectionKey].key, id);
      refresh();
      showToast('info', 'Eliminado', 'Registro eliminado.');
    } catch {
      showToast('error', 'Error', 'No se pudo eliminar el registro. Intenta de nuevo.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="min-h-screen flex">
      {/* Sidebar */}
      <aside className={`fixed md:sticky top-0 z-40 h-screen w-64 glass-strong flex flex-col transition-transform ${sidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}`}>
        <div className="flex items-center gap-2 px-5 py-5">
          <img src={`${import.meta.env.BASE_URL}brand/emcoex-isotipo.png`} alt="" className="w-8 h-8" />
          <div>
            <p className="font-bold text-sm leading-tight">Agenda Emcoex</p>
            <p className="text-[10px] text-[var(--text-tertiary)]">Presidencia</p>
          </div>
        </div>
        <nav className="flex-1 px-3 space-y-1">
          {NAV.map((item) => (
            <button
              key={item.id}
              onClick={() => { setTab(item.id); setSidebarOpen(false); }}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition ${tab === item.id ? 'bg-[var(--accent-soft)] text-[var(--accent)]' : 'text-[var(--text-secondary)] hover:bg-white/5'}`}
            >
              <Icon name={item.icon} className="w-4 h-4" />
              {item.label}
            </button>
          ))}
        </nav>
        <div className="p-3 border-t border-[var(--border-subtle)] space-y-1">
          <button onClick={() => exportGeneralPdf(dataBySection)} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-[var(--text-secondary)] hover:bg-white/5">
            <Icon name="file-down" className="w-4 h-4" />
            Reporte general PDF
          </button>
          <button onClick={toggleTheme} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-[var(--text-secondary)] hover:bg-white/5">
            <Icon name={theme === 'light' ? 'moon' : 'sun'} className="w-4 h-4" />
            {theme === 'light' ? 'Modo oscuro' : 'Modo claro'}
          </button>
          <button onClick={signOut} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-rose-400 hover:bg-white/5">
            <Icon name="log-out" className="w-4 h-4" />
            Cerrar sesión
          </button>
        </div>
      </aside>

      {sidebarOpen && <div className="fixed inset-0 bg-black/50 z-30 md:hidden" onClick={() => setSidebarOpen(false)} />}

      {/* Mobile topbar */}
      <div className="md:hidden fixed top-0 inset-x-0 z-20 glass-strong flex items-center justify-between px-4 py-3">
        <span className="font-bold text-sm">Agenda Emcoex</span>
        <button onClick={() => setSidebarOpen(true)} className="btn-ghost p-2 rounded-lg">
          <Icon name="menu" className="w-5 h-5" />
        </button>
      </div>

      {/* Main content */}
      <main className="flex-1 px-5 md:px-8 py-6 md:py-8 pt-20 md:pt-8 max-w-6xl mx-auto w-full">
        {loading && (
          <div className="card p-10 mb-6">
            <EmptyState text="Cargando datos desde Supabase..." />
          </div>
        )}

        {!loading && tab === 'dashboard' && (
          <div className="space-y-6">
            <header className="flex items-center justify-between flex-wrap gap-3">
              <div>
                <h1 className="text-xl font-bold">Resumen general</h1>
                <p className="text-xs text-[var(--text-tertiary)]">{user?.email}</p>
              </div>
              <button onClick={() => exportGeneralPdf(dataBySection)} className="btn-primary rounded-xl py-2.5 px-4 text-sm font-semibold flex items-center gap-2">
                <Icon name="file-down" className="w-4 h-4" /> Exportar reporte general
              </button>
            </header>
            <KpiGrid kpis={kpis} />
            <div className="grid lg:grid-cols-3 gap-4">
              <div className="lg:col-span-2 card p-5">
                <h3 className="text-sm font-semibold mb-4">Ingresos por mes</h3>
                {lineSeries.labels.length ? (
                  <LineChart labels={lineSeries.labels} values={lineSeries.values} />
                ) : (
                  <EmptyState text="Registra tu primer cierre mensual para ver la tendencia." />
                )}
              </div>
              <div className="card p-5">
                <h3 className="text-sm font-semibold mb-4">Despachos por estado</h3>
                {donutData.length ? (
                  <DonutChart data={donutData} />
                ) : (
                  <EmptyState text="Registra despachos para ver la distribución." />
                )}
              </div>
            </div>
          </div>
        )}

        {!loading && tab !== 'dashboard' && (
          <SectionView
            sectionKey={tab}
            records={dataBySection[tab]}
            busy={busy}
            onSave={(values) => handleSave(tab, values)}
            onDelete={(id) => handleDelete(tab, id)}
          />
        )}
      </main>
    </div>
  );
}

function SectionView({ sectionKey, records, busy, onSave, onDelete }) {
  const config = SECTIONS[sectionKey];
  const [showForm, setShowForm] = useState(false);

  return (
    <div className="space-y-5">
      <header className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-bold">{config.label}</h1>
          <p className="text-xs text-[var(--text-tertiary)]">{records.length} registro(s)</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => exportSectionPdf(sectionKey, config.label, records)} className="btn-ghost rounded-xl py-2.5 px-4 text-sm font-medium flex items-center gap-2">
            <Icon name="file-down" className="w-4 h-4" /> PDF de esta sección
          </button>
          <button disabled={busy} onClick={() => setShowForm((v) => !v)} className="btn-primary rounded-xl py-2.5 px-4 text-sm font-semibold flex items-center gap-2 disabled:opacity-60">
            <Icon name={showForm ? 'x' : 'plus'} className="w-4 h-4" /> {showForm ? 'Cerrar' : 'Agregar'}
          </button>
        </div>
      </header>

      {showForm && (
        <div className="card p-5">
          <DynamicForm
            fields={config.fields}
            onSubmit={(values) => { onSave(values); setShowForm(false); }}
          />
        </div>
      )}

      {records.length ? (
        <RecordsTable
          columns={config.fields.map((f) => ({ key: f.name, label: f.label }))}
          records={records}
          onDelete={onDelete}
        />
      ) : (
        <div className="card p-10">
          <EmptyState text={`Todavía no hay registros en ${config.label.toLowerCase()}. Usa "Agregar" para capturar el primero.`} />
        </div>
      )}
    </div>
  );
}

function EmptyState({ text }) {
  return (
    <div className="text-center py-8">
      <Icon name="inbox" className="w-8 h-8 mx-auto mb-3 text-[var(--text-tertiary)]" />
      <p className="text-xs text-[var(--text-tertiary)] max-w-xs mx-auto">{text}</p>
    </div>
  );
}
