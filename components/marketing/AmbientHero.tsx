'use client';

import { useEffect, useState } from 'react';

// Ambient hero background. POSTER-FIRST (TRD §3): a real poster always renders and
// is never on the critical path; the looping video is progressive enhancement that
// only mounts on desktop AND when the user hasn't asked to reduce motion.
//
// TO GO LIVE / SWAP FOOTAGE: drop the files below into /public. The desktop /
// reduced-motion gating below then does the rest, no other change.
//   poster:  /public/images/hero-poster.jpg   (real optimised frame, always loads)
//   video:   /public/videos/hero-loop.webm    (VP9/AV1, ≤2.5MB)
//            /public/videos/hero-loop.mp4      (H.264 fallback, ≤2.5MB)
// Subject discipline (UIUX §7): destinations our routes reach, licensed footage only.
const VIDEO_READY = true;
const POSTER_SRC = '/images/hero-poster.jpg';
const VIDEO_WEBM = '/videos/hero-loop.webm';
const VIDEO_MP4 = '/videos/hero-loop.mp4';

// ── DARK HERO ────────────────────────────────────────────────────────────────
// The licensed footage is a near-black cabin framing a bright window (sky/wing/
// clouds). The job is NOT to darken a bright plate — it's to STOP washing the
// footage to cream (the old PAPER_WASH) and lay a scrim only where the copy sits,
// so the window still reads while white text clears WCAG AA.
//
// The scrim is tuned against REAL frames, not the poster: ffmpeg pulled 22 frames
// (2fps × 11s) and the brightest luminance landing in any text box is L=0.444
// (clouds, frame 16). At that WORST frame the composite clears white headline
// 7.8:1, body 4.7:1, caption 4.5:1, and the copper CTA ≥5.3:1 vs its brightest
// backdrop — all measured on the actual footage, not a flat colour.
const INK = '8, 10, 14'; // warm near-black scrim colour (not pure #000 — keeps it filmic)

// Layered scrim (topmost layer first): a LEFT weight for the copy column, a BOTTOM
// weight for depth + the dissolve, then a flat floor everywhere.
const SCRIM = [
  `linear-gradient(to right, rgba(${INK}, 0.74) 0%, rgba(${INK}, 0) 68%)`,
  `linear-gradient(to top,   rgba(${INK}, 0.66) 0%, rgba(${INK}, 0) 55%)`,
  `linear-gradient(rgba(${INK}, 0.28), rgba(${INK}, 0.28))`,
].join(', ');

// Poster / no-video ground (mobile + reduced-motion never fetch the video): a dark
// cabin radial so the hero is dark there too, matching the desktop treatment — was a
// warm-cream radial back when the hero sat on cream.
const POSTER_GRADIENT =
  'radial-gradient(120% 90% at 58% 34%, #12161D 0%, #0B0E13 55%, #080A0E 100%)';

// SECTION TRANSITION (boundary option 1): the footage melts into the section below
// over a bottom band, capped by a single copper hairline at the seam — deliberate,
// "jewelry not paint", never a hard cut. The band sits BELOW all copy (the hero's
// paddingBottom clears it), so no white text is ever over the fade.
// It dissolves into --page-bg-rgb — the ground of the section below, which follows the
// theme toggle (cream in light, deep navy in dark). That token is deliberately NOT
// overridden inside .cinematic, so it reflects the page ground, not the hero's dark one.
const DISSOLVE = 'linear-gradient(to top, rgb(var(--page-bg-rgb)) 0%, rgba(var(--page-bg-rgb), 0) 100%)';
const HAIRLINE =
  'linear-gradient(to right, rgba(216,155,42,0) 0%, rgba(216,155,42,0.55) 22%, rgba(216,155,42,0.55) 78%, rgba(216,155,42,0) 100%)';

export function AmbientHero() {
  const [showVideo, setShowVideo] = useState(false);

  useEffect(() => {
    if (!VIDEO_READY) return;
    // Desktop only AND prefers-reduced-motion: no-preference — never fetch video on
    // a 4G phone or for a reduced-motion user (TRD §3 / UIUX §9).
    const desktop = window.matchMedia('(min-width: 768px)');
    const motionOk = window.matchMedia('(prefers-reduced-motion: no-preference)');
    const update = () => setShowVideo(desktop.matches && motionOk.matches);
    update();
    desktop.addEventListener('change', update);
    motionOk.addEventListener('change', update);
    return () => {
      desktop.removeEventListener('change', update);
      motionOk.removeEventListener('change', update);
    };
  }, []);

  return (
    <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', zIndex: 0 }} aria-hidden="true">
      {/* Dark poster stand-in — always present, decodes instantly, never blocks. */}
      <div style={{ position: 'absolute', inset: 0, background: POSTER_GRADIENT }} />

      {/* Progressive-enhancement video (gated; fetches nothing until VIDEO_READY). */}
      {VIDEO_READY && showVideo && (
        <video
          autoPlay
          loop
          muted
          playsInline
          preload="none"
          poster={POSTER_SRC}
          style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }}
        >
          <source src={VIDEO_WEBM} type="video/webm" />
          <source src={VIDEO_MP4} type="video/mp4" />
        </video>
      )}

      {/* Dark scrim — keeps the window readable while white type clears AA (see notes above). */}
      <div style={{ position: 'absolute', inset: 0, background: SCRIM }} />

      {/* Dissolve into the cream section, then a copper hairline exactly at the seam. */}
      <div style={{ position: 'absolute', left: 0, right: 0, bottom: 0, height: 'clamp(88px, 11vw, 150px)', background: DISSOLVE }} />
      <div style={{ position: 'absolute', left: 0, right: 0, bottom: 0, height: 1, background: HAIRLINE }} />
    </div>
  );
}
