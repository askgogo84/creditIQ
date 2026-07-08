'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Header } from '@/components/Header';
import { DesignFooter } from '@/components/design/Footer';

/**
 * /explore - Destination discovery cards (points.casa-style).
 * v1: curated city list with iconic images + estimated miles from BLR.
 * Country filter: India (domestic) vs International.
 * Clicking a card routes to the trip planner pre-filled (flight-results page
 * with live Seats.aero data is a follow-up build).
 */

interface Destination {
  city: string;
  country: string;
  flag: string;          // emoji flag
  region: 'india' | 'international';
  miles: number;         // estimated award miles from BLR (economy, one-way)
  flightTime: string;    // e.g. "1h 15m"
  image: string;         // Unsplash URL
  iata: string;
}

// Curated Unsplash images (free CDN). Sizes tuned for card display.
const IMG = (id: string) => `https://images.unsplash.com/${id}?auto=format&fit=crop&w=800&q=70`;

const DESTINATIONS: Destination[] = [
  // ---- INDIA (14 top domestic from Bangalore) ----
  { city: 'Delhi',      country: 'India', flag: '\u{1F1EE}\u{1F1F3}', region: 'india', miles: 16000, flightTime: '2h 45m', iata: 'DEL', image: IMG('photo-1587474260584-136574528ed5') },
  { city: 'Mumbai',     country: 'India', flag: '\u{1F1EE}\u{1F1F3}', region: 'india', miles: 15000, flightTime: '1h 40m', iata: 'BOM', image: IMG('photo-1566552881560-0be862a7c445') },
  { city: 'Goa',        country: 'India', flag: '\u{1F1EE}\u{1F1F3}', region: 'india', miles: 12000, flightTime: '1h 15m', iata: 'GOI', image: IMG('photo-1512343879784-a960bf40e7f2') },
  { city: 'Hyderabad',  country: 'India', flag: '\u{1F1EE}\u{1F1F3}', region: 'india', miles: 12000, flightTime: '1h 10m', iata: 'HYD', image: IMG('photo-1600100397608-f5f0b6a97e4b') },
  { city: 'Kolkata',    country: 'India', flag: '\u{1F1EE}\u{1F1F3}', region: 'india', miles: 16000, flightTime: '2h 30m', iata: 'CCU', image: IMG('photo-1558431382-27e303142255') },
  { city: 'Chennai',    country: 'India', flag: '\u{1F1EE}\u{1F1F3}', region: 'india', miles: 10000, flightTime: '1h 00m', iata: 'MAA', image: IMG('photo-1582510003544-4d00b7f74220') },
  { city: 'Jaipur',     country: 'India', flag: '\u{1F1EE}\u{1F1F3}', region: 'india', miles: 15000, flightTime: '2h 20m', iata: 'JAI', image: IMG('photo-1477587458883-47145ed94245') },
  { city: 'Lucknow',    country: 'India', flag: '\u{1F1EE}\u{1F1F3}', region: 'india', miles: 14000, flightTime: '2h 40m', iata: 'LKO', image: IMG('photo-1585506942812-e72b29cef752') },
  { city: 'Kochi',      country: 'India', flag: '\u{1F1EE}\u{1F1F3}', region: 'india', miles: 11000, flightTime: '1h 20m', iata: 'COK', image: IMG('photo-1602216056096-3b40cc0c9944') },
  { city: 'Ahmedabad',  country: 'India', flag: '\u{1F1EE}\u{1F1F3}', region: 'india', miles: 14000, flightTime: '2h 05m', iata: 'AMD', image: IMG('photo-1600100397608-f5f0b6a97e4b') },
  { city: 'Pune',       country: 'India', flag: '\u{1F1EE}\u{1F1F3}', region: 'india', miles: 13000, flightTime: '1h 30m', iata: 'PNQ', image: IMG('photo-1553064744-e5a2a4a6e5d6') },
  { city: 'Udaipur',    country: 'India', flag: '\u{1F1EE}\u{1F1F3}', region: 'india', miles: 15000, flightTime: '2h 15m', iata: 'UDR', image: IMG('photo-1590050752117-238cb0fb12b1') },
  { city: 'Srinagar',   country: 'India', flag: '\u{1F1EE}\u{1F1F3}', region: 'india', miles: 18000, flightTime: '3h 20m', iata: 'SXR', image: IMG('photo-1566837945700-30057527ade9') },
  { city: 'Varanasi',   country: 'India', flag: '\u{1F1EE}\u{1F1F3}', region: 'india', miles: 16000, flightTime: '2h 55m', iata: 'VNS', image: IMG('photo-1561361513-2d000a50f0dc') },

  // ---- INTERNATIONAL (from your screenshots) ----
  { city: 'Singapore',    country: 'Singapore',   flag: '\u{1F1F8}\u{1F1EC}', region: 'international', miles: 14000, flightTime: '4h 35m', iata: 'SIN', image: IMG('photo-1525625293386-3f8f99389edd') },
  { city: 'Dubai',        country: 'UAE',         flag: '\u{1F1E6}\u{1F1EA}', region: 'international', miles: 24000, flightTime: '4h 00m', iata: 'DXB', image: IMG('photo-1512453979798-5ea266f8880c') },
  { city: 'Bangkok',      country: 'Thailand',    flag: '\u{1F1F9}\u{1F1ED}', region: 'international', miles: 18000, flightTime: '4h 20m', iata: 'BKK', image: IMG('photo-1508009603885-50cf7c579365') },
  { city: 'Tokyo',        country: 'Japan',       flag: '\u{1F1EF}\u{1F1F5}', region: 'international', miles: 35000, flightTime: '9h 30m', iata: 'NRT', image: IMG('photo-1540959733332-eab4deabeeaf') },
  { city: 'London',       country: 'UK',          flag: '\u{1F1EC}\u{1F1E7}', region: 'international', miles: 28000, flightTime: '10h 45m', iata: 'LHR', image: IMG('photo-1513635269975-59663e0ac1ad') },
  { city: 'Paris',        country: 'France',      flag: '\u{1F1EB}\u{1F1F7}', region: 'international', miles: 33000, flightTime: '10h 30m', iata: 'CDG', image: IMG('photo-1502602898657-3e91760cbb34') },
  { city: 'Hong Kong',    country: 'Hong Kong',   flag: '\u{1F1ED}\u{1F1F0}', region: 'international', miles: 13000, flightTime: '6h 00m', iata: 'HKG', image: IMG('photo-1536599018102-9f803c140fc1') },
  { city: 'Kuala Lumpur', country: 'Malaysia',    flag: '\u{1F1F2}\u{1F1FE}', region: 'international', miles: 22000, flightTime: '4h 30m', iata: 'KUL', image: IMG('photo-1596422846543-75c6fc197f07') },
  { city: 'Colombo',      country: 'Sri Lanka',   flag: '\u{1F1F1}\u{1F1F0}', region: 'international', miles: 12000, flightTime: '1h 30m', iata: 'CMB', image: IMG('photo-1566296314736-6eaac1ca0cb9') },
  { city: 'Denpasar',     country: 'Indonesia',   flag: '\u{1F1EE}\u{1F1E9}', region: 'international', miles: 35000, flightTime: '6h 45m', iata: 'DPS', image: IMG('photo-1537996194471-e657df975ab4') },
  { city: 'Seoul',        country: 'South Korea', flag: '\u{1F1F0}\u{1F1F7}', region: 'international', miles: 20000, flightTime: '8h 40m', iata: 'ICN', image: IMG('photo-1538485399081-7191377e8241') },
  { city: 'Istanbul',     country: 'Turkey',      flag: '\u{1F1F9}\u{1F1F7}', region: 'international', miles: 31000, flightTime: '8h 15m', iata: 'IST', image: IMG('photo-1524231757912-21f4fe3a7200') },
  { city: 'Rome',         country: 'Italy',       flag: '\u{1F1EE}\u{1F1F9}', region: 'international', miles: 33000, flightTime: '9h 45m', iata: 'FCO', image: IMG('photo-1552832230-c0197dd311b5') },
  { city: 'Abu Dhabi',    country: 'UAE',         flag: '\u{1F1E6}\u{1F1EA}', region: 'international', miles: 26000, flightTime: '4h 05m', iata: 'AUH', image: IMG('photo-1512632578888-169bbbc64f33') },
];

