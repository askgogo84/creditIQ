'use client';

import { useEffect, useState } from 'react';

// Full-bleed ambient background for the merged homepage hero — the licensed cabin
// clip becomes the background of the WHOLE hero section (headline + slider + proof
// card sit ON it), matching /landing's AmbientHero treatment. This is the home twin
// of components/marketing/AmbientHero.tsx: same poster-first / desktop-gated logic,
// but pointed at the home assets, with a scrim weighted for THIS footage.
//
// ASSETS (note /video/ SINGULAR — /videos/ plural is the auth-bg folder, a different
// clip; see the "video folder singular vs plural" project memory):
//   poster:  /video/hero-bg-poster.jpg   1120×660, watermark cropped out
//   video:   /video/hero-bg-loop.webm     VP9,  1120×660, seamless 20s loop
//            /video/hero-bg-loop.mp4      H.264 fallback, same
//
// POSTER-FIRST, ALWAYS: the poster renders on the server + first client paint and on
// mobile/reduced-motion it IS the footage — the ~460KB clip is fetched ONLY on desktop
// (≥768px) with motion allowed. A matchMedia guard, deliberately NOT <source media>
// (browsers dropped media-attr support on <video><source>, so it would fetch anyway).
const POSTER_SRC = '/video/hero-bg-poster.jpg';
const VIDEO_WEBM = '/video/hero-bg-loop.webm';
const VIDEO_MP4 = '/video/hero-bg-loop.mp4';

// Warm near-black scrim colour (not pure #000 — keeps it filmic).
const INK = '8, 10, 14';

// SCRIM — tuned against the REAL frames, not a flat colour. ffprobe/signalstats over
// the copy-column region (left 52%) found the BRIGHT sky/clouds sit UPPER-LEFT, right
// where the headline lands: headline band YAVG peaks ~0.37 (blown cloud highlights to
// 255), the slider band lower-left is darker (~0.26). So the weight is TOP-LEFT, not
// bottom-for-depth like /landing. Layers, topmost first:
//   · a top weight (nav + the bright sky band) so the white nav/headline clear AA,
//   · a strong LEFT weight, held across the headline width by a mid stop then released
//     by 72% so the open sky + the (light) proof card still show the footage,
//   · a flat floor everywhere.
// Result over the brightest frame: white headline/range and the slider labels stay
// legible (verified in-browser at the peak frame).
const SCRIM = [
  `linear-gradient(to bottom, rgba(${INK}, 0.55) 0, rgba(${INK}, 0) 170px)`,
  `linear-gradient(to right, rgba(${INK}, 0.90) 0%, rgba(${INK}, 0.42) 46%, rgba(${INK}, 0) 72%)`,
  `linear-gradient(rgba(${INK}, 0.30), rgba(${INK}, 0.30))`,
].join(', ');

// Poster / no-video ground (mobile + reduced-motion never fetch the video): a dark
// cabin radial under the poster so the hero is dark there too. The radial is pulled
// toward the left (where the copy sits) so poster-only mobile stays legible under it.
const POSTER_GRADIENT =
  'radial-gradient(120% 90% at 40% 30%, #12161D 0%, #0B0E13 55%, #080A0E 100%)';

// SECTION TRANSITION: the footage melts into the cream band below over a bottom band,
// capped by a single copper hairline at the seam — "jewelry, not paint", never a hard
// cut. The band sits BELOW all copy (the hero's paddingBottom clears it). Dissolves
// into the next section's cream ground (#F7F1E6).
const DISSOLVE = 'linear-gradient(to top, #F7F1E6 0%, rgba(247,241,230,0) 100%)';
const HAIRLINE =
  'linear-gradient(to right, rgba(154,101,22,0) 0%, rgba(154,101,22,0.5) 22%, rgba(154,101,22,0.5) 78%, rgba(154,101,22,0) 100%)';

export function HomeHeroBg() {
  const [showVideo, setShowVideo] = useState(false);

  useEffect(() => {
    // Desktop only AND prefers-reduced-motion: no-preference — never fetch the clip on
    // a phone or for a reduced-motion user. Mobile-first, Indian mobile data.
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
      {/* Real poster frame over a dark cabin radial — always present, decodes instantly,
          never blocks. On mobile AND reduced-motion the video never mounts, so THIS is
          the footage. */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          backgroundColor: '#0B0E13',
          backgroundImage: `url('${POSTER_SRC}'), ${POSTER_GRADIENT}`,
          backgroundSize: 'cover, cover',
          backgroundPosition: 'center, center',
          backgroundRepeat: 'no-repeat, no-repeat',
        }}
      />

      {/* Progressive-enhancement clip — webm first (smaller), mp4 fallback. Muted (no
          audio track), playsinline, loop, no controls. */}
      {showVideo && (
        <video
          autoPlay
          loop
          muted
          playsInline
          preload="metadata"
          poster={POSTER_SRC}
          style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }}
        >
          <source src={VIDEO_WEBM} type="video/webm" />
          <source src={VIDEO_MP4} type="video/mp4" />
        </video>
      )}

      {/* Dark scrim — keeps the clip readable while light type clears AA (see note above). */}
      <div style={{ position: 'absolute', inset: 0, background: SCRIM }} />

      {/* Dissolve into the cream section below, then a copper hairline exactly at the seam. */}
      <div style={{ position: 'absolute', left: 0, right: 0, bottom: 0, height: 'clamp(64px, 8vw, 120px)', background: DISSOLVE }} />
      <div style={{ position: 'absolute', left: 0, right: 0, bottom: 0, height: 1, background: HAIRLINE }} />
    </div>
  );
}
