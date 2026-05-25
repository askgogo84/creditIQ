'use client';

import { useEffect, useRef } from 'react';

interface FlightOption {
  airline: string;
  class: string;
  option: string;
  transferPartner: string;
  pointsNeeded: number;
  cashPrice: number;
  saving: number;
  bookingUrl?: string;
  cardNeeded: string;
  cardId: string;
}

interface HotelOption {
  name: string;
  chain: string;
  nights: number;
  pointsNeeded: number;
  cashPrice: number;
  saving: number;
  cardNeeded: string;
  cardId: string;
}

interface BookingModalProps {
  isOpen: boolean;
  onClose: () => void;
  destination: string;
  flight: FlightOption | null;
  hotel: HotelOption | null;
  userPoints: number;
  cardBank: string;
}

const HDFC_TRANSFER = 'https://www.smartbuy.hdfcbank.com/';
const AXIS_TRANSFER = 'https://www.axisbank.com/retail/cards/credit-card/reward-points';
const SBI_TRANSFER = 'https://www.sbicard.com/en/personal/rewards.page';
const ICICI_TRANSFER = 'https://www.icicibank.com/personal-banking/cards/credit-card/rewards';

function getBankTransferUrl(bank: string): string {
  const b = (bank || '').toUpperCase();
  if (b.includes('HDFC')) return HDFC_TRANSFER;
  if (b.includes('AXIS')) return AXIS_TRANSFER;
  if (b.includes('SBI')) return SBI_TRANSFER;
  if (b.includes('ICICI')) return ICICI_TRANSFER;
  return HDFC_TRANSFER;
}

function getTransferPartnerUrl(partner: string): string {
  if (partner.includes('InterMiles')) return 'https://www.intermiles.com/earn-miles/transfer-points';
  if (partner.includes('KrisFlyer') || partner.includes('Singapore')) return 'https://www.singaporeair.com/en_UK/in/plan-travel/book-flights/';
  if (partner.includes('Marriott')) return 'https://www.marriott.com/loyalty/redeem/travel/redeem-points-for-flights.mi';
  if (partner.includes('Vistara')) return 'https://www.airvistara.com/in/en/plan-your-travel/book/flight';
  return 'https://www.intermiles.com/earn-miles/transfer-points';
}

function buildFlightSearchUrl(partner: string, destination: string): string {
  const dest = encodeURIComponent(destination);
  if (partner.includes('InterMiles')) return 'https://www.intermiles.com/flights/search?to=' + dest;
  if (partner.includes('KrisFlyer') || partner.includes('Singapore')) return 'https://www.singaporeair.com/en_UK/in/plan-travel/book-flights/';
  if (partner.includes('Vistara')) return 'https://www.airvistara.com/in/en/plan-your-travel/book/flight';
  return "https://bitli.in/cv7BwVU";
}

function buildHotelUrl(chain: string, destination: string, nights: number): string {
  const dest = encodeURIComponent(destination);
  if (chain.includes('Marriott') || chain.includes('Bonvoy')) {
    return 'https://www.marriott.com/search/default.mi?destinationAddress=' + dest + '&numberOfNights=' + nights;
  }
  if (chain.includes('IHG')) return 'https://www.ihg.com/hotels/us/en/find-hotels/hotel/list?qDest=' + dest;
  if (chain.includes('Hilton')) return 'https://www.hilton.com/en/hotels/?q.q=' + dest;
  return 'https://www.booking.com/searchresults.html?ss=' + dest + '&no_rooms=1&group_adults=1';
}

