import { useRef } from 'react';
import Icon from '../common/Icon.jsx';

export default function DynamicForm({ fields, onSubmit }) {
  const formRef = useRef(null);

  function handleSubmit(e) {
    e.preventDefault();
    const formData = new FormData(formRef.current);
    const values = {};
    fields.forEach((f) => {
      values[f.name] = formData.get(f.name) || '';
    });
    onSubmit(values);
    formRef.current.reset();
  }

  return (
    <form ref={formRef} onSubmit={handleSubmit} className="space-y-3">
      <div className="grid sm:grid-cols-2 gap-3">
        {fields.map((f) => (
          <div key={f.name} className={f.type === 'textarea' ? 'sm:col-span-2' : ''}>
            <label className="text-xs font-medium text-[var(--text-secondary)] mb-1.5 block">{f.label}</label>
            {f.type === 'select' && (
              <select name={f.name} className="input-field" required={f.required} defaultValue="">
                <option value="" disabled>Selecciona una opción</option>
                {f.options.map((o) => (
                  <option key={o} value={o}>{o}</option>
                ))}
              </select>
            )}
            {f.type === 'textarea' && (
              <textarea name={f.name} className="input-field" rows={3} />
            )}
            {f.type !== 'select' && f.type !== 'textarea' && (
              <input type={f.type} name={f.name} className="input-field" required={f.required} />
            )}
          </div>
        ))}
      </div>
      <button type="submit" className="w-full btn-primary rounded-xl py-3 text-sm font-semibold mt-2 flex items-center justify-center gap-2">
        <Icon name="save" className="w-4 h-4" /> Guardar
      </button>
    </form>
  );
}
