import Icon from './Icon.jsx';

// Iteración 9. Se muestra mientras se resuelve la sesión de Supabase
// (getSession) o el rol del usuario (consulta a `usuarios`), para evitar
// que se vea un parpadeo de landing/login antes de saber si hay sesión.
export default function FullScreenLoader({ message = 'Cargando…' }) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-3 px-6">
      <Icon name="loader-2" className="w-6 h-6 animate-spin text-[var(--text-secondary)]" />
      <p className="text-sm text-[var(--text-tertiary)]">{message}</p>
    </div>
  );
}
