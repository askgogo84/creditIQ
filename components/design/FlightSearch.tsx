'use client';

import { useState } from 'react';
import { Search, ArrowRight, ArrowLeftRight, ExternalLink, Zap } from 'lucide-react';

interface FlightResult {
  id: string;
  departure_time: string;
  arrival_time: string;
  duration: string;
  stops: number;
  price: number;
  airline: string;
  from: string;
  to: string;
  date: string;
  return_date?: string;
  deep_link?: string;
}

interface BookingOption {
  name: string;
  color: string;
  logo: string;
  getUrl: (from: string, to: string, date: string, returnDate?: string, tripType?: string) => string;
}

const BOOKING_OPTIONS: BookingOption[] = [
  {
    name: 'MakeMyTrip',
    color: '#e63946',
    logo: 'MMT',
    getUrl: (from, to, date, returnDate, tripType) => {
      const type = tripType === 'one-way' ? 'O' : 'R';
      const itinerary =
        tripType === 'one-way'
          ? `${from}-${to}-${date}`
          : `${from}-${to}-${date},${to}-${from}-${returnDate || date}`;
      return `https://tp.media/r?marker=533409&trs=233810&p=4114&u=https%3A%2F%2Fwww.makemytrip.com%2Fflights%2Fsearch%3FtripType%3D${type}%26itinerary%3D${encodeURIComponent(itinerary)}%26paxType%3DA-1_C-0_I-0&campaign=flight_search`;
    },
  },
  {
    name: 'EaseMyTrip',
    color: '#00a651',
    logo: 'EMT',
    getUrl: (from, to, date, returnDate, tripType) => {
      const tt = tripType === 'one-way' ? '1' : '2';
      const rd = returnDate || '';
      return `https://tp.media/r?marker=533409&trs=233810&p=4114&u=https%3A%2F%2Fwww.easemytrip.com%2Fflights%2Fsearch%3Forg%3D${from}%26dest%3D${to}%26dd%3D${date}%26rd%3D${rd}%26ad%3D1%26cd%3D0%26id%3D0%26tt%3D${tt}&campaign=flight_search`;
    },
  },
  {
    name: 'Goibibo',
    color: '#e87722',
    logo: 'GIB',
    getUrl: (from, to, date, returnDate, tripType) => {
      const type = tripType === 'one-way' ? '1' : '2';
      return `https://tp.media/r?marker=533409&trs=233810&p=4114&u=https%3A%2F%2Fwww.goibibo.com%2Fflights%2Fsearch%2F${from}%2F${to}%2F${date}%2F1%2F0%2F0%2FS%2F${type}%2F&campaign=flight_search`;
    },
  },
  {
    name: 'Kayak',
    color: '#ff690f',
    logo: 'KYK',
    getUrl: (from, to, date, returnDate, tripType) => {
      if (tripType === 'one-way') {
        return `https://tp.media/r?marker=533409&trs=233810&p=4114&u=https%3A%2F%2Fwww.kayak.co.in%2Fflights%2F${from}-${to}%2F${date}%3Fsort%3Dprice_a&campaign=flight_search`;
      }
      return `https://tp.media/r?marker=533409&trs=233810&p=4114&u=https%3A%2F%2Fwww.kayak.co.in%2Fflights%2F${from}-${to}%2F${date}%2F${returnDate || date}%3Fsort%3Dprice_a&campaign=flight_search`;
    },
  },
];

// Format date as DDMMYYYY for MakeMyTrip, DD/MM/YYYY for EaseMyTrip, YYYYMMDD for Goibibo/Kayak
function formatDateForOTA(isoDate: string, format: 'mmt' | 'emt' | 'standard'): string {
  const [year, month, day] = isoDate.split('-');
  if (format === 'mmt') return `${day}/${month}/${year}`;
  if (format === 'emt') return `${day}/${month}/${year}`;
  return `${year}${month}${day}`;
}

function getBookingUrl(option: BookingOption, result: FlightResult, tripType: string): string {
  // Each OTA needs slightly different date format — handled inside getUrl
  // We pass ISO date and let each builder format it
  return option.getUrl(result.from, result.to, result.date, result.return_date, tripType);
}

