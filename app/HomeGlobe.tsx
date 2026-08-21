'use client';

// The WebGL earth-night globe for the homepage hero band. Ported from
// docs/travel-redesign/preview.html, with three deliberate changes for a
// signup-critical landing surface:
//
//   1. THREE IS IMPORTED ONCE. The mockup loaded globe.gl (which bundles
//      three-globe → three) AND a second three@0.180.0 from esm.sh, so two
//      copies sat in memory and the airplane (built from esm three) was added
//      to globe.gl's internal-three scene — a version-skew bug. Here both the
//      globe and the airplane use the SAME `three` (npm-deduped to one copy;
//      verified via `npm ls three`). The airplane in globe.scene() is now the
//      same three instance the renderer walks.
//   2. SELF-HOSTED. Texture is /globe/earth-night.jpg (re-encoded, 170KB); the
//      earth-topology bump map is dropped (invisible at hero scale). No CDN.
//   3. AMBIENT, NOT INTERACTIVE. No search panel / button. The BLR→HND flight
//      autoplays when the band scrolls into view and LOOPS. The camera does NOT
//      chase the plane (the mockup's zoom-follow is nauseating behind headline
//      copy) — the globe holds its framing; only the plane + neon arc move.
//
// LIFECYCLE (the load-discipline the hero demands):
//   · This whole module is code-split (dynamic import in HomeGlobeBg), so the
//     ~470KB engine never enters the landing's critical path.
//   · The rAF loop is HARD-STOPPED off-screen and on a hidden tab:
//     globe.pauseAnimation() halts globe.gl's internal render ticker, and our
//     own flight rAF is cancelled. Both resume only when visible AND focused.
//   · On unmount everything is disposed (renderer, geometries, materials, canvas).

import { useEffect, useRef } from 'react';
import Globe, { type GlobeInstance } from 'globe.gl';
import * as THREE from 'three';

// getCoords (lat/lng/alt → scene XYZ) is proxied from three-globe at runtime but
// is missing from globe.gl's shipped .d.ts — declare the one method we call.
type GlobeWithCoords = GlobeInstance & {
  getCoords(lat: number, lng: number, altitude?: number): { x: number; y: number; z: number };
};

const SOURCE = { code: 'BLR', name: 'Bengaluru', lat: 12.9716, lng: 77.5946 };
const DEST = { code: 'HND', name: 'Tokyo', lat: 35.6762, lng: 139.6503 };
const TEXTURE = '/globe/earth-night.jpg';

// Great-circle interpolation — unchanged maths from the mockup.
function interpolateGreatCircle(
  start: { lat: number; lng: number },
  end: { lat: number; lng: number },
  t: number,
): { lat: number; lng: number } {
  const lat1 = THREE.MathUtils.degToRad(start.lat);
  const lon1 = THREE.MathUtils.degToRad(start.lng);
  const lat2 = THREE.MathUtils.degToRad(end.lat);
  const lon2 = THREE.MathUtils.degToRad(end.lng);
  const d =
    2 *
    Math.asin(
      Math.sqrt(
        Math.pow(Math.sin((lat2 - lat1) / 2), 2) +
          Math.cos(lat1) * Math.cos(lat2) * Math.pow(Math.sin((lon2 - lon1) / 2), 2),
      ),
    );
  if (d === 0) return { lat: start.lat, lng: start.lng };
  const A = Math.sin((1 - t) * d) / Math.sin(d);
  const B = Math.sin(t * d) / Math.sin(d);
  const x = A * Math.cos(lat1) * Math.cos(lon1) + B * Math.cos(lat2) * Math.cos(lon2);
  const y = A * Math.cos(lat1) * Math.sin(lon1) + B * Math.cos(lat2) * Math.sin(lon2);
  const z = A * Math.sin(lat1) + B * Math.sin(lat2);
  const lat = Math.atan2(z, Math.sqrt(x * x + y * y));
  const lon = Math.atan2(y, x);
  return { lat: THREE.MathUtils.radToDeg(lat), lng: THREE.MathUtils.radToDeg(lon) };
}

