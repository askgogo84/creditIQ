'use client';

import { useEffect, useState } from 'react';

// §01 "Where points can go" — the light-keyed, near-monochrome points clip as the
// section's right-half media. Same poster-first / desktop+motion gate as HomeHeroBg
// (app/HomeHeroBg.tsx), pointed at the points assets — but with NO scrim. The footage
// is light-keyed and near-monochrome, so it reads on the white band untouched;
// darkening it is the one thing we must not do (it is the whole reason for this clip).
//
// ASSETS live in /video/ SINGULAR (…/videos/ plural is the auth-bg clip — see the
// "video folder singular vs plural" project memory):
//   poster:  /video/points-poster.jpg   1280×720
//   video:   /video/points-loop.webm     VP9,  1280×720, seamless 17.2s ping-pong
//            /video/points-loop.mp4      H.264 fallback, same
//
// POSTER-FIRST, ALWAYS: the poster renders on the server + first client paint, and on
// mobile (<768px) OR reduced-motion it IS the media — the clip is fetched ONLY on
// desktop with motion allowed (matchMedia guard, NOT <source media> which browsers
// ignore and would fetch anyway). Mobile-first, Indian mobile data.
const POSTER = '/video/points-poster.jpg';
const VIDEO_WEBM = '/video/points-loop.webm';
const VIDEO_MP4 = '/video/points-loop.mp4';

export function HomePointsMedia() {
  const [showVideo, setShowVideo] = useState(false);

  useEffect(() => {
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
    <>
      {/* Poster — server + first paint, and IS the media on mobile / reduced-motion. */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={POSTER}
        alt="A child holding a toy plane aloft against a bright daytime sky"
        style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }}
      />

      {/* Progressive clip — webm first (smaller), mp4 fallback. Muted, playsinline, loop,
          no controls. NO scrim: the light-keyed, near-monochrome footage reads on the
          white band untouched. */}
      {showVideo && (
        <video
          autoPlay
          loop
          muted
          playsInline
          preload="metadata"
          poster={POSTER}
          aria-hidden="true"
          style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }}
        >
          <source src={VIDEO_WEBM} type="video/webm" />
          <source src={VIDEO_MP4} type="video/mp4" />
        </video>
      )}
    </>
  );
}
