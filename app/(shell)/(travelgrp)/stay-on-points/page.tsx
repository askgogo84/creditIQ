// app/(shell)/(travelgrp)/stay-on-points/page.tsx
//
// Stay on Points — is transferring your card points to a hotel programme
// worth more than spending them through your bank's portal?
//
// Server component. All I/O happens here; the client island only handles
// search interaction. See docs/stay-on-points/03-App-Flow.md
//
// EVERY NUMBER ON THIS PAGE IS EITHER PUBLISHED BY THE PROGRAMME, CAPTURED
// WITH A TIMESTAMP, OR FETCHED LIVE. There is no fourth category and no
// fallback constant. If a value cannot be had honestly the UI says so.

import { HOTEL_PROGRAMMES, getProgramme } from '@/lib/data/hotel-programmes';
import { ratioFor, speculativeTransferWarning, HDFC_INFINIA_SOURCE, HDFC_INFINIA_AS_OF } from '@/lib/data/hdfc-transfer-partners';
import { SeededRateProvider, rateAgeLabel } from '@/lib/hotels/providers/rates';
import { LiveFxProvider } from '@/lib/hotels/providers/fx';
import { derivePoints, pointValueInr } from '@/lib/hotels/derive';
import { portalValuation, type PortalTerms } from '@/lib/hotels/engine';
import StayOnPointsView, { type StayCard } from '@/components/ciq/stay-points/StayOnPointsView';

export const metadata = {
  title: 'Stay on Points — is transferring worth it? | CreditIQ',
  description:
    'Compare what your credit card points are worth transferred to a hotel programme against what your bank portal gives you. Every figure sourced and dated.',
};

// HDFC Infinia, verified 31 Aug 2026 from the SmartBuy checkout and the
// Infinia rewards page: "1 Reward Point = Rs.1 on Hotels and Flights",
// points cap at 70% of any transaction, Rs.99 + GST per redemption.
const INFINIA_PORTAL: PortalTerms = {
  value_per_point_inr: 1.0,
  max_share_of_bill: 0.7,
  redemption_fee_inr: 117,
  source: 'HDFC SmartBuy Infinia rewards page + live checkout',
  as_of: '2026-08-31',
};

const NIGHTS = 3;

