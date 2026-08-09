import { useState } from 'react';
import Icon from './Icon.jsx';
import { markTourSeen } from '../../utils/onboarding.js';

// Un paso por función principal de la agenda. Cada paso tiene su propio
// ícono animado (ver .tour-icon-* en animations.css) para que se sienta
// relacionado a lo que describe, no la misma animación repetida 5 veces:
// pulso para el Dashboard (datos "vivos"), pop para Cierres (como un check
// al confirmar un cierre), balanceo para Despachos (un barco navegando),
// elevación para Proveedores (directorio que crece) y caída para
// Exportar PDF (el archivo bajando, como file-down).
const STEPS = [
  {
    id: 'dashboard',
    title: 'Dashboard',
    description: 'Ingresos, costos y despachos de toda la operación, con gráficos que se actualizan solos cada vez que registras algo.',
    icon: 'layout-dashboard',
    animClass: 'tour-icon-pulse',
  },
  {
    id: 'cierres',
    title: 'Cierres mensuales',
    description: 'Registra el cierre de cada mes — ingresos, costos y despachos cerrados — en segundos, desde el celular.',
    icon: 'calendar-check',
    animClass: 'tour-icon-pop',
  },
  {
    id: 'despachos',
    title: 'Despachos',
    description: 'Lleva el control de cada despacho: proveedor, incoterm, estado y monto, todo en un mismo lugar.',
    icon: 'ship',
    animClass: 'tour-icon-sail',
  },
  {
    id: 'proveedores',
    title: 'Proveedores',
    description: 'Tu directorio de proveedores siempre a mano, con municipio, rubro, capacidad y contacto.',
    icon: 'building-2',
    animClass: 'tour-icon-rise',
  },
  {
    id: 'pdf',
    title: 'Exportar PDF',
    description: 'Genera reportes listos para imprimir — de una sección puntual o de toda la operación — con un toque.',
    icon: 'file-down',
    animClass: 'tour-icon-drop',
  },
];

export default function WelcomeTour({ onClose }) {
  const [step, setStep] = useState(0);
  const isLast = step === STEPS.length - 1;
  const current = STEPS[step];

  function finish() {
    markTourSeen();
    onClose();
  }

  function handleNext() {
    if (isLast) {
      finish();
      return;
    }
    setStep((s) => s + 1);
  }

  return (
    <div
      className="modal-backdrop flex items-center justify-center px-6"
      role="dialog"
      aria-modal="true"
      aria-label={`Tutorial de bienvenida: ${current.title}`}
    >
      <div className="glass-strong rounded-3xl p-7 w-full max-w-sm text-center animate-scale-in">
        <div
          className={`w-20 h-20 rounded-full mx-auto mb-5 flex items-center justify-center border border-[var(--border-subtle)] ${current.animClass}`}
          style={{ background: 'var(--accent-tint)' }}
        >
          <Icon name={current.icon} className="w-9 h-9" style={{ color: 'var(--accent)' }} />
        </div>

        <p className="text-[10px] font-semibold uppercase tracking-wider text-[var(--accent)] mb-1.5">
          Paso {step + 1} de {STEPS.length}
        </p>
        <h2 className="text-lg font-bold mb-2">{current.title}</h2>
        <p className="text-sm text-[var(--text-secondary)] mb-6">{current.description}</p>

        <div className="flex items-center justify-center gap-1.5 mb-6">
          {STEPS.map((s, i) => (
            <span
              key={s.id}
              className="h-1.5 rounded-full transition-all duration-300"
              style={{
                width: i === step ? '18px' : '6px',
                background: i <= step ? 'var(--accent)' : 'var(--border-strong)',
              }}
            />
          ))}
        </div>

        <div className="flex items-center gap-2">
          {!isLast && (
            <button onClick={finish} className="btn-ghost rounded-xl py-2.5 px-4 text-sm font-medium flex-1">
              Omitir
            </button>
          )}
          <button
            onClick={handleNext}
            className="btn-primary rounded-xl py-2.5 px-4 text-sm font-semibold flex-1 flex items-center justify-center gap-2"
          >
            {isLast ? 'Empezar' : 'Siguiente'}
            {!isLast && <Icon name="arrow-right" className="w-4 h-4" />}
          </button>
        </div>
      </div>
    </div>
  );
}
