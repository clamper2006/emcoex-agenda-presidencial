import Icon from '../common/Icon.jsx';

export default function RecordsTable({ columns, records, onDelete, onEdit }) {
  return (
    <div className="card p-0 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-xs text-[var(--text-tertiary)] uppercase tracking-wider border-b divider-line">
              {columns.map((c) => (
                <th key={c.key} className="px-5 py-3 font-medium">{c.label}</th>
              ))}
              <th className="px-5 py-3"></th>
            </tr>
          </thead>
          <tbody>
            {records.map((r) => (
              <tr key={r.id} className="table-row border-b divider-line">
                {columns.map((c) => (
                  <td key={c.key} className="px-5 py-3 text-[var(--text-secondary)]">{String(r[c.key] ?? '—')}</td>
                ))}
                <td className="px-5 py-3 text-right whitespace-nowrap">
                  <button onClick={() => onEdit(r.__raw || r)} className="text-[var(--text-tertiary)] hover:text-[var(--accent)] transition mr-3">
                    <Icon name="pen-tool" className="w-3.5 h-3.5" />
                  </button>
                  <button onClick={() => onDelete(r.id)} className="text-[var(--text-tertiary)] hover:text-rose-400 transition">
                    <Icon name="trash-2" className="w-3.5 h-3.5" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
