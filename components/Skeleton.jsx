// Lightweight skeleton primitives used by route-level loading.jsx files.
// Pure presentational — no client JS needed.

export function Skeleton({ className = '', style }) {
  return <div className={`skeleton ${className}`} style={style} />;
}

// A glass card wrapper with skeleton content inside.
export function SkeletonCard({ className = '', children, style }) {
  return (
    <div className={`glass p-5 ${className}`} style={style}>
      {children}
    </div>
  );
}

// A shimmering circle (for rings / avatars).
export function SkeletonCircle({ size = 76 }) {
  return <Skeleton className="rounded-full" style={{ width: size, height: size }} />;
}

// A text line; width is a CSS length (e.g. '60%', '8rem').
export function SkeletonLine({ width = '100%', height = 14, className = '' }) {
  return <Skeleton className={className} style={{ width, height }} />;
}

// Standard page header skeleton (title + subtitle).
export function SkeletonHeader({ titleWidth = '9rem' }) {
  return (
    <div className="mb-5">
      <SkeletonLine width={titleWidth} height={30} className="mb-2" />
      <SkeletonLine width="14rem" height={14} />
    </div>
  );
}
