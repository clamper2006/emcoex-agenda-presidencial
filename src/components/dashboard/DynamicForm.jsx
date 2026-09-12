import { useMemo, useRef, useState } from 'react';
import Icon from '../common/Icon.jsx';

// Iteración (Distribución y Destinos): soporte genérico para campos
// `type: 'computed'` en la configuración data-driven de agendaConfig.js —
// no es una implementación especial de Despachos, cualquier sección puede
// definir un campo con `computeFrom`/`compute`/`format` y funcionará igual.
//
// El resto del formulario sigue siendo NO controlado (se lee de FormData
// en el submit, como antes). Solo se agrega estado mínimo (`liveValues`)
// para los campos que participan en algún cálculo en vivo: los que un
// campo `computed` declara en `computeFrom`, para poder recalcular el
// resultado en cada cambio y mostrarlo antes de guardar.
export default function DynamicForm({ fields, onSubmit, initialValues, submitLabel }) {
  const formRef = useRef(null);
  // Modo edición: initialValues precarga tanto los <input>/<select> no
  // controlados (vía defaultValue) como liveValues (para que un campo
  // `computed` muestre su total ya calculado desde el primer render, no
  // solo después de tocar el campo).
  const [liveValues, setLiveValues] = useState(initialValues || {});
  const [formError, setFormError] = useState('');

  const computedFields = useMemo(() => fields.filter((f) => f.type === 'computed'), [fields]);
  const sourceNames = useMemo(
    () => new Set(computedFields.flatMap((f) => f.computeFrom || [])),
    [computedFields]
  );

  const computedResults = useMemo(() => {
    const results = {};
    computedFields.forEach((f) => {
      results[f.name] = f.compute ? f.compute(liveValues) : null;
    });
    return results;
  }, [computedFields, liveValues]);

  function handleLiveChange(name, value) {
    setLiveValues((prev) => ({ ...prev, [name]: value }));
  }

  function handleSubmit(e) {
    e.preventDefault();

    // Un campo calculado requerido no puede depender del `required` nativo
    // del HTML (no es un <input> real) — se valida acá antes de armar
    // `values`, para nunca mandar un total inválido/pendiente a guardar.
    for (const f of computedFields) {
      if (f.required && computedResults[f.name] == null) {
        setFormError(`Completa los campos necesarios para calcular "${f.label}".`);
        return;
      }
    }
    setFormError('');

    const formData = new FormData(formRef.current);
    const values = {};
    fields.forEach((f) => {
      if (f.type === 'computed') {
        values[f.name] = computedResults[f.name] ?? '';
      } else {
        values[f.name] = formData.get(f.name) || '';
      }
    });
    onSubmit(values);
    if (!initialValues) {
      // Solo se limpia el formulario en modo "agregar". En modo edición
      // el formulario se desmonta (AgendaScreen cierra el panel al
      // guardar), así que resetear acá no aplica y podría pisar el
      // último render con valores vacíos.
      formRef.current.reset();
      setLiveValues({});
    }
  }

  return (
    <form ref={formRef} onSubmit={handleSubmit} className="space-y-3">
      <div className="grid sm:grid-cols-2 gap-3">
        {fields.map((f) => (
          <div key={f.name} className={f.type === 'textarea' || f.type === 'computed' ? 'sm:col-span-2' : ''}>
            <label className="text-xs font-medium text-[var(--text-secondary)] mb-1.5 block">{f.label}</label>
            {f.type === 'select' && (
              <select name={f.name} className="input-field" required={f.required} defaultValue={initialValues?.[f.name] ?? ''}>
                <option value="" disabled>Selecciona una opción</option>
                {f.options.map((o) => (
                  <option key={o} value={o}>{o}</option>
                ))}
              </select>
            )}
            {f.type === 'textarea' && (
              <textarea name={f.name} className="input-field" rows={3} defaultValue={initialValues?.[f.name] ?? ''} />
            )}
            {f.type === 'computed' && (
              <div
                className={`input-field flex items-center min-h-[2.75rem] cursor-not-allowed select-none ${computedResults[f.name] == null ? 'text-[var(--text-tertiary)] text-xs' : 'font-semibold'}`}
                aria-live="polite"
              >
                {f.format ? f.format(computedResults[f.name], liveValues) : (computedResults[f.name] ?? '—')}
              </div>
            )}
            {f.type !== 'select' && f.type !== 'textarea' && f.type !== 'computed' && (
              <input
                type={f.type}
                name={f.name}
                className="input-field"
                required={f.required}
                min={f.min}
                step={f.step}
                defaultValue={initialValues?.[f.name] ?? ''}
                onChange={sourceNames.has(f.name) ? (e) => handleLiveChange(f.name, e.target.value) : undefined}
              />
            )}
          </div>
        ))}
      </div>
      {formError && (
        <p className="text-xs text-rose-500 font-medium">{formError}</p>
      )}
      <button type="submit" className="w-full btn-primary rounded-xl py-3 text-sm font-semibold mt-2 flex items-center justify-center gap-2">
        <Icon name="save" className="w-4 h-4" /> {submitLabel || 'Guardar'}
      </button>
    </form>
  );
}
