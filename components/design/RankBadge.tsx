'use client';

interface RankBadgeProps {
  rank: number;
}

const STYLES: Record<number, { bg: string; color: string }> = {
  1: { bg: 'linear-gradient(135deg, #F2D27A, #B8743A)', color: '#1A1208' },
  2: { bg: 'linear-gradient(135deg, #E0E0E0, #9D9D9D)', color: '#16161C' },
  3: { bg: 'linear-gradient(135deg, #D49B6B, #8A5530)', color: '#1A0E08' },
};

export function RankBadge({ rank }: RankBadgeProps) {
  const s = STYLES[rank] || { bg: 'var(--surface)', color: 'var(--ink-3)' };
  return (
    <div
      style={{
        width: 40,
        height: 40,
        borderRadius: '50%',
        background: s.bg,
        color: s.color,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily: 'var(--font-display)',
        fontWeight: 600,
        fontSize: 16,
        flexShrink: 0,
        border: '1px solid rgba(0,0,0,0.1)',
        boxShadow: rank <= 3 ? '0 6px 16px -6px rgba(0,0,0,0.3)' : 'none',
      }}
    >
      {rank}
    </div>
  );
}