// Popular Indian airport codes
// City name → IATA for natural language detection
export const CITY_TO_IATA: Record<string, string> = {
  'bangalore': 'BLR', 'bengaluru': 'BLR', 'delhi': 'DEL', 'new delhi': 'DEL',
  'mumbai': 'BOM', 'bombay': 'BOM', 'chennai': 'MAA', 'madras': 'MAA',
  'hyderabad': 'HYD', 'kolkata': 'CCU', 'calcutta': 'CCU',
  'kochi': 'COK', 'cochin': 'COK', 'goa': 'GOI',
  'pune': 'PNQ', 'ahmedabad': 'AMD', 'jaipur': 'JAI',
  'bali': 'DPS', 'denpasar': 'DPS',
  'singapore': 'SIN', 'dubai': 'DXB', 'bangkok': 'BKK',
  'london': 'LHR', 'new york': 'JFK', 'nyc': 'JFK',
  'paris': 'CDG', 'tokyo': 'NRT', 'sydney': 'SYD',
  'kuala lumpur': 'KUL', 'kl': 'KUL', 'hong kong': 'HKG',
  'phuket': 'HKT', 'colombo': 'CMB', 'maldives': 'MLE', 'male': 'MLE',
  'istanbul': 'IST', 'doha': 'DOH', 'abu dhabi': 'AUH', 'muscat': 'MCT',
  'amsterdam': 'AMS', 'rome': 'FCO', 'frankfurt': 'FRA',
  'los angeles': 'LAX', 'san francisco': 'SFO', 'toronto': 'YYZ',
  'nairobi': 'NBO', 'johannesburg': 'JNB', 'kathmandu': 'KTM',
  'seoul': 'ICN', 'taipei': 'TPE', 'jakarta': 'CGK',
};

export function detectIataFromText(text: string): string | null {
  const lower = text.toLowerCase();
  for (const [city, iata] of Object.entries(CITY_TO_IATA)) {
    if (lower.includes(city)) return iata;
  }
  return null;
}

export const INDIRECT_ROUTES: Record<string, { via: string; hub: string }> = {
  'DPS': { via: 'SIN', hub: 'Singapore' },
  'MLE': { via: 'CMB', hub: 'Colombo' },
  'NRT': { via: 'SIN', hub: 'Singapore' },
  'SYD': { via: 'SIN', hub: 'Singapore' },
  'HKG': { via: 'SIN', hub: 'Singapore' },
  'CDG': { via: 'DXB', hub: 'Dubai' },
  'LHR': { via: 'DXB', hub: 'Dubai' },
  'JFK': { via: 'LHR', hub: 'London' },
  'LAX': { via: 'DOH', hub: 'Doha' },
};

export function buildKayakUrl(from: string, to: string, dep: string, ret?: string, pax = 1): string {
  if (ret) return 'https://www.kayak.co.in/flights/' + from + '-' + to + '/' + dep + '/' + ret + '?adults=' + pax;
  return 'https://www.kayak.co.in/flights/' + from + '-' + to + '/' + dep + '?adults=' + pax;
}

export function buildMMTUrl(from: string, to: string, dep: string): string {
  const d = dep.replace(/-/g, '');
  return 'https://www.makemytrip.com/flight/search?tripType=O&itinerary=' + from + '-' + to + '-' + d + '&paxType=A-1_C-0_I-0&intl=true&cabinClass=E';
}

