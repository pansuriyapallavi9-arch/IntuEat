'use client';

// Simple SVG line chart for a single series. points: [{ label, value }].
export default function LineChart({ points = [], height = 150, color = 'var(--water)', unit = '' }) {
  if (points.length === 0) return null;

  const values = points.map((p) => p.value);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;
  const pad = 8;
  const w = 100;
  const h = height;

  const x = (i) => (points.length === 1 ? w / 2 : (i / (points.length - 1)) * (w - pad * 2) + pad);
  const y = (v) => h - pad - ((v - min) / range) * (h - pad * 2);

  const path = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${x(i)} ${y(p.value)}`).join(' ');
  const area = `${path} L ${x(points.length - 1)} ${h - pad} L ${x(0)} ${h - pad} Z`;

  return (
    <div style={{ width: '100%' }}>
      <svg viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none" width="100%" height={h}>
        <path d={area} fill="rgba(118,169,208,0.15)" />
        <path d={path} fill="none" stroke={color} strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
        {points.map((p, i) => (
          <circle key={i} cx={x(i)} cy={y(p.value)} r="1.4" fill={color}>
            <title>{`${p.label}: ${p.value}${unit}`}</title>
          </circle>
        ))}
      </svg>
      <div className="flex justify-between px-1" style={{ fontSize: '10px', color: 'var(--text-muted)' }}>
        <span>{points[0].label}</span>
        {points.length > 1 && <span>{points[points.length - 1].label}</span>}
      </div>
    </div>
  );
}
