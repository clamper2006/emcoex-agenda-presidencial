import { useMemo } from 'react';

const PALETTE = ['#d99b29', '#16807a', '#0f1e30', '#8a8f98', '#c2410c'];

export default function DonutChart({ data }) {
  const cx = 60, cy = 60, r = 46, strokeWidth = 16;

  const { total, arcs } = useMemo(() => {
    const total = data.reduce((s, d) => s + d.value, 0);
    const circumference = 2 * Math.PI * r;
    let offsetAcc = 0;

    const arcs = data.map((d, i) => {
      const fraction = total ? d.value / total : 0;
      const dash = fraction * circumference;
      const gap = circumference - dash;
      const rotation = (offsetAcc / (total || 1)) * 360 - 90;
      offsetAcc += d.value;
      return { ...d, dash, gap, rotation, color: PALETTE[i % PALETTE.length] };
    });

    return { total, arcs };
  }, [data]);

  return (
    <div>
      <div className="flex items-center justify-center">
        <svg viewBox="0 0 120 120" className="w-32 h-32">
          <circle cx={cx} cy={cy} r={r} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth={strokeWidth} />
          {arcs.map((d) => (
            <circle
              key={d.label}
              cx={cx}
              cy={cy}
              r={r}
              fill="none"
              stroke={d.color}
              strokeWidth={strokeWidth}
              strokeDasharray={`${d.dash} ${d.gap}`}
              transform={`rotate(${d.rotation} ${cx} ${cy})`}
              strokeLinecap="butt"
              opacity="0.9"
            />
          ))}
          <text x={cx} y={cy + 4} textAnchor="middle" fontSize="16" fontWeight="700" style={{ fill: 'var(--text-primary)' }}>{total}</text>
        </svg>
      </div>
      <div className="mt-3 space-y-1.5">
        {arcs.map((d) => (
          <div key={d.label} className="flex items-center justify-between text-xs">
            <span className="flex items-center gap-2 text-[var(--text-secondary)]">
              <span className="w-2 h-2 rounded-full" style={{ background: d.color }}></span>{d.label}
            </span>
            <span className="font-medium">{d.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
