'use client';

// Full-bleed background for the homepage hero band — the poster-first wrapper for
// the WebGL earth-night globe (HomeGlobe). Twin of HomeHeroBg: same discipline,
// pointed at the globe instead of the cabin clip.
//
// POSTER-FIRST, ALWAYS: /globe/globe-poster.jpg (36KB) renders on the server + first
// client paint and IS the final state for anyone we don't hydrate. It is the LCP
// element of this band (see the <link rel=preload> in page.tsx) — the ~470KB globe
// engine + 170KB texture are code-split and fetched only AFTER load, off the LCP path.
//
// WHO GETS THE LIVE 3D — and the connection-gate contract:
//   hydrate  ⇔  desktop (≥768px)  AND  prefers-reduced-motion: no-preference  AND
//               the Network Information API does NOT report a downgrade.
//   The Network Information API is DOWNGRADE-ONLY. navigator.connection is absent in
//   Safari and Firefox, so its effectiveType is `undefined` there — treating it as a
//   REQUIREMENT would silently blanket-disable the globe for every Mac/Firefox desktop
//   user. So: when the API is UNAVAILABLE we do NOT block (Safari/Firefox desktop get
//   the globe); it can only DOWNGRADE to the poster when present AND reporting saveData
//   or a slow effectiveType (slow-2g/2g/3g). An unsupported API never disables.
//
// Mobile / reduced-motion / saveData / slow link → the 36KB poster, forever. Never a
// degraded animation.

import { useEffect, useRef, useState } from 'react';
import dynamic from 'next/dynamic';

// Code-split point: importing HomeGlobe pulls in three + globe.gl. ssr:false keeps
// WebGL off the server render and out of the static marketing HTML crawlers get.
const HomeGlobe = dynamic(() => import('./HomeGlobe'), { ssr: false });

const POSTER_SRC = '/globe/globe-poster.jpg';

// Navy ground under the poster (matches the globe's #020617 background + a soft blue
// atmosphere lift on the right, where the globe sits). Keeps the band dark even before
// the poster decodes and behind the globe's transparent canvas.
const GROUND =
  'radial-gradient(120% 100% at 63% 42%, #0b1a34 0%, #061024 46%, #020617 100%)';

// Scrim — the globe/navy is already dark, so this is lighter than HomeHeroBg's. A LEFT
// weight holds the copy column legible; released by ~66% so the globe on the right shows.
const INK = '2, 6, 23';
const SCRIM = [
  `linear-gradient(to bottom, rgba(${INK}, 0.45) 0, rgba(${INK}, 0) 170px)`,
  `linear-gradient(to right, rgba(${INK}, 0.82) 0%, rgba(${INK}, 0.30) 44%, rgba(${INK}, 0) 66%)`,
  `linear-gradient(rgba(${INK}, 0.18), rgba(${INK}, 0.18))`,
].join(', ');

// Dissolve into the cream section below + a copper hairline exactly at the seam —
// identical treatment to HomeHeroBg so the §01→§02 seam is unchanged.
const DISSOLVE = 'linear-gradient(to top, #F7F1E6 0%, rgba(247,241,230,0) 100%)';
const HAIRLINE =
  'linear-gradient(to right, rgba(154,101,22,0) 0%, rgba(154,101,22,0.5) 22%, rgba(154,101,22,0.5) 78%, rgba(154,101,22,0) 100%)';

interface NetworkInformation {
  saveData?: boolean;
  effectiveType?: string;
}

// requestIdleCallback isn't in every lib.dom target — type it as optional.
type IdleWindow = Window & {
  requestIdleCallback?: (cb: () => void, opts?: { timeout: number }) => number;
  cancelIdleCallback?: (id: number) => void;
};

export function HomeGlobeBg() {
  const [mount, setMount] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const desktop = window.matchMedia('(min-width: 768px)');
    const motionOk = window.matchMedia('(prefers-reduced-motion: no-preference)');

    // Downgrade-only network signal. Absence (Safari/FF) = NOT a downgrade.
    const conn = (navigator as Navigator & { connection?: NetworkInformation }).connection;
    const networkDowngrade = conn
      ? conn.saveData === true ||
        (typeof conn.effectiveType === 'string' &&
          ['slow-2g', '2g', '3g'].includes(conn.effectiveType))
      : false;

    const allowed = desktop.matches && motionOk.matches && !networkDowngrade;
    if (!allowed) return; // poster is the final state

    let idleId = 0;
    let started = false;
    let cleanupIO = () => {};

    // Defer past load + idle, and only once the band is near the viewport, so the
    // engine download never competes with LCP.
    const armObserver = () => {
      const io = new IntersectionObserver(
        ([entry]) => {
          if (!entry.isIntersecting || started) return;
          started = true;
          io.disconnect();
          const go = () => setMount(true);
          const w = window as IdleWindow;
          if (w.requestIdleCallback) {
            idleId = w.requestIdleCallback(go, { timeout: 2000 });
          } else {
            idleId = window.setTimeout(go, 200);
          }
        },
        { rootMargin: '200px' },
      );
      if (rootRef.current) io.observe(rootRef.current);
      cleanupIO = () => io.disconnect();
    };

    if (document.readyState === 'complete') armObserver();
    else window.addEventListener('load', armObserver, { once: true });

    return () => {
      window.removeEventListener('load', armObserver);
      cleanupIO();
      if (idleId) {
        const w = window as IdleWindow;
        if (w.cancelIdleCallback) w.cancelIdleCallback(idleId);
        else clearTimeout(idleId);
      }
    };
  }, []);

  return (
    <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', zIndex: 0 }} aria-hidden="true" ref={rootRef}>
      {/* Poster ground — always present, decodes instantly, LCP-safe. On everyone we
          don't hydrate, THIS is the globe. */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          backgroundColor: '#020617',
          backgroundImage: `url('${POSTER_SRC}'), ${GROUND}`,
          backgroundSize: 'cover, cover',
          backgroundPosition: 'center, center',
          backgroundRepeat: 'no-repeat, no-repeat',
        }}
      />

      {/* Live 3D globe — mounted only when hydration is allowed AND the band is in view. */}
      {mount && <HomeGlobe />}

      {/* Scrim — keeps the light headline/CTA legible over the globe. */}
      <div style={{ position: 'absolute', inset: 0, background: SCRIM }} />

      {/* Dissolve into the cream band below, then the copper hairline at the seam. */}
      <div style={{ position: 'absolute', left: 0, right: 0, bottom: 0, height: 'clamp(64px, 8vw, 120px)', background: DISSOLVE }} />
      <div style={{ position: 'absolute', left: 0, right: 0, bottom: 0, height: 1, background: HAIRLINE }} />
    </div>
  );
}
