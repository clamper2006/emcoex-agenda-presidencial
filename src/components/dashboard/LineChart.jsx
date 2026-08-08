import { useMemo } from 'react';

// Adaptado del ERP-Comex original: mismo cálculo geométrico del path SVG,
// pero ahora recibe datos reales (labels/values) en vez de generarlos con
// una semilla pseudoaleatoria por rol.
export default function LineChart({ labels, values }) {
  const { linePath, areaPath, points } = useMemo(() => {
    const data = values.length > 1 ? values : [...values, values[0] ?? 0];
    const w = 400, h = 140, pad = 10;
    const maxV = Math.max(...data), minV = Math.min(...data);
    const stepX = (w - pad * 2) / (data.length - 1 || 1);
    const pts = data.map((v, i) => {
      const x = pad + i * stepX;
      const y = h - pad - ((v - minV) / (maxV - minV || 1)) * (h - pad * 2);
      return { x, y };
    });
    const pointsStr = pts.map((p) => `${p.x},${p.y}`);
    const linePath = 'M ' + pointsStr.join(' L ');
    const areaPath = `M ${pad},${h - pad} L ` + pointsStr.join(' L ') + ` L ${w - pad},${h - pad} Z`;
    return { linePath, areaPath, points: pts };
  }, [values]);

  return (
    <div>
      <svg viewBox="0 0 400 140" className="w-full h-36">
        <defs>
          <linearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#d99b29" stopOpacity="0.35" />
            <stop offset="100%" stopColor="#d99b29" stopOpacity="0" />
          </linearGradient>
        </defs>
        <path d={areaPath} fill="url(#areaGradient)" />
        <path d={linePath} fill="none" stroke="#d99b29" strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round" />
        {points.map((p, i) => (
          <circle key={i} cx={p.x} cy={p.y} r="3" fill="#d99b29" />
        ))}
      </svg>
      <div className="flex justify-between text-[10px] text-[var(--text-tertiary)] mt-1 px-1">
        {labels.map((l) => <span key={l}>{l}</span>)}
      </div>
    </div>
  );
}