const AIRPORTS = [
  { code: 'BLR', name: 'Bengaluru (BLR)' },
  { code: 'DEL', name: 'Delhi (DEL)' },
  { code: 'BOM', name: 'Mumbai (BOM)' },
  { code: 'MAA', name: 'Chennai (MAA)' },
  { code: 'HYD', name: 'Hyderabad (HYD)' },
  { code: 'CCU', name: 'Kolkata (CCU)' },
  { code: 'COK', name: 'Kochi (COK)' },
  { code: 'GOI', name: 'Goa (GOI)' },
  { code: 'PNQ', name: 'Pune (PNQ)' },
  { code: 'AMD', name: 'Ahmedabad (AMD)' },
  { code: 'JAI', name: 'Jaipur (JAI)' },
  { code: 'DPS', name: 'Bali (DPS)' },
  { code: 'SIN', name: 'Singapore (SIN)' },
  { code: 'DXB', name: 'Dubai (DXB)' },
  { code: 'BKK', name: 'Bangkok (BKK)' },
  { code: 'HKT', name: 'Phuket (HKT)' },
  { code: 'KUL', name: 'Kuala Lumpur (KUL)' },
  { code: 'HKG', name: 'Hong Kong (HKG)' },
  { code: 'NRT', name: 'Tokyo (NRT)' },
  { code: 'SYD', name: 'Sydney (SYD)' },
  { code: 'MLE', name: 'Maldives (MLE)' },
  { code: 'CMB', name: 'Colombo (CMB)' },
  { code: 'KTM', name: 'Kathmandu (KTM)' },
  { code: 'LHR', name: 'London (LHR)' },
  { code: 'CDG', name: 'Paris (CDG)' },
  { code: 'AMS', name: 'Amsterdam (AMS)' },
  { code: 'FCO', name: 'Rome (FCO)' },
  { code: 'IST', name: 'Istanbul (IST)' },
  { code: 'DOH', name: 'Doha (DOH)' },
  { code: 'AUH', name: 'Abu Dhabi (AUH)' },
  { code: 'MCT', name: 'Muscat (MCT)' },
  { code: 'JFK', name: 'New York (JFK)' },
  { code: 'LAX', name: 'Los Angeles (LAX)' },
  { code: 'ICN', name: 'Seoul (ICN)' },
  { code: 'NBO', name: 'Nairobi (NBO)' },
  { code: 'GAU', name: 'Guwahati (LGB)' },
  { code: 'IXC', name: 'Chandigarh (IXC)' },
  { code: 'LKO', name: 'Lucknow (AAAL)' },
  { code: 'PAT', name: 'Patna (LJBR)' },
  { code: 'DXB', name: 'Dubai (DXB)' },
  { code: 'SIN', name: 'Singapore (SIN)' },
  { code: 'BKK', name: 'Bangkok (BKK)' },
  { code: 'LHR', name: 'London (LHR)' },
  { code: 'JFK', name: 'New York (JFK)' },
];

function getTodayISO(): string {
  return new Date().toISOString().split('T')[0];
}

function getDatePlusDays(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().split('T')[0];
}

interface FlightSearchProps {
  defaultFrom?: string;
  defaultTo?: string;
  pointsBalance?: number;
  bank?: string;
}

