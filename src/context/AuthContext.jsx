import { createContext, useContext, useEffect, useState } from 'react';
import { supabase, isSupabaseConfigured } from '../lib/supabaseClient.js';

// Agenda Emcoex — etapa de prueba (Iteración 2): CUALQUIER cuenta de
// Google autenticada puede entrar, sin lista de emails permitidos. No
// existe tabla `usuarios` con roles. El aislamiento de datos entre
// cuentas NO lo da esta pantalla de login — lo da RLS en Supabase
// (usuario_id = auth.uid() en cada tabla, ver supabase/agenda_schema.sql):
// cada cuenta ve y edita solo sus propias filas, nunca las de otra
// cuenta, aunque ambas puedan entrar a la misma app.
//
// Esto es intencional para esta etapa: el presidente y su socio prueban
// la app cada uno con su propia cuenta de Google, con datos
// completamente separados entre sí, antes de decidir si se restringe a
// un solo email en una versión posterior.

const AuthContext = createContext(null);

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

  // Cualquier sesión válida está autorizada a entrar. Quién ve qué datos
  // ya no se decide aquí, lo decide RLS por usuario_id en Supabase.
  const isAuthorized = Boolean(session);

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
