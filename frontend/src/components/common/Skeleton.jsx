const shimmer = {
  background: 'linear-gradient(90deg, rgba(255,255,255,0.04) 0%, rgba(255,255,255,0.12) 50%, rgba(255,255,255,0.04) 100%)',
  backgroundSize: '200% 100%',
  animation: 'skeletonShimmer 1.2s infinite linear',
};

export const SkeletonBlock = ({ height = 16, width = '100%', radius = 8 }) => (
  <div
    style={{
      width,
      height,
      borderRadius: radius,
      backgroundColor: 'var(--bg-surface-muted)',
      ...shimmer,
    }}
  />
);

export const SkeletonCard = () => (
  <div
    style={{
      background: 'var(--bg-surface)',
      border: '1px solid var(--border-default)',
      borderRadius: '0.75rem',
      padding: '1rem',
      display: 'flex',
      flexDirection: 'column',
      gap: '0.6rem',
    }}
  >
    <SkeletonBlock width="38%" height={14} />
    <SkeletonBlock width="70%" height={28} />
  </div>
);

export const SkeletonTable = ({ rows = 6, cols = 5 }) => (
  <div style={{ border: '1px solid var(--border-default)', borderRadius: '0.75rem', overflow: 'hidden', background: 'var(--bg-surface)' }}>
    <div style={{ padding: '0.75rem', borderBottom: '1px solid var(--border-default)', background: 'var(--bg-surface-muted)' }}>
      <SkeletonBlock height={14} width="25%" />
    </div>
    <div style={{ padding: '0.75rem', display: 'grid', gap: '0.6rem' }}>
      {Array.from({ length: rows }).map((_, r) => (
        <div key={r} style={{ display: 'grid', gridTemplateColumns: `repeat(${cols}, minmax(0,1fr))`, gap: '0.5rem' }}>
          {Array.from({ length: cols }).map((__, c) => <SkeletonBlock key={c} height={14} width="100%" />)}
        </div>
      ))}
    </div>
    <style>{`
      @keyframes skeletonShimmer {
        0% { background-position: 200% 0; }
        100% { background-position: -200% 0; }
      }
    `}</style>
  </div>
);