export default function FlightSearch({
  defaultFrom = 'BLR',
  defaultTo = '',
  pointsBalance = 0,
  bank = 'HDFC',
}: FlightSearchProps) {
  const [tripType, setTripType] = useState<'round-trip' | 'one-way'>('round-trip');
  const [from, setFrom] = useState(defaultFrom);
  const [to, setTo] = useState(defaultTo);
  const [departure, setDeparture] = useState(getDatePlusDays(7));
  const [returnDate, setReturnDate] = useState(getDatePlusDays(10));
  const [passengers, setPassengers] = useState(1);

  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [expandedCard, setExpandedCard] = useState<string | null>(null);
  const [searchedLinks, setSearchedLinks] = useState<Record<string, string>>({});

  const swapAirports = () => {
    setFrom(to);
    setTo(from);
  };

  const handleSearch = async () => {
    if (!from || !to || !departure) return;
    setLoading(true);
    setSearched(false);

    // Build real booking URLs for each OTA with actual params
    const ret = tripType === 'round-trip' ? returnDate : undefined;
    const pax = passengers;
    
    // Build all OTA URLs with real route + dates
    const depFormatted = departure; // YYYY-MM-DD
    const retFormatted = ret || '';
    const depMMT = departure.replace(/-/g, '');
    
    const bookingLinks = {
      kayak: ret 
        ? 'https://www.kayak.co.in/flights/' + from + '-' + to + '/' + departure + '/' + ret + '?adults=' + pax + '&sort=bestflight_a'
        : 'https://www.kayak.co.in/flights/' + from + '-' + to + '/' + departure + '?adults=' + pax + '&sort=bestflight_a',
      mmt: ret
        ? 'https://www.makemytrip.com/flight/search?tripType=R&itinerary=' + from + '-' + to + '-' + depMMT + '&paxType=A-' + pax + '_C-0_I-0&intl=true&cabinClass=E'
        : 'https://www.makemytrip.com/flight/search?tripType=O&itinerary=' + from + '-' + to + '-' + depMMT + '&paxType=A-' + pax + '_C-0_I-0&intl=true&cabinClass=E',
      emt: 'https://www.easemytrip.com/flights/search?org=' + from + '&dest=' + to + '&dd=' + departure.split('-').reverse().join('/') + '&ad=' + pax + '&cd=0&id=0&tt=' + (ret ? '2' : '1'),
      goibibo: 'https://www.goibibo.com/flights/search/' + from + '/' + to + '/' + departure.replace(/-/g,'') + '/1/0/0/E/' + (ret ? '2' : '1') + '/',
      googleFlights: 'https://www.google.com/travel/flights?q=Flights+from+' + from + '+to+' + to + '+on+' + departure,
    };

    // Store real links and open KAYAK immediately
    setSearchedLinks(bookingLinks);
    setLoading(false);
    setSearched(true);
  };

  const toggleCard = (id: string) => {
    setExpandedCard(expandedCard === id ? null : id);
  };

  return (
    <div className="w-full max-w-2xl mx-auto font-sans">
      {/* Trip Type Toggle */}
      <div className="flex gap-2 mb-4">
        <button
          onClick={() => setTripType('round-trip')}
          className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
            tripType === 'round-trip'
              ? 'bg-[#1B3A5C] text-white shadow-md'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          ⇄ Round Trip
        </button>
        <button
          onClick={() => setTripType('one-way')}
          className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
            tripType === 'one-way'
              ? 'bg-[#1B3A5C] text-white shadow-md'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          → One Way
        </button>
      </div>

      {/* Search Form */}
      <div className="bg-white rounded-2xl border border-gray-200 p-4 shadow-sm space-y-3">
        {/* From / To */}
        <div className="flex items-center gap-2">
          <div className="flex-1">
            <label className="text-xs text-gray-500 uppercase tracking-wide font-medium mb-1 block">From</label>
            <select
              value={from}
              onChange={(e) => setFrom(e.target.value)}
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm text-gray-800 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-[#1B3A5C]/20"
            >
              {AIRPORTS.map((a) => (
                <option key={a.code} value={a.code}>
                  {a.code} — {a.name}
                </option>
              ))}
            </select>
          </div>

          <button
            onClick={swapAirports}
            className="mt-5 p-2 rounded-full bg-gray-100 hover:bg-gray-200 transition-colors flex-shrink-0"
            title="Swap airports"
          >
            <ArrowLeftRight className="w-4 h-4 text-gray-600" />
          </button>

          <div className="flex-1">
            <label className="text-xs text-gray-500 uppercase tracking-wide font-medium mb-1 block">To</label>
            <select
              value={to}
              onChange={(e) => setTo(e.target.value)}
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm text-gray-800 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-[#1B3A5C]/20"
            >
              <option value="">Select destination</option>
              {AIRPORTS.filter((a) => a.code !== from).map((a) => (
                <option key={a.code} value={a.code}>
                  {a.code} — {a.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Dates */}
        <div className="flex gap-3">
          <div className="flex-1">
            <label className="text-xs text-gray-500 uppercase tracking-wide font-medium mb-1 block">Departure</label>
            <input
              type="date"
              value={departure}
              min={getTodayISO()}
              onChange={(e) => setDeparture(e.target.value)}
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm text-gray-800 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-[#1B3A5C]/20"
            />
          </div>

          {tripType === 'round-trip' && (
            <div className="flex-1">
              <label className="text-xs text-gray-500 uppercase tracking-wide font-medium mb-1 block">
                Return <span className="text-[#C9972E] font-semibold">*</span>
              </label>
              <input
                type="date"
                value={returnDate}
                min={departure}
                onChange={(e) => setReturnDate(e.target.value)}
                className="w-full border border-[#C9972E]/40 rounded-xl px-3 py-2.5 text-sm text-gray-800 bg-amber-50 focus:outline-none focus:ring-2 focus:ring-[#C9972E]/30"
              />
            </div>
          )}
        </div>

        {/* Passengers */}
        <div>
          <label className="text-xs text-gray-500 uppercase tracking-wide font-medium mb-1 block">Passengers</label>
          <select
            value={passengers}
            onChange={(e) => setPassengers(Number(e.target.value))}
            className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm text-gray-800 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-[#1B3A5C]/20"
          >
            {[1, 2, 3, 4, 5, 6].map((n) => (
              <option key={n} value={n}>
                {n} Passenger{n > 1 ? 's' : ''}
              </option>
            ))}
          </select>
        </div>

        {/* Search Button */}
        <button
          onClick={handleSearch}
          disabled={!from || !to || loading}
          className="w-full bg-[#1B3A5C] text-white rounded-xl py-3 font-semibold text-sm flex items-center justify-center gap-2 hover:bg-[#152e4a] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? (
            <>
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              Searching flights...
            </>
          ) : (
            <>
              <Search className="w-4 h-4" />
              Search Flights
            </>
          )}
        </button>
      </div>

      {/* Results — Real OTA Links */}
      {searched && (
        <div className="mt-4">
          {/* Header */}
          <div className="flex items-center justify-between mb-3">
            <div>
              <p className="text-sm font-bold text-gray-900">{from} → {to}</p>
              <p className="text-xs text-gray-500">{departure}{tripType === 'round-trip' ? ' \u00b7 Return ' + returnDate : ''} \u00b7 {passengers} pax</p>
            </div>
            <span className="text-xs text-emerald-600 font-semibold flex items-center gap-1">
              <Zap className="w-3 h-3" /> Live prices on booking site
            </span>
          </div>

          {/* CIRA tip */}
          {pointsBalance > 0 && (
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 mb-3">
              <p className="text-xs font-semibold text-amber-800 mb-1">💡 CIRA's tip for this route</p>
              <p className="text-xs text-amber-700">
                Pay with your {bank} card on any of these platforms to earn reward points. 
                For award redemption, use the Points route above — transfers to KrisFlyer or Air India Flying Returns typically give 2-3x more value than cashback.
              </p>
            </div>
          )}

          {/* OTA Cards */}
          <div className="space-y-2">
            {[
              { name: 'KAYAK', desc: 'Compare all airlines \u00b7 Best for price comparison', url: searchedLinks.kayak, color: '#FF690F', primary: true },
              { name: 'MakeMyTrip', desc: 'Indian OTA \u00b7 EMI options available', url: searchedLinks.mmt, color: '#E8334A', primary: false },
              { name: 'EaseMyTrip', desc: '0 convenience fee \u00b7 Good for budget routes', url: searchedLinks.emt, color: '#0473EA', primary: false },
              { name: 'Goibibo', desc: 'GoCash rewards \u00b7 Quick checkout', url: searchedLinks.goibibo, color: '#E8334A', primary: false },
              { name: 'Google Flights', desc: 'Price tracking \u00b7 Calendar view', url: searchedLinks.googleFlights, color: '#4285F4', primary: false },
            ].map((ota) => (
              <a
                key={ota.name}
                href={ota.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-between p-3 bg-white rounded-xl border border-gray-200 hover:border-gray-300 hover:shadow-sm transition-all group"
              >
                <div className="flex items-center gap-3">
                  <div
                    className="w-8 h-8 rounded-lg flex items-center justify-center text-white text-xs font-black flex-shrink-0"
                    style={{ background: ota.color }}
                  >
                    {ota.name[0]}
                  </div>
                  <div>
                    <p className="text-sm font-bold text-gray-900">{ota.name}</p>
                    <p className="text-xs text-gray-500">{ota.desc}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {ota.primary && (
                    <span className="text-xs bg-orange-100 text-orange-700 font-semibold px-2 py-0.5 rounded-full">Recommended</span>
                  )}
                  <ExternalLink className="w-4 h-4 text-gray-400 group-hover:text-gray-600" />
                </div>
              </a>
            ))}
          </div>

          <p className="text-center text-xs text-gray-400 mt-3">
            Prices shown on booking sites are live and accurate. CreditIQ earns a small commission at no extra cost to you.
          </p>
        </div>
      )}

    </div>
  );
}

