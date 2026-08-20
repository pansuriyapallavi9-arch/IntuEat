'use client';

// Simple responsive bar chart. data: [{ label, value }]. goal draws a dashed target line.
export default function BarChart({ data = [], goal, height = 140, color = 'var(--primary)', unit = '' }) {
  const max = Math.max(goal || 0, ...data.map((d) => d.value), 1);
  const barW = 100 / (data.length || 1);

  return (
    <div style={{ width: '100%' }}>
      <svg viewBox={`0 0 100 ${height}`} preserveAspectRatio="none" width="100%" height={height} style={{ overflow: 'visible' }}>
        {goal ? (
          <line
            x1="0" x2="100"
            y1={height - (goal / max) * (height - 16)}
            y2={height - (goal / max) * (height - 16)}
            stroke="var(--secondary)" strokeWidth="0.5" strokeDasharray="2 2"
          />
        ) : null}
        {data.map((d, i) => {
          const h = (d.value / max) * (height - 16);
          const x = i * barW + barW * 0.2;
          const w = barW * 0.6;
          return (
            <rect
              key={i}
              x={x} y={height - h} width={w} height={Math.max(h, 0.5)}
              rx="1"
              fill={d.highlight ? color : 'rgba(108,154,106,0.45)'}
            >
              <title>{`${d.label}: ${Math.round(d.value)}${unit}`}</title>
            </rect>
          );
        })}
      </svg>
      <div className="mt-1 flex" style={{ fontSize: '10px', color: 'var(--text-muted)' }}>
        {data.map((d, i) => (
          <span key={i} style={{ width: `${barW}%`, textAlign: 'center' }}>{d.label}</span>
        ))}
      </div>
    </div>
  );
}