export default function HomeGlobe() {
  const mountRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = mountRef.current;
    if (!el) return;

    const globe = new Globe(el, {
      rendererConfig: { antialias: true, alpha: true, powerPreference: 'low-power' },
    }) as GlobeWithCoords;

    globe
      .globeImageUrl(TEXTURE)
      .backgroundColor('rgba(0,0,0,0)') // transparent — the poster/navy band shows through
      .showAtmosphere(true)
      .atmosphereColor('#2563eb')
      .atmosphereAltitude(0.18)
      .pointOfView({ lat: 22, lng: 105, altitude: 2.1 }, 0);

    // Keep the framing steady: the arc is the story. No user drag, no auto-rotate.
    const controls = globe.controls();
    controls.enabled = false;
    controls.autoRotate = false;

    const sizeToBox = () => globe.width(el.clientWidth).height(el.clientHeight);
    sizeToBox();

    // City markers + labels (source green, destination cyan).
    globe
      .pointsData([
        { ...SOURCE, color: '#00ff88' },
        { ...DEST, color: '#00d4ff' },
      ])
      .pointLat('lat')
      .pointLng('lng')
      .pointColor('color')
      .pointAltitude(0.025)
      .pointRadius(0.6);
    globe
      .labelsData([
        { lat: SOURCE.lat, lng: SOURCE.lng, altitude: 0.07, text: 'BLR · BENGALURU' },
        { lat: DEST.lat, lng: DEST.lng, altitude: 0.07, text: 'HND · TOKYO' },
      ])
      .labelLat('lat')
      .labelLng('lng')
      .labelAltitude('altitude' as never)
      .labelText('text')
      .labelSize(1.35)
      .labelColor(() => 'rgba(255,255,255,0.9)')
      .labelDotRadius(0)
      .labelResolution(2);

    // ── Airplane, built from the SAME three the globe uses (single instance) ──
    const plane = new THREE.Group();
    const mat = new THREE.MeshBasicMaterial({ color: 0xffffff });
    const geos: THREE.BufferGeometry[] = [];
    const addPart = (geo: THREE.BufferGeometry, place: (m: THREE.Mesh) => void) => {
      geos.push(geo);
      const mesh = new THREE.Mesh(geo, mat);
      place(mesh);
      plane.add(mesh);
    };
    addPart(new THREE.CylinderGeometry(0.45, 0.65, 5, 16), (m) => (m.rotation.x = Math.PI / 2));
    addPart(new THREE.ConeGeometry(0.46, 1.5, 16), (m) => {
      m.rotation.x = Math.PI / 2;
      m.position.z = 3.2;
    });
    addPart(new THREE.BoxGeometry(6, 0.18, 1.4), () => {});
    addPart(new THREE.BoxGeometry(2.8, 0.14, 0.8), (m) => (m.position.z = -2));
    addPart(new THREE.BoxGeometry(0.15, 1.7, 1.3), (m) => {
      m.position.y = 0.8;
      m.position.z = -2;
    });
    const glowMat = new THREE.MeshBasicMaterial({ color: 0x00d4ff, transparent: true, opacity: 0.18 });
    const glowGeo = new THREE.SphereGeometry(2.4, 20, 20);
    plane.add(new THREE.Mesh(glowGeo, glowMat));
    plane.scale.set(0.8, 0.8, 0.8);
    plane.visible = false;
    globe.scene().add(plane);

    const flightPosition = (t: number) => {
      const geo = interpolateGreatCircle(SOURCE, DEST, t);
      const altitude = 0.03 + Math.sin(Math.PI * t) * 0.35;
      const p = globe.getCoords(geo.lat, geo.lng, altitude);
      return { geo, position: new THREE.Vector3(p.x, p.y, p.z) };
    };

    // The neon arc is set once; globe.gl animates its dash on the internal ticker.
    globe
      .arcsData([
        {
          startLat: SOURCE.lat,
          startLng: SOURCE.lng,
          endLat: DEST.lat,
          endLng: DEST.lng,
          color: ['#00ff88', '#00d4ff'],
        },
      ])
      .arcColor('color')
      .arcAltitude(0.35)
      .arcStroke(0.7)
      .arcDashLength(0.12)
      .arcDashGap(0.04)
      .arcDashAnimateTime(1300);

    // ── Flight loop (autoplay on view, loop). Driven by our own rAF; both this
    //    and globe.gl's internal ticker are paused off-screen / on hidden tab. ──
    const FLIGHT_MS = 5500;
    const HOLD_MS = 1200;
    let rafId = 0;
    let running = false;
    let inView = false;
    let legStart = 0;

    const frame = (now: number) => {
      if (!running) return;
      const cycle = FLIGHT_MS + HOLD_MS;
      const elapsed = (now - legStart) % cycle;
      if (elapsed < FLIGHT_MS) {
        plane.visible = true;
        const t = elapsed / FLIGHT_MS;
        const easedT = t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
        const cur = flightPosition(easedT);
        plane.position.copy(cur.position);
        if (easedT < 0.995) {
          const next = flightPosition(Math.min(easedT + 0.005, 1));
          plane.up.copy(cur.position).normalize();
          plane.lookAt(next.position);
        }
      } else {
        // brief hold at the destination before the next loop
        plane.visible = false;
      }
      rafId = requestAnimationFrame(frame);
    };

    const play = () => {
      if (running) return;
      running = true;
      globe.resumeAnimation(); // restart globe.gl's internal render ticker
      legStart = performance.now();
      rafId = requestAnimationFrame(frame);
    };
    const pause = () => {
      if (!running) return;
      running = false;
      if (rafId) cancelAnimationFrame(rafId);
      rafId = 0;
      globe.pauseAnimation(); // HARD-STOP the internal ticker too — no rAF off-screen
    };

    // Start paused; visibility (scroll) + tab focus drive play/pause.
    globe.pauseAnimation();
    const sync = () => {
      if (inView && !document.hidden) play();
      else pause();
    };
    const io = new IntersectionObserver(
      ([entry]) => {
        inView = entry.isIntersecting;
        sync();
      },
      { threshold: 0.2 },
    );
    io.observe(el);
    document.addEventListener('visibilitychange', sync);
    const onResize = () => sizeToBox();
    window.addEventListener('resize', onResize);

    return () => {
      io.disconnect();
      document.removeEventListener('visibilitychange', sync);
      window.removeEventListener('resize', onResize);
      if (rafId) cancelAnimationFrame(rafId);
      // Dispose the whole GL context + our airplane resources.
      globe.pauseAnimation();
      globe._destructor();
      geos.forEach((g) => g.dispose());
      glowGeo.dispose();
      mat.dispose();
      glowMat.dispose();
      el.replaceChildren();
    };
  }, []);

  return <div ref={mountRef} style={{ position: 'absolute', inset: 0 }} aria-hidden="true" />;
}
