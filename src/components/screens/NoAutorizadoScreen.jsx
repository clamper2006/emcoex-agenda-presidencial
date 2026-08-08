import Icon from '../common/Icon.jsx';
import { useAuth } from '../../context/AuthContext.jsx';

export default function NoAutorizadoScreen() {
  const { user, signOut } = useAuth();

  return (
    <section className="screen active min-h-screen flex items-center justify-center px-6 py-16">
      <div className="w-full max-w-md text-center animate-scale-in">
        <div className="w-14 h-14 rounded-2xl bg-amber-500/15 text-amber-400 flex items-center justify-center mx-auto mb-5">
          <Icon name="lock" className="w-6 h-6" />
        </div>
        <h1 className="text-xl font-bold mb-2">Acceso restringido</h1>
        <p className="text-sm text-[var(--text-secondary)] mb-1">
          Esta agenda es de uso exclusivo del presidente de Emcoex.
        </p>
        {user?.email && (
          <p className="text-xs text-[var(--text-tertiary)] mb-6">Conectado como {user.email}</p>
        )}
        <button onClick={signOut} className="btn-ghost rounded-xl py-2.5 px-5 text-sm font-medium">
          Cerrar sesión
        </button>
      </div>
    </section>
  );
}