export function BookingModal({ isOpen, onClose, destination, flight, hotel, userPoints, cardBank }: BookingModalProps) {
  const overlayRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) document.body.style.overflow = 'hidden';
    else document.body.style.overflow = '';
    return () => { document.body.style.overflow = ''; };
  }, [isOpen]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  if (!isOpen || !flight) return null;

  const bankTransferUrl = getBankTransferUrl(cardBank);
  const flightSearchUrl = buildFlightSearchUrl(flight.transferPartner, destination);
  const hotelUrl = hotel ? buildHotelUrl(hotel.chain, destination, hotel.nights) : '';
  const totalSaving = flight.saving + (hotel ? hotel.saving : 0);
  const hasEnoughPoints = userPoints >= flight.pointsNeeded;

  const steps = [
    {
      num: 1,
      title: 'Transfer your ' + cardBank + ' points',
      subtitle: 'Send ' + flight.pointsNeeded.toLocaleString('en-IN') + ' pts to ' + flight.transferPartner,
      detail: 'Go to ' + cardBank + ' SmartBuy or Rewards portal and transfer points to ' + flight.transferPartner + '. Usually instant or up to 24hrs.',
      cta: 'Open ' + cardBank + ' transfer portal',
      url: bankTransferUrl,
      accent: '#C9972E',
      textColor: '#0a0a0a',
    },
    {
      num: 2,
      title: 'Book your flight on ' + flight.transferPartner,
      subtitle: flight.airline + ' \u00b7 ' + flight.class + ' \u00b7 ' + flight.pointsNeeded.toLocaleString('en-IN') + ' pts',
      detail: 'Search ' + destination + ' on ' + flight.transferPartner + '. Use the miles you just transferred to redeem for this route.',
      cta: 'Search on ' + flight.transferPartner,
      url: flight.bookingUrl || flightSearchUrl,
      accent: '#1B3A5C',
      textColor: '#fff',
    },
    ...(hotel ? [{
      num: 3,
      title: 'Book your stay in ' + destination,
      subtitle: hotel.name + ' \u00b7 ' + hotel.nights + ' nights',
      detail: 'Book via ' + hotel.chain + ' directly or Booking.com. Earn reward points on your card for hotel spend.',
      cta: 'Find hotels in ' + destination,
      url: hotelUrl,
      accent: '#16a34a',
      textColor: '#fff',
    }] : []),
  ];

  return (
    <div
      ref={overlayRef}
      onClick={(e) => { if (e.target === overlayRef.current) onClose(); }}
      style={{
        position: 'fixed', inset: 0, zIndex: 1000,
        background: 'rgba(10,10,15,0.8)',
        backdropFilter: 'blur(8px)',
        display: 'flex', alignItems: 'flex-end', justifyContent: 'center',
      }}
    >
      <style>{`
        @keyframes slideUp { from { transform: translateY(100%); opacity: 0 } to { transform: translateY(0); opacity: 1 } }
        .bm-sheet { animation: slideUp 0.3s cubic-bezier(0.34,1.2,0.64,1) both; }
        .bm-step-btn { transition: all 0.15s ease; display: inline-flex; align-items: center; gap: 6px; padding: 9px 18px; border: none; border-radius: 10px; font-size: 12px; font-weight: 700; cursor: pointer; text-decoration: none; }
        .bm-step-btn:hover { opacity: 0.85; transform: translateY(-1px); }
        .bm-pill { transition: all 0.15s ease; flex: 1; display: flex; align-items: center; justify-content: center; gap: 6px; padding: 10px; border-radius: 10px; font-size: 12px; font-weight: 700; text-decoration: none; }
        .bm-pill:hover { opacity: 0.8; }
        .bm-close:hover { background: rgba(255,255,255,0.15) !important; }
      `}</style>

      <div
        className="bm-sheet"
        style={{
          width: '100%', maxWidth: 560,
          background: '#0d1117',
          borderRadius: '24px 24px 0 0',
          maxHeight: '92vh', overflowY: 'auto',
          border: '1px solid rgba(255,255,255,0.08)',
          boxShadow: '0 -32px 80px rgba(0,0,0,0.7)',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'center', padding: '12px 0 0' }}>
          <div style={{ width: 36, height: 4, borderRadius: 2, background: 'rgba(255,255,255,0.15)' }} />
        </div>

        <div style={{ padding: '16px 24px 18px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <div style={{ fontSize: 10, fontWeight: 700, color: '#C9972E', letterSpacing: 2, textTransform: 'uppercase' as const, marginBottom: 6 }}>
                How to book this trip
              </div>
              <div style={{ fontSize: 22, fontWeight: 900, color: '#fff', letterSpacing: -0.5 }}>
                {destination}
              </div>
              <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', marginTop: 3 }}>
                {flight.airline} {'\u00b7'} {flight.class}{hotel ? (' + ' + hotel.nights + 'N at ' + hotel.name) : ''}
              </div>
            </div>
            <button
              className="bm-close"
              onClick={onClose}
              style={{
                width: 36, height: 36, borderRadius: '50%',
                background: 'rgba(255,255,255,0.07)',
                border: '1px solid rgba(255,255,255,0.1)',
                color: '#fff', fontSize: 20, cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                flexShrink: 0, transition: 'background 0.15s',
              }}
            >{'\u00d7'}</button>
          </div>
          <div style={{ marginTop: 12, display: 'flex', gap: 8, flexWrap: 'wrap' as const }}>
            <span style={{ background: 'rgba(34,197,94,0.12)', border: '1px solid rgba(34,197,94,0.25)', borderRadius: 100, padding: '5px 14px', fontSize: 11, fontWeight: 700, color: '#4ade80' }}>
              Save Rs.{totalSaving.toLocaleString('en-IN')} vs cash
            </span>
            <span style={{
              background: hasEnoughPoints ? 'rgba(34,197,94,0.12)' : 'rgba(239,68,68,0.12)',
              border: '1px solid ' + (hasEnoughPoints ? 'rgba(34,197,94,0.25)' : 'rgba(239,68,68,0.25)'),
              borderRadius: 100, padding: '5px 14px', fontSize: 11, fontWeight: 700,
              color: hasEnoughPoints ? '#4ade80' : '#f87171',
            }}>
              {hasEnoughPoints ? ('\u2713 ' + userPoints.toLocaleString('en-IN') + ' pts ready') : ('Need ' + (flight.pointsNeeded - userPoints).toLocaleString('en-IN') + ' more pts')}
            </span>
          </div>
        </div>

        <div style={{ padding: '18px 24px 0' }}>
          <div style={{ fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,0.3)', letterSpacing: 2, textTransform: 'uppercase' as const, marginBottom: 14 }}>
            3-step booking guide
          </div>

          {steps.map((step, idx) => (
            <div key={step.num} style={{ position: 'relative', marginBottom: idx < steps.length - 1 ? 8 : 0 }}>
              {idx < steps.length - 1 && (
                <div style={{ position: 'absolute', left: 39, top: '100%', width: 1, height: 8, background: 'rgba(255,255,255,0.08)', zIndex: 1 }} />
              )}
              <div style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 16, padding: '14px 16px' }}>
                <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                  <div style={{
                    width: 30, height: 30, borderRadius: '50%', flexShrink: 0,
                    background: step.accent + '22', border: '1.5px solid ' + step.accent + '55',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 13, fontWeight: 900, color: step.accent,
                  }}>{step.num}</div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 14, fontWeight: 700, color: '#fff', marginBottom: 2 }}>{step.title}</div>
                    <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', marginBottom: 8 }}>{step.subtitle}</div>
                    <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.28)', lineHeight: 1.5, marginBottom: 10 }}>{step.detail}</div>
                    <a href={step.url} target="_blank" rel="noopener noreferrer" className="bm-step-btn" style={{ background: step.accent, color: step.textColor }}>
                      {step.cta} <span style={{ fontSize: 10, opacity: 0.7 }}>{'\u2197'}</span>
                    </a>
                  </div>
                </div>
              </div>
            </div>
          ))}

          <div style={{ margin: '16px 0 0', padding: '12px 14px', background: 'rgba(201,151,46,0.08)', border: '1px solid rgba(201,151,46,0.15)', borderRadius: 12 }}>
            <div style={{ fontSize: 11, color: 'rgba(201,151,46,0.75)', lineHeight: 1.6 }}>
              Pro tip: Transfer points only after confirming availability on {flight.transferPartner}. Points transfers are usually irreversible.
            </div>
          </div>

          <div style={{ display: 'flex', gap: 8, margin: '10px 0 24px' }}>
            <a href="https://bitli.in/cv7BwVU" target="_blank" rel="noopener noreferrer" className="bm-pill" style={{ background: 'rgba(232,18,45,0.1)', border: '1px solid rgba(232,18,45,0.2)', color: '#ff6b7a' }}>
              MakeMyTrip
            </a>
            <a href={'https://www.google.com/flights?q=flights+to+' + encodeURIComponent(destination)} target="_blank" rel="noopener noreferrer" className="bm-pill" style={{ background: 'rgba(66,133,244,0.1)', border: '1px solid rgba(66,133,244,0.2)', color: '#60a5fa' }}>
              Google Flights
            </a>
            {hotel && (
              <a href={"https://bitli.in/xc9tvmd"} target="_blank" rel="noopener noreferrer" className="bm-pill" style={{ background: 'rgba(0,115,230,0.1)', border: '1px solid rgba(0,115,230,0.2)', color: '#60a5fa' }}>
                Booking.com
              </a>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