type Region = 'india' | 'international';

export default function ExplorePage() {
  const [region, setRegion] = useState<Region>('international');

  const list = DESTINATIONS.filter(d => d.region === region);

  const TAB = (active: boolean): React.CSSProperties => ({
    padding: '9px 20px',
    borderRadius: 100,
    fontSize: 14,
    fontWeight: 700,
    cursor: 'pointer',
    border: active ? 'none' : '1px solid var(--border, #e2e8f0)',
    background: active ? 'var(--ink, #142950)' : 'var(--bg-card, #fff)',
    color: active ? '#fff' : 'var(--text, #0f172a)',
    transition: 'all 0.15s',
  });

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg, #f8f9fc)' }}>
      <Header />
      <main style={{ maxWidth: 1120, margin: '0 auto', padding: '32px 20px 100px' }}>

        {/* Hero */}
        <div style={{ marginBottom: 28 }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: 'rgba(201,151,46,0.12)', border: '1px solid rgba(201,151,46,0.3)', borderRadius: 100, padding: '5px 16px', marginBottom: 16 }}>
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#C9972E', display: 'inline-block' }} />
            <span style={{ fontSize: 11, fontWeight: 700, color: '#C9972E', letterSpacing: 1.5, textTransform: 'uppercase' }}>Explore with points</span>
          </div>
          <h1 style={{ fontSize: 'clamp(28px, 5vw, 46px)', fontWeight: 900, color: 'var(--text, #0f172a)', margin: '0 0 8px', letterSpacing: -1, lineHeight: 1.1 }}>
            Where can your points take you?
          </h1>
          <p style={{ fontSize: 15, color: 'var(--text-muted, #64748b)', margin: 0, lineHeight: 1.6, maxWidth: 560 }}>
            Discover destinations you can reach on award miles from Bangalore. Tap any city to plan the trip with your points.
          </p>
        </div>

        {/* Region filter */}
        <div style={{ display: 'flex', gap: 10, marginBottom: 24, alignItems: 'center', flexWrap: 'wrap' }}>
          <div onClick={() => setRegion('international')} style={TAB(region === 'international')}>{'\u{1F30F}'} International</div>
          <div onClick={() => setRegion('india')} style={TAB(region === 'india')}>{'\u{1F1EE}\u{1F1F3}'} India</div>
          <span style={{ marginLeft: 'auto', fontSize: 13, color: 'var(--text-muted, #64748b)', fontWeight: 600 }}>
            {list.length} destinations
          </span>
        </div>

        {/* Cards grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: 16 }}>
          {list.map((d) => (
            <Link
              key={d.iata}
              href={`/trip-planner?q=${encodeURIComponent(`Trip to ${d.city}`)}`}
              style={{ textDecoration: 'none' }}
            >
              <div
                style={{
                  position: 'relative',
                  borderRadius: 16,
                  overflow: 'hidden',
                  aspectRatio: '4 / 3',
                  boxShadow: '0 4px 16px rgba(15,23,42,0.10)',
                  cursor: 'pointer',
                  background: '#1e293b',
                }}
              >
                {/* Image */}
                <img
                  src={d.image}
                  alt={d.city}
                  loading="lazy"
                  style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }}
                />
                {/* Gradient scrim */}
                <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(0,0,0,0.72) 0%, rgba(0,0,0,0.12) 45%, rgba(0,0,0,0.05) 100%)' }} />

                {/* Flight-time badge */}
                <div style={{ position: 'absolute', top: 10, right: 10, background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(4px)', color: '#fff', fontSize: 11, fontWeight: 700, padding: '4px 10px', borderRadius: 100 }}>
                  {d.flightTime}
                </div>

                {/* From origin */}
                <div style={{ position: 'absolute', left: 14, bottom: 52, fontSize: 10, fontWeight: 600, color: 'rgba(255,255,255,0.75)', letterSpacing: 0.3 }}>
                  From Bangalore (BLR)
                </div>

                {/* City + miles */}
                <div style={{ position: 'absolute', left: 14, right: 14, bottom: 12, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                      <span style={{ fontSize: 17 }}>{d.flag}</span>
                      <span style={{ fontSize: 19, fontWeight: 800, color: '#fff', letterSpacing: -0.3 }}>{d.city}</span>
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.7)', fontWeight: 600 }}>from</div>
                    <div style={{ fontSize: 18, fontWeight: 900, color: '#E8B84B', lineHeight: 1 }}>{Math.round(d.miles / 1000)}K</div>
                    <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.7)', fontWeight: 600 }}>miles</div>
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>

        {/* Note */}
        <p style={{ fontSize: 12, color: 'var(--text-muted, #94a3b8)', marginTop: 24, lineHeight: 1.6 }}>
          Miles shown are typical economy award prices one-way from Bangalore and vary by date and availability. Tap a city to plan your trip and see live options.
        </p>
      </main>
      <DesignFooter />
    </div>
  );
}
