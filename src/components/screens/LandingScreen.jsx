import { useNavigate } from 'react-router-dom';
import Icon from '../common/Icon.jsx';

const FEATURES = [
  { icon: 'bar-chart-3', title: 'Estadísticas globales', desc: 'KPIs y tendencias de toda la operación, siempre a la mano.' },
  { icon: 'calendar-check', title: 'Cierres mensuales', desc: 'Registra y consulta el cierre de cada mes en segundos.' },
  { icon: 'file-down', title: 'Reportes en PDF', desc: 'Exporta reportes profesionales, listos para imprimir.' },
];

export default function LandingScreen() {
  const navigate = useNavigate();

  return (
    <section className="screen active min-h-screen flex flex-col items-center justify-center px-6 py-16 text-center">
      <img src={`${import.meta.env.BASE_URL}brand/emcoex-logo-completo.png`} alt="Emcoex" className="h-14 mb-8 animate-scale-in" />
      <h1 className="text-3xl sm:text-4xl font-bold max-w-lg mb-4 animate-scale-in">
        La agenda ejecutiva de Emcoex
      </h1>
      <p className="text-sm sm:text-base text-[var(--text-secondary)] max-w-md mb-10">
        Toda la información de la empresa, organizada y lista para consultar o imprimir, en un solo lugar.
      </p>

      <div className="grid sm:grid-cols-3 gap-4 max-w-3xl w-full mb-10">
        {FEATURES.map((f) => (
          <div key={f.title} className="glass rounded-2xl p-5 text-left">
            <div className="w-9 h-9 rounded-lg bg-[var(--accent-soft)] text-[var(--accent)] flex items-center justify-center mb-3">
              <Icon name={f.icon} className="w-4.5 h-4.5" />
            </div>
            <h3 className="text-sm font-semibold mb-1">{f.title}</h3>
            <p className="text-xs text-[var(--text-tertiary)]">{f.desc}</p>
          </div>
        ))}
      </div>

      <button onClick={() => navigate('/login')} className="btn-primary rounded-xl py-3 px-8 text-sm font-semibold">
        Ingresar
      </button>
    </section>
  );
}
