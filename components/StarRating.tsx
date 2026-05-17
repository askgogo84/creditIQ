'use client';
import { useState, useEffect } from 'react';
import { Star } from 'lucide-react';

interface Props {
  cardId: string;
  initialRating?: number;
  initialCount?: number;
  size?: 'sm' | 'md';
}

export function StarRating({ cardId, initialRating = 0, initialCount = 0, size = 'sm' }: Props) {
  const [rating, setRating] = useState(initialRating);
  const [count, setCount] = useState(initialCount);
  const [hover, setHover] = useState(0);
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Check localStorage for previous rating
    const prev = localStorage.getItem(`rating-${cardId}`);
    if (prev) setSubmitted(true);
    // Fetch current ratings
    fetch(`/api/ratings?cardId=${cardId}`)
      .then(r => r.json())
      .then(d => { if (d.avg) { setRating(d.avg); setCount(d.count); } })
      .catch(() => {});
  }, [cardId]);

  const submit = async (val: number) => {
    if (submitted || loading) return;
    setLoading(true);
    try {
      await fetch('/api/ratings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cardId, rating: val }),
      });
      localStorage.setItem(`rating-${cardId}`, val.toString());
      setRating((rating * count + val) / (count + 1));
      setCount(c => c + 1);
      setSubmitted(true);
    } catch {}
    setLoading(false);
  };

  const starSize = size === 'sm' ? 'w-3.5 h-3.5' : 'w-5 h-5';

  return (
    <div className="flex items-center gap-1.5">
      <div className="flex items-center gap-0.5">
        {[1,2,3,4,5].map(i => (
          <button
            key={i}
            onClick={() => submit(i)}
            onMouseEnter={() => !submitted && setHover(i)}
            onMouseLeave={() => !submitted && setHover(0)}
            disabled={submitted || loading}
            style={{ background: 'none', border: 'none', padding: 1, cursor: submitted ? 'default' : 'pointer' }}
          >
            <Star
              className={starSize}
              fill={(hover || rating) >= i ? 'var(--accent)' : 'transparent'}
              stroke={(hover || rating) >= i ? 'var(--accent)' : 'var(--text-dim)'}
            />
          </button>
        ))}
      </div>
      {count > 0 && (
        <span style={{ fontSize: 11, color: 'var(--text-dim)', fontFamily: 'monospace' }}>
          {rating.toFixed(1)} ({count})
        </span>
      )}
      {!submitted && count === 0 && (
        <span style={{ fontSize: 11, color: 'var(--text-dim)' }}>Rate this card</span>
      )}
    </div>
  );
}