export default async function StayOnPointsPage({
  searchParams,
}: {
  searchParams?: { city?: string; mode?: string; points?: string };
}) {
  const city = searchParams?.city ?? 'Bangkok';
  const mode = searchParams?.mode ?? 'city';

  // Balance: from the query for now. Wallet integration lands later; until
  // then an absent balance renders the prompt state, never a made-up number.
  const balanceRaw = searchParams?.points;
  const balance =
    balanceRaw && /^\d+$/.test(balanceRaw) ? parseInt(balanceRaw, 10) : null;

  const rates = new SeededRateProvider();
  const fxProvider = new LiveFxProvider();

  // Seeded rates are a static import, so this cannot fail or hang.
  const results = await rates.search({ city, nights: NIGHTS });

  // FX is a NETWORK CALL inside a server component. If the endpoint is slow or
  // unreachable, an un-timed-out fetch blocks the render indefinitely and Next
  // silently serves a fallback — a 200 with the wrong content and nothing in
  // the terminal. That is exactly the failure we hit on 31 Aug 2026.
  //
  // So: hard 3-second timeout, and any failure yields null. A null rate is a
  // supported state — the page renders the points and cash figures and says
  // plainly that it will not convert to rupees. It NEVER falls back to a
  // stored rate.
  const fx = await withTimeout(fxProvider.rate('EUR', 'INR'), 3000);

  const cards: StayCard[] = results.map((r) => {
    const programme = getProgramme(r.hotel.programme_id)!;
    const ratio = ratioFor(programme.id);

    const roomTotal = r.cash_per_night_inr * NIGHTS;
    const taxes = r.taxes_inr;
    const cashTotal = roomTotal + taxes;

    const publicRoomTotal =
      r.public_cash_per_night_inr !== null
        ? r.public_cash_per_night_inr * NIGHTS
        : null;

    const portal = portalValuation(cashTotal, INFINIA_PORTAL);
    const derived = derivePoints(roomTotal, taxes, programme, fx?.rate ?? null);
    const ppv = pointValueInr(programme, fx?.rate ?? null);

    // Bank points needed = programme points / ratio.
    const bankPoints =
      derived && ratio ? Math.ceil(derived.points_required / ratio.to) : null;

    // Value per BANK point — the currency the user actually holds.
    const perBankPoint =
      derived && bankPoints && bankPoints > 0
        ? derived.offset_inr / bankPoints
        : null;

    const advantage =
      perBankPoint !== null && portal.effective_per_point_inr > 0
        ? ((perBankPoint - portal.effective_per_point_inr) /
            portal.effective_per_point_inr) *
          100
        : null;

    let verdict: StayCard['verdict'];
    if (programme.pricing_model !== 'fixed') verdict = 'NOT_PUBLISHED';
    else if (!ratio) verdict = 'RATIO_UNKNOWN';
    else if (!fx) verdict = 'FX_UNAVAILABLE';
    else if (advantage === null) verdict = 'FX_UNAVAILABLE';
    else if (advantage > 5) verdict = 'POINTS_WIN';
    else if (advantage < -5) verdict = 'CASH_WINS';
    else verdict = 'CLOSE_CALL';

    // Coverage against the user's own balance, when we have one.
    let coverage: StayCard['coverage'] = null;
    if (balance !== null && bankPoints !== null) {
      const covers = balance >= bankPoints;
      coverage = {
        covers_fully: covers,
        bank_points_needed: bankPoints,
        points_left_over: covers ? balance - bankPoints : 0,
        points_short: covers ? 0 : bankPoints - balance,
        cash_still_due_inr: derived ? derived.cash_remainder_inr : cashTotal,
      };
    }

    return {
      id: r.hotel.id,
      name: r.hotel.name,
      area: r.hotel.area,
      star_rating: r.hotel.star_rating,
      room_type: r.hotel.room_type,
      programme_name: programme.short_name,
      programme_is_fixed: programme.pricing_model === 'fixed',

      room_total_inr: roomTotal,
      taxes_inr: taxes,
      cash_total_inr: cashTotal,
      public_room_total_inr: publicRoomTotal,

      programme_points: derived?.points_required ?? null,
      bank_points: bankPoints,
      points_offset_inr: derived?.offset_inr ?? null,
      points_cash_remainder_inr: derived?.cash_remainder_inr ?? null,
      value_per_bank_point_inr: perBankPoint,

      portal_nominal_per_point_inr: portal.nominal_per_point_inr,
      portal_effective_per_point_inr: portal.effective_per_point_inr,
      portal_capped: portal.capped,
      portal_max_payable_inr: portal.max_payable_inr,
      portal_cash_remainder_inr: portal.cash_remainder_inr,

      advantage_pct: advantage,
      verdict,
      coverage,

      transfer_ratio_label: ratio ? `1 : ${ratio.to}` : null,
      transfer_warning: speculativeTransferWarning(programme.id),

      rate_age_label: rateAgeLabel(r.captured_at),
      rate_source: r.source_id,
      rate_is_live: r.is_live,
      booking_url: r.hotel.booking_url,
    };
  });

  // Best first — points wins ranked by advantage, then everything else.
  cards.sort((a, b) => (b.advantage_pct ?? -Infinity) - (a.advantage_pct ?? -Infinity));

  return (
    <StayOnPointsView
      city={city}
      mode={mode}
      nights={NIGHTS}
      balance={balance}
      cards={cards}
      fx={fx}
      portalPerPoint={INFINIA_PORTAL.value_per_point_inr}
      portalCapPct={Math.round(INFINIA_PORTAL.max_share_of_bill * 100)}
      portalFeeInr={INFINIA_PORTAL.redemption_fee_inr}
      portalSource={INFINIA_PORTAL.source}
      portalAsOf={INFINIA_PORTAL.as_of}
      ratioSource={HDFC_INFINIA_SOURCE}
      ratioAsOf={HDFC_INFINIA_AS_OF}
      programmeCount={HOTEL_PROGRAMMES.length}
    />
  );
}

/**
 * Races a promise against a timer. Returns null if the promise rejects or does
 * not settle in time. Never throws — a failed lookup must degrade the page,
 * not break it.
 */
async function withTimeout<T>(p: Promise<T>, ms: number): Promise<T | null> {
  try {
    return await Promise.race([
      p,
      new Promise<null>((resolve) => setTimeout(() => resolve(null), ms)),
    ]);
  } catch {
    return null;
  }
}
