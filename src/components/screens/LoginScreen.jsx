import { useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import Icon from '../common/Icon.jsx';
import FullScreenLoader from '../common/FullScreenLoader.jsx';
import { useToast } from '../../context/ToastContext.jsx';
import { useAuth } from '../../context/AuthContext.jsx';

export default function LoginScreen() {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const { isSupabaseConfigured, session, authLoading, isAuthorized, signInWithGoogle } = useAuth();
  const [googleLoading, setGoogleLoading] = useState(false);

  if (authLoading) return <FullScreenLoader message="Verificando tu sesión…" />;

  if (session) {
    return <Navigate to={isAuthorized ? '/agenda' : '/no-autorizado'} replace />;
  }

  async function handleGoogleLogin() {
    setGoogleLoading(true);
    try {
      await signInWithGoogle();
    } catch (error) {
      setGoogleLoading(false);
      showToast('error', 'No se pudo iniciar sesión', error.message);
    }
  }

  return (
    <section id="screen-login" className="screen active min-h-screen flex items-center justify-center px-6 py-16">
      <div className="w-full max-w-md animate-scale-in">
        <div className="text-center mb-8">
          <img src={`${import.meta.env.BASE_URL}brand/emcoex-isotipo.png`} alt="Emcoex" className="w-14 h-14 mx-auto mb-4" />
          <h1 className="text-2xl font-bold mb-1">Agenda Emcoex</h1>
          <p className="text-sm text-[var(--text-secondary)]">Acceso exclusivo de presidencia</p>
        </div>

        <div className="glass rounded-2xl p-7">
          {!isSupabaseConfigured && (
            <div className="glass rounded-xl p-3 mb-4 text-xs text-amber-400">
              Supabase no está configurado (faltan las variables de entorno). Revisa .env.example.
            </div>
          )}

          <button
            onClick={handleGoogleLogin}
            disabled={googleLoading || !isSupabaseConfigured}
            className="w-full btn-primary rounded-xl py-3 flex items-center justify-center gap-3 text-sm font-semibold disabled:opacity-60"
          >
            {googleLoading ? (
              <Icon name="loader-2" className="w-4 h-4 animate-spin" />
            ) : (
              <svg className="w-4 h-4" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
              </svg>
            )}
            {googleLoading ? 'Redirigiendo a Google…' : 'Continuar con Google'}
          </button>
        </div>
        <p className="text-center text-xs text-[var(--text-tertiary)] mt-6">
          <button onClick={() => navigate('/landing')} className="hover:text-white transition inline-flex items-center gap-1">
            <Icon name="arrow-left" className="w-3.5 h-3.5" /> Volver al inicio
          </button>
        </p>
      </div>
    </section>
  );
}
