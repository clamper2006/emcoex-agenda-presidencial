import { createContext, useContext, useEffect, useState } from 'react';
import { supabase, isSupabaseConfigured } from '../lib/supabaseClient.js';

// Agenda Emcoex — versión de un solo usuario (el presidente).
// A diferencia del ERP-Comex original, aquí NO existe tabla `usuarios`
// con roles: cualquier cuenta de Google que inicie sesión y cuyo email
// coincida con VITE_PRESIDENTE_EMAIL entra. No hay estados de rol
// (pending/assigned), solo: sin sesión / sesión válida / sesión no autorizada.

const AuthContext = createContext(null);

const PRESIDENTE_EMAIL = (import.meta.env.VITE_PRESIDENTE_EMAIL || '').toLowerCase().trim();

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);

  useEffect(() => {
    if (!isSupabaseConfigured) {
      setAuthLoading(false);
      return;
    }
    let active = true;

    supabase.auth.getSession().then(({ data }) => {
      if (!active) return;
      setSession(data.session);
      setAuthLoading(false);
    });

    const { data: listener } = supabase.auth.onAuthStateChange((_event, newSession) => {
      if (!active) return;
      setSession(newSession);
      setAuthLoading(false);
    });

    return () => {
      active = false;
      listener.subscription.unsubscribe();
    };
  }, []);

  const userEmail = session?.user?.email?.toLowerCase().trim() ?? null;

  // Si no se configuró VITE_PRESIDENTE_EMAIL, se permite cualquier
  // cuenta autenticada (útil en desarrollo local). En producción
  // SIEMPRE debe estar configurado.
  const isAuthorized = session
    ? (!PRESIDENTE_EMAIL || userEmail === PRESIDENTE_EMAIL)
    : false;

  async function signInWithGoogle() {
    if (!isSupabaseConfigured) {
      throw new Error('Supabase no está configurado (faltan VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY).');
    }
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}${import.meta.env.BASE_URL}`,
      },
    });
    if (error) throw error;
  }

  async function signOut() {
    if (!isSupabaseConfigured) return;
    await supabase.auth.signOut();
  }

  const value = {
    isSupabaseConfigured,
    session,
    user: session?.user ?? null,
    authLoading,
    isAuthorized,
    signInWithGoogle,
    signOut,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth debe usarse dentro de <AuthProvider>');
  return ctx;
}
