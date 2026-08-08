import { createClient } from '@supabase/supabase-js';

// Variables de entorno de Vite (deben empezar con VITE_ para exponerse al
// cliente). Ver .env.example. El frontend SOLO necesita la URL del
// proyecto y la anon key — nunca el Client Secret de Google ni ninguna
// service role key: esos viven exclusivamente en el panel de Supabase.
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);

if (!isSupabaseConfigured) {
  // No lanzamos una excepción aquí: eso tumbaría toda la app con una
  // pantalla en blanco apenas se importe este módulo. En vez de eso,
  // dejamos `supabase` en null y AuthContext lo detecta para mostrar un
  // mensaje claro en vez de adivinar qué pasó.
  console.error(
    '[Supabase] Faltan VITE_SUPABASE_URL y/o VITE_SUPABASE_ANON_KEY. ' +
      'Copia .env.example a .env y completa los valores de tu proyecto ' +
      '(Supabase → Project Settings → API). El login con Google no va a funcionar hasta entonces.'
  );
}

export const supabase = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        // Decisión técnica (documentada en AGENTS.md, Iteración 9):
        // el flujo por defecto de supabase-js es "implicit", que devuelve
        // la sesión como fragmento de la URL (#access_token=...). Esta
        // app usa HashRouter, que también vive en el # de la URL — con
        // "implicit" ambos compiten por el mismo fragmento y el login
        // se vuelve poco confiable. "pkce" devuelve un parámetro de
        // query (?code=...) que no toca el hash, así que no colisiona
        // con el router.
        flowType: 'pkce',
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
    })
  : null;
