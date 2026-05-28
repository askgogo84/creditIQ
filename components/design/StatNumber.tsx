'use client';

import { useEffect, useRef, useState } from 'react';

interface StatNumberProps {
  value: number;
  prefix?: string;
  suffix?: string;
  duration?: number;
  decimals?: number;
}

export function StatNumber({
  value,
  prefix = '',
  suffix = '',
  duration = 1800,
  decimals = 0,
}: StatNumberProps) {
  const ref = useRef<HTMLSpanElement>(null);
  const [displayed, setDisplayed] = useState(0);
  const [started, setStarted] = useState(false);

  useEffect(() => {
    if (!ref.current || started) return;
    const el = ref.current;
    const io = new IntersectionObserver(
      entries => {
        entries.forEach(e => {
          if (e.isIntersecting && !started) {
            setStarted(true);
            const start = performance.now();
            const tick = (t: number) => {
              const p = Math.min((t - start) / duration, 1);
              // Ease out cubic — starts fast, slows to final value
              const eased = 1 - Math.pow(1 - p, 3);
              setDisplayed(value * eased);
              if (p < 1) requestAnimationFrame(tick);
              else setDisplayed(value); // ensure exact final value
            };
            requestAnimationFrame(tick);
            io.unobserve(el);
          }
        });
      },
      { threshold: 0.1, rootMargin: '0px 0px -50px 0px' }
    );
    io.observe(el);
    return () => io.disconnect();
  }, [value, duration, started]);

  const formatted =
    decimals > 0
      ? displayed.toFixed(decimals)
      : Math.round(displayed).toLocaleString('en-IN');

  return (
    <span ref={ref} className="tabular">
      {prefix}{formatted}{suffix}
    </span>
  );
}
