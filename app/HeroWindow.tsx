'use client';

import { useState, useEffect } from 'react';
import styles from './page.module.css';

// The hero "cabin window" panel, now carrying the hero clip inside the SAME frame
// (border/radius/overflow) the decorative gradient used — NOT full-bleed behind
// the hero.
//
// Poster-first, always: the first paint is /video/hero-poster.jpg (as the <img>
// below on the server + first client render, and as the <video poster> once the
// clip mounts) — never a blank box.
//
// The clip (hero-loop: seamless ping-pong of one continuous shot; ~87KB webm /
// ~347KB mp4) is requested ONLY on desktop (≥768px) with motion allowed. This is
// a matchMedia guard, deliberately NOT <source media="…">: browsers dropped
// media-attribute support on <video><source>, so it would fetch on mobile anyway.
// Mobile-first, Indian mobile data: no video before LCP under 768px. And
// prefers-reduced-motion:reduce stays on the poster, no playback.
//
// The clip has no audio track — hence muted + no controls, ever.
export function HeroWindow() {
  const [play, setPlay] = useState(false);

  useEffect(() => {
    const desktop = window.matchMedia('(min-width: 768px)');
    const motionOK = window.matchMedia('(prefers-reduced-motion: no-preference)');
    const decide = () => setPlay(desktop.matches && motionOK.matches);
    decide();
    desktop.addEventListener('change', decide);
    motionOK.addEventListener('change', decide);
    return () => {
      desktop.removeEventListener('change', decide);
      motionOK.removeEventListener('change', decide);
    };
  }, []);

  return (
    <div className={styles['hm-window']}>
      {play ? (
        <video
          className={styles['hm-video']}
          poster="/video/hero-poster.jpg"
          autoPlay
          muted
          playsInline
          loop
          preload="metadata"
        >
          {/* webm first (smaller), mp4 fallback. No <source media> — see note above.
              hero-loop.* live in public/videos/ (plural); the poster stays in /video/. */}
          <source src="/videos/hero-loop.webm" type="video/webm" />
          <source src="/videos/hero-loop.mp4" type="video/mp4" />
        </video>
      ) : (
        <img
          className={styles['hm-video']}
          src="/video/hero-poster.jpg"
          alt=""
          aria-hidden="true"
        />
      )}
      <span className={styles['hm-wlabel']}>Cabin window · daylight</span>
    </div>
  );
}
