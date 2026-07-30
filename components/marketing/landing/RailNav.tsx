'use client';

import { useEffect, useState } from 'react';

// Section dot rail (comp: fixed vertical rail on the right edge, one dot per
// section, active dot copper, tracking scroll and clickable to jump). Built
// from THIS page's six real sections — not the comp's seven illustrative dots
// (the comp had a standalone pricing section; ours routes Pricing to /plans).
//
// Treatment copied from the comp's railStyle / dots map:
//   · rail: position:fixed; right:22px; top:50%; gap:14
//   · active dot 9px copper #D89B2A, inactive 6px
//   · inactive colour flips with the active section's ground — light dots on a
//     dark section, dark dots on a light one
//   · hidden below 900px so it doesn't fight the mobile layout
const SECTIONS = [
  { id: 'top', label: 'Hero', dark: true },
  { id: 'fares', label: 'Live fares', dark: false },
  { id: 'where', label: 'Where points go', dark: true },
  { id: 'today', label: 'What you get', dark: false },
  { id: 'rankings', label: 'Card rankings', dark: false },
  { id: 'close', label: 'Close', dark: true },
] as const;

export function RailNav() {
  const [active, setActive] = useState(0);

  useEffect(() => {
    let raf = 0;
    const compute = () => {
      raf = 0;
      // A section is "active" once its top crosses 40% of the viewport — the
      // last such section wins, so tall sections stay lit while scrolling them.
      const marker = window.innerHeight * 0.4;
      let idx = 0;
      for (let i = 0; i < SECTIONS.length; i++) {
        const el = document.getElementById(SECTIONS[i].id);
        if (el && el.getBoundingClientRect().top <= marker) idx = i;
      }
      setActive(idx);
    };
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(compute);
    };
    compute();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
      if (raf) cancelAnimationFrame(raf);
    };
  }, []);

  const inactive = SECTIONS[active].dark ? 'rgba(247,244,239,.35)' : 'rgba(20,35,53,.3)';

  return (
    <>
      <style>{`@media (max-width: 899px){.ciqL-rail{display:none !important}}`}</style>
      <nav
        className="ciqL-rail"
        aria-label="Jump to section"
        style={{
          position: 'fixed',
          right: 22,
          top: '50%',
          transform: 'translateY(-50%)',
          zIndex: 48,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 14,
        }}
      >
        {SECTIONS.map((s, i) => {
          const on = i === active;
          const size = on ? 9 : 6;
          return (
            <a
              key={s.id}
              href={`#${s.id}`}
              title={s.label}
              aria-label={s.label}
              aria-current={on ? 'true' : undefined}
              style={{
                display: 'block',
                width: size,
                height: size,
                borderRadius: 999,
                transition: '200ms cubic-bezier(.2,.8,.2,1)',
                background: on ? '#D89B2A' : inactive,
              }}
            />
          );
        })}
      </nav>
    </>
  );
}
