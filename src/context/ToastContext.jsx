import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import Icon from '../components/common/Icon.jsx';

// Portado desde js/ui.js (showToast). Misma paleta, mismo ícono por tipo,
// mismo tiempo de vida (4200ms) y misma animación de salida (fade + slide).
const ToastContext = createContext(null);

const TOAST_STYLES = {
  success: { border: '#22c55e', icon: 'check-circle' },
  info: { border: '#6366f1', icon: 'info' },
  error: { border: '#ef4444', icon: 'alert-circle' },
};

let toastSeq = 0;

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const removeToast = useCallback((id) => {
    setToasts((current) => current.filter((t) => t.id !== id));
  }, []);

  const showToast = useCallback((type, title, message) => {
    const id = `toast-${Date.now()}-${toastSeq++}`;
    setToasts((current) => [...current, { id, type, title, message }]);
  }, []);

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <div id="toast-container">
        {toasts.map((t) => (
          <ToastItem key={t.id} toast={t} onDone={() => removeToast(t.id)} />
        ))}
      </div>
    </ToastContext.Provider>
  );
}

function ToastItem({ toast, onDone }) {
  const [leaving, setLeaving] = useState(false);
  const style = TOAST_STYLES[toast.type] || TOAST_STYLES.info;

  useEffect(() => {
    const leaveTimer = setTimeout(() => setLeaving(true), 4200);
    return () => clearTimeout(leaveTimer);
  }, []);

  return (
    <div
      className="toast glass-strong animate-slide-in-right"
      style={{
        borderLeft: `3px solid ${style.border}`,
        transition: leaving ? 'opacity 0.3s ease, transform 0.3s ease' : undefined,
        opacity: leaving ? 0 : undefined,
        transform: leaving ? 'translateX(20px)' : undefined,
      }}
      onTransitionEnd={() => leaving && onDone()}
    >
      <Icon name={style.icon} className="w-4 h-4 mt-0.5 flex-shrink-0" style={{ color: style.border }} />
      <div className="flex-1">
        <p className="text-sm font-semibold">{toast.title}</p>
        <p className="text-xs text-[var(--text-secondary)] mt-0.5">{toast.message}</p>
      </div>
      <button onClick={onDone} className="text-[var(--text-tertiary)] hover:text-white transition">
        <Icon name="x" className="w-3.5 h-3.5" />
      </button>
    </div>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast debe usarse dentro de <ToastProvider>');
  return ctx;
}
