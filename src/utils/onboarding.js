// Si ya se vio el tutorial de bienvenida es una preferencia de UI pura —
// igual que el tema claro/oscuro en ThemeContext.jsx (localStorage
// 'erp_theme') — no un dato de negocio, así que nunca pasa por Supabase ni
// por agenda_schema.sql. Vive solo en este navegador/dispositivo.
const STORAGE_KEY = 'emcoex_agenda_tour_seen';

export function hasSeenTour() {
  try {
    return localStorage.getItem(STORAGE_KEY) === '1';
  } catch {
    // localStorage no disponible (modo privado estricto, etc.): no
    // insistir con el tour en cada render, simplemente no se muestra.
    return true;
  }
}

export function markTourSeen() {
  try {
    localStorage.setItem(STORAGE_KEY, '1');
  } catch {
    // No crítico si no se puede persistir — el tour solo se repetirá.
  }
}
