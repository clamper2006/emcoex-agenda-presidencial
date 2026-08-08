// Capa de persistencia de los registros de cada sección de la agenda.
// Iteración: migrado de LocalStorage a Supabase (tablas agenda_cierres,
// agenda_despachos, agenda_proveedores — ver supabase/agenda_schema.sql).
//
// La API pública se mantiene deliberadamente muy parecida a la versión
// anterior (getRecords/saveRecord/deleteRecordItem) para no tener que
// tocar DynamicForm.jsx ni RecordsTable.jsx, pero ahora es asíncrona
// (toda llamada a Supabase lo es) — el único consumidor, AgendaScreen.jsx,
// se actualizó para manejar estados de carga/guardado.
//
// `key` sigue siendo el mismo string que ya usaba localStorage
// (SECTIONS[x].key en agendaConfig.js), y ahora se usa directamente como
// nombre de tabla — por diseño son el mismo string, así que no hace falta
// una tabla de mapeo aparte.

import { supabase } from '../lib/supabaseClient.js';

export async function getRecords(key) {
  const { data, error } = await supabase
    .from(key)
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error(`[Supabase] Error leyendo ${key}:`, error.message);
    throw error;
  }
  return data ?? [];
}

export async function saveRecord(key, values) {
  // `usuario_id` NO se envía desde el cliente: la columna tiene
  // `default auth.uid()` en el esquema SQL, así que Supabase lo resuelve
  // solo a partir del JWT de la sesión. Evita que el frontend pueda
  // mandar un usuario_id arbitrario (RLS lo rechazaría igual, pero así
  // ni se intenta).
  const { data, error } = await supabase
    .from(key)
    .insert(values)
    .select()
    .single();

  if (error) {
    console.error(`[Supabase] Error guardando en ${key}:`, error.message);
    throw error;
  }
  return data;
}

export async function deleteRecordItem(key, id) {
  const { error } = await supabase
    .from(key)
    .delete()
    .eq('id', id);

  if (error) {
    console.error(`[Supabase] Error borrando de ${key}:`, error.message);
    throw error;
  }
}
