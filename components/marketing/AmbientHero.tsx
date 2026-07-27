'use client';

import { useEffect, useState } from 'react';

// Ambient hero background. POSTER-FIRST (TRD §3): a real poster always renders and
// is never on the critical path; the looping video is progressive enhancement that
// only mounts on desktop AND when the user hasn't asked to reduce motion.
//
// ── ASSET GAP ────────────────────────────────────────────────────────────────
// The licensed footage is not sourced yet. Until it is:
//   • the "poster" is a CSS gradient stand-in (clearly a placeholder), and
//   • the <video> is fully wired but gated behind VIDEO_READY=false so nothing is
//     fetched (no 404s) anywhere.
// TO GO LIVE: drop the files below into /public and flip VIDEO_READY to true —
// the desktop/reduced-motion gating below then does the rest, no other change.
//   poster:  /public/images/hero-poster.jpg   (real optimised frame, always loads)
//   video:   /public/videos/hero-loop.webm    (VP9/AV1, ≤2.5MB)
//            /public/videos/hero-loop.mp4      (H.264 fallback, ≤2.5MB)
// Subject discipline (UIUX §7): destinations our routes reach (Burj Khalifa,
// Marina Bay, etc.), licensed footage only.
const VIDEO_READY = false;
const POSTER_SRC = '/images/hero-poster.jpg';
const VIDEO_WEBM = '/videos/hero-loop.webm';
const VIDEO_MP4 = '/videos/hero-loop.mp4';

const INK_OVERLAY = 'rgba(14,20,32,0.72)';
// Placeholder poster: deep-ink gradient so the hero reads as atmosphere, not a blank.
const POSTER_GRADIENT =
  'radial-gradient(120% 90% at 80% 10%, #17233f 0%, #0E1420 55%, #080d18 100%)';

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
      {/* Poster stand-in — always present, decodes instantly, never blocks. */}
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

      {/* Ink overlay so type stays legible and imagery reads as atmosphere. */}
      <div style={{ position: 'absolute', inset: 0, background: INK_OVERLAY }} />
    </div>
  );
}
