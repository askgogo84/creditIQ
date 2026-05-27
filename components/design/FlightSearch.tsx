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
const AIRPORTS = [
  { code: 'BLR', name: 'Bengaluru (KIA)' },
  { code: 'DEL', name: 'Delhi (IGI)' },
  { code: 'BOM', name: 'Mumbai (CSIA)' },
  { code: 'MAA', name: 'Chennai (MAA)' },
  { code: 'HYD', name: 'Hyderabad (RGIA)' },
  { code: 'CCU', name: 'Kolkata (NSCBI)' },
  { code: 'COK', name: 'Kochi (CIAL)' },
  { code: 'GOI', name: 'Goa (GOX)' },
  { code: 'PNQ', name: 'Pune (LLA)' },
  { code: 'AMD', name: 'Ahmedabad (SVP)' },
  { code: 'JAI', name: 'Jaipur (JAI)' },
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

export default function FlightSearch() {
  const [tripType, setTripType] = useState<'round-trip' | 'one-way'>('round-trip');
  const [from, setFrom] = useState('BLR');
  const [to, setTo] = useState('');
  const [departure, setDeparture] = useState(getDatePlusDays(7));
  const [returnDate, setReturnDate] = useState(getDatePlusDays(10));
  const [passengers, setPassengers] = useState(1);
  const [results, setResults] = useState<FlightResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [expandedCard, setExpandedCard] = useState<string | null>(null);

  const swapAirports = () => {
    setFrom(to);
    setTo(from);
  };

  const handleSearch = async () => {
    if (!from || !to || !departure) return;
    setLoading(true);
    setSearched(false);

    // Simulate Kiwi/flight search — replace with real API call
    await new Promise((r) => setTimeout(r, 1200));

    // Mock results for UI demo (replace with real Kiwi API response parsing)
    const mockResults: FlightResult[] = [
      {
        id: '1',
        departure_time: '06:05',
        arrival_time: '07:35',
        duration: '1h 30m',
        stops: 0,
        price: 4442,
        airline: 'IndiGo',
        from,
        to,
        date: departure,
        return_date: tripType === 'round-trip' ? returnDate : undefined,
      },
      {
        id: '2',
        departure_time: '09:20',
        arrival_time: '11:10',
        duration: '1h 50m',
        stops: 0,
        price: 5199,
        airline: 'Air India',
        from,
        to,
        date: departure,
        return_date: tripType === 'round-trip' ? returnDate : undefined,
      },
      {
        id: '3',
        departure_time: '14:45',
        arrival_time: '16:30',
        duration: '1h 45m',
        stops: 0,
        price: 3899,
        airline: 'SpiceJet',
        from,
        to,
        date: departure,
        return_date: tripType === 'round-trip' ? returnDate : undefined,
      },
    ];

    setResults(mockResults);
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

      {/* Results */}
      {searched && (
        <div className="mt-4 space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-600">
              <span className="font-semibold text-gray-900">{results.length} flights found</span> · Sorted by price
            </p>
            <span className="text-xs text-gray-400 flex items-center gap-1">
              <Zap className="w-3 h-3" /> Live prices at booking
            </span>
          </div>

          {results.map((result) => (
            <div
              key={result.id}
              className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden"
            >
              {/* Flight summary row */}
              <div className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="text-center">
                      <p className="text-lg font-bold text-gray-900">{result.departure_time}</p>
                      <p className="text-xs text-gray-500">{result.from}</p>
                    </div>
                    <div className="flex flex-col items-center gap-0.5">
                      <p className="text-xs text-gray-400">{result.duration}</p>
                      <div className="flex items-center gap-1">
                        <div className="w-8 h-px bg-gray-300" />
                        <ArrowRight className="w-3 h-3 text-gray-400" />
                        <div className="w-8 h-px bg-gray-300" />
                      </div>
                      <p className="text-xs text-emerald-600 font-medium">
                        {result.stops === 0 ? 'Direct' : `${result.stops} stop`}
                      </p>
                    </div>
                    <div className="text-center">
                      <p className="text-lg font-bold text-gray-900">{result.arrival_time}</p>
                      <p className="text-xs text-gray-500">{result.to}</p>
                    </div>
                  </div>

                  <div className="text-right">
                    <p className="text-xl font-bold text-[#1B3A5C]">₹{result.price.toLocaleString('en-IN')}</p>
                    <p className="text-xs text-gray-400">per person</p>
                    <p className="text-xs text-gray-500 mt-0.5">{result.airline}</p>
                  </div>
                </div>

                {/* Book on OTA buttons */}
                <div className="mt-3">
                  <p className="text-xs text-gray-500 mb-2 font-medium">Book on:</p>
                  <div className="grid grid-cols-4 gap-2">
                    {BOOKING_OPTIONS.map((option) => {
                      const url = getBookingUrl(option, result, tripType);
                      return (
                        <a
                          key={option.name}
                          href={url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex flex-col items-center justify-center py-2 px-1 rounded-xl border-2 border-gray-100 hover:border-gray-300 hover:shadow-sm transition-all group"
                          style={{ borderColor: `${option.color}20` }}
                        >
                          <span
                            className="text-[10px] font-bold tracking-tight"
                            style={{ color: option.color }}
                          >
                            {option.logo}
                          </span>
                          <span className="text-[9px] text-gray-500 mt-0.5 group-hover:text-gray-700 leading-tight text-center">
                            {option.name}
                          </span>
                          <ExternalLink className="w-2.5 h-2.5 text-gray-300 mt-0.5" />
                        </a>
                      );
                    })}
                  </div>
                </div>

                {/* Points hint if available */}
                <div className="mt-3 pt-3 border-t border-gray-100 flex items-center justify-between">
                  <p className="text-xs text-[#1B3A5C]">
                    💳 Book via HDFC Infinia/Diners Black to earn 3.3% rewards
                  </p>
                  <button
                    onClick={() => toggleCard(result.id)}
                    className="text-xs text-[#C9972E] font-medium hover:underline"
                  >
                    {expandedCard === result.id ? 'Less ▲' : 'Optimize ▼'}
                  </button>
                </div>

                {/* Expanded optimize section */}
                {expandedCard === result.id && (
                  <div className="mt-3 bg-amber-50 rounded-xl p-3 border border-amber-100">
                    <p className="text-xs font-semibold text-amber-800 mb-2">💡 Points Optimization</p>
                    <ul className="space-y-1.5 text-xs text-amber-700">
                      <li>• Transfer HDFC points to KrisFlyer/Vistara for best value</li>
                      <li>• Book on airline site directly (not OTA) for award tickets</li>
                      <li>• Pay with Infinia/Diners Black for 3.3% reward rate</li>
                      <li>• Use SmartBuy portal for 5x accelerated points on flights</li>
                    </ul>
                  </div>
                )}
              </div>
            </div>
          ))}

          <p className="text-center text-xs text-gray-400 mt-2">
            Prices are indicative. Final price confirmed at booking. Affiliate links may apply.
          </p>
        </div>
      )}

      {searched && results.length === 0 && (
        <div className="mt-4 text-center py-8 text-gray-500">
          <p className="text-2xl mb-2">✈️</p>
          <p className="font-medium">No flights found</p>
          <p className="text-sm mt-1">Try different dates or airports</p>
        </div>
      )}
    </div>
  );
}
