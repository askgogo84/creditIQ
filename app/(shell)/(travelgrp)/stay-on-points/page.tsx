// app/(shell)/(travelgrp)/stay-on-points/page.tsx
// Stay on Points — production integration for redemption-engine v3.1.
//
// All decision arithmetic comes from lib/redemption-engine. This page owns I/O
// and presentation mapping only. Unknown issuer/programme facts remain unknown.

import { HOTEL_PROGRAMMES, getProgramme } from '@/lib/data/hotel-programmes';
import { HDFC_INFINIA_SOURCE, HDFC_INFINIA_AS_OF } from '@/lib/data/hdfc-transfer-partners';
import { SeededRateProvider, rateAgeLabel } from '@/lib/hotels/providers/rates';
import { LiveFxProvider } from '@/lib/hotels/providers/fx';
import { planRedemption } from '@/lib/redemption-engine/plan';
import {
  ACCOR_RULES,
  HDFC_ACCOR_ROUTE,
  withEligibilityBounds,
} from '@/lib/redemption-engine/accor';
import type {
  NotPricedRules,
  PortalTerms,
  RedemptionCandidate,
  RedemptionPlan,
  TransferRoute,
} from '@/lib/redemption-engine/types';
import StayOnPointsView, {
  type StayCard,
} from '@/components/ciq/stay-points/StayOnPointsView';

export const metadata = {
  title: 'Stay on Points — exact redemption paths | CreditIQ',
  description:
    'Compare bank portal, hotel-programme and cash paths using sourced transfer rules, live FX and explicit execution blockers.',
};

const SMARTBUY_SOURCE = 'https://offers.smartbuy.hdfcbank.com/';
const SMARTBUY_AS_OF = '2026-08-31';

// HDFC Infinia SmartBuy, captured 31 Aug 2026:
// ₹1 / point on hotel/flight redemptions, 70% transaction cap, ₹99 + 18% GST.
// Engine units are paise / basis points. Programme eligibility is deliberately
// separate from portal eligibility.
const INFINIA_PORTAL: PortalTerms = {
  value_paise_per_point: 100,
  cap_bp: 7000,
  fee_minor: 9900,
  fee_tax_bp: 1800,
  eligible_basis: { basis: 'TOTAL', excluded: [] },
  provenance: [
    {
      value: {
        value_paise_per_point: 100,
        cap_bp: 7000,
        fee_minor: 9900,
        fee_tax_bp: 1800,
      },
      state: 'VERIFIED',
      source_url: SMARTBUY_SOURCE,
      as_of: SMARTBUY_AS_OF,
    },
  ],
};

const NIGHTS = 3;

export default async function StayOnPointsPage({
  searchParams,
}: {
  searchParams?: { city?: string; mode?: string; points?: string };
}) {
  const city = searchParams?.city ?? 'Bangkok';
  const mode = searchParams?.mode ?? 'city';

  // Wallet cut-over is still pending. Until then a query balance is explicit
  // user input; absence means "not known", never an invented balance.
  const balanceRaw = searchParams?.points;
  const balance =
    balanceRaw && /^\d+$/.test(balanceRaw) ? parseInt(balanceRaw, 10) : null;

  const rates = new SeededRateProvider();
  const fxProvider = new LiveFxProvider();
  const results = await rates.search({ city, nights: NIGHTS });

  // LiveFxProvider has its own AbortController timeout and returns null on any
  // failure. No fallback FX constant exists or is allowed here.
  const fx = await fxProvider.rate('EUR', 'INR');

  const cards: StayCard[] = results.map((r) => {
    const programme = getProgramme(r.hotel.programme_id)!;
    const roomTotalInr = r.cash_per_night_inr * NIGHTS;
    const taxesInr = r.taxes_inr;
    const cashTotalInr = roomTotalInr + taxesInr;
    const publicRoomTotalInr =
      r.public_cash_per_night_inr !== null
        ? r.public_cash_per_night_inr * NIGHTS
        : null;

    const booking = {
      grossMinor: cashTotalInr * 100,
      roomOnlyMinor: roomTotalInr * 100,
    };

    const rules =
      r.hotel.programme_id === 'accor-all'
        ? withEligibilityBounds(ACCOR_RULES, booking)
        : notPricedRules(r.hotel.programme_id, programme.short_name, r.hotel.booking_url);

    const route: TransferRoute =
      r.hotel.programme_id === 'accor-all'
        ? HDFC_ACCOR_ROUTE
        : {
            status: 'UNAVAILABLE',
            card_id: 'hdfc-infinia',
            programme_id: r.hotel.programme_id,
            absence_state: 'NOT_CAPTURED',
          };

    // A missing balance is represented as zero only for programme-level facts
    // (e.g. conversion economics). We do not surface the resulting personal
    // recommendation when the balance is unknown.
    const plan = planRedemption({
      booking,
      bank: {
        card_id: 'hdfc-infinia',
        points: balance ?? 0,
        provenance: 'SELF_ENTERED',
      },
      programmeBalance: null,
      rules,
      route,
      portal: INFINIA_PORTAL,
      fxRate: fx?.rate ?? null,
    });

    return mapStayCard({
      r,
      programmeName: programme.short_name,
      roomTotalInr,
      taxesInr,
      cashTotalInr,
      publicRoomTotalInr,
      balanceKnown: balance !== null,
      plan,
    });
  });

  // Execution first. Within a path, lower cash payable first. This deliberately
  // replaces the old repeated "advantage %" ordering; Accor's conversion rate
  // is programme-level, while the useful property-level difference is what the
  // user's balance can actually execute on this bill.
  cards.sort((a, b) => {
    const pathRank = pathOrder(a.recommended_path) - pathOrder(b.recommended_path);
    if (pathRank !== 0) return pathRank;
    const aCash = a.execution_cash_payable_inr ?? a.cash_total_inr;
    const bCash = b.execution_cash_payable_inr ?? b.cash_total_inr;
    return aCash - bCash;
  });

  const firstConversion = cards.find((c) => c.conversion_value_per_bank_point_inr !== null)
    ?.conversion_value_per_bank_point_inr ?? null;

  return (
    <StayOnPointsView
      city={city}
      mode={mode}
      nights={NIGHTS}
      balance={balance}
      cards={cards}
      fx={fx}
      programmeConversionValueInr={firstConversion}
      portalPerPoint={INFINIA_PORTAL.value_paise_per_point / 100}
      portalCapPct={INFINIA_PORTAL.cap_bp / 100}
      portalFeeInr={(INFINIA_PORTAL.fee_minor * (10000 + INFINIA_PORTAL.fee_tax_bp)) / 1_000_000}
      portalSource={SMARTBUY_SOURCE}
      portalAsOf={SMARTBUY_AS_OF}
      ratioSource={HDFC_INFINIA_SOURCE}
      ratioAsOf={HDFC_INFINIA_AS_OF}
      programmeCount={HOTEL_PROGRAMMES.length}
    />
  );
}

function mapStayCard({
  r,
  programmeName,
  roomTotalInr,
  taxesInr,
  cashTotalInr,
  publicRoomTotalInr,
  balanceKnown,
  plan,
}: {
  r: Awaited<ReturnType<SeededRateProvider['search']>>[number];
  programmeName: string;
  roomTotalInr: number;
  taxesInr: number;
  cashTotalInr: number;
  publicRoomTotalInr: number | null;
  balanceKnown: boolean;
  plan: RedemptionPlan;
}): StayCard {
  const recommended = balanceKnown ? plan.recommended : null;
  const programmeCandidate = bestProgrammeCandidate(plan.candidates);
  const portalCandidate = plan.candidates.find((c) => c.kind === 'PORTAL') ?? null;
  const execution = recommended?.kind === 'PROGRAMME' ? recommended : programmeCandidate;

  return {
    id: r.hotel.id,
    name: r.hotel.name,
    area: r.hotel.area,
    star_rating: r.hotel.star_rating,
    room_type: r.hotel.room_type,
    programme_name: programmeName,

    room_total_inr: roomTotalInr,
    taxes_inr: taxesInr,
    cash_total_inr: cashTotalInr,
    public_room_total_inr: publicRoomTotalInr,

    pricing_state: plan.pricingState,
    transfer_state: plan.transferState,
    balance_state: plan.balanceState,
    rule_state: plan.ruleState,
    recommended_path: balanceKnown ? plan.recommendedPath : 'NO_RECOMMENDATION',
    blocked_reason: balanceKnown ? plan.blockedReason : 'Add your HDFC Reward Points balance to generate a personal redemption path.',

    programme_points_spent: execution?.kind === 'PROGRAMME' ? execution.programmePointsSpent : null,
    bank_points_target: execution?.kind === 'PROGRAMME' ? execution.bankPointsRequiredMinimum : null,
    bank_points_exact: execution?.kind === 'PROGRAMME' ? execution.bankPointsToTransferExact : null,
    bank_points_retained: execution?.kind === 'PROGRAMME' ? execution.bankPointsRetained : null,
    existing_programme_points_consumed: execution?.kind === 'PROGRAMME' ? execution.existingProgrammePointsConsumed : null,
    programme_points_received: execution?.kind === 'PROGRAMME' ? execution.programmePointsReceived : null,
    residual_programme_balance: execution?.kind === 'PROGRAMME' ? execution.residualProgrammeBalance : null,
    stranded_programme_points: execution?.kind === 'PROGRAMME' ? execution.strandedResidualProgrammePoints : null,
    points_offset_inr: execution?.kind === 'PROGRAMME' && execution.offsetMinor !== null ? execution.offsetMinor / 100 : null,
    execution_cash_payable_inr: execution?.kind === 'PROGRAMME' && execution.cashPayableMinor !== null ? execution.cashPayableMinor / 100 : null,
    instruction_blocked: execution?.kind === 'PROGRAMME' ? execution.instructionBlocked : null,
    transfer_duration_hours: execution?.kind === 'PROGRAMME' ? execution.durationHours : null,
    transfer_irreversible: execution?.kind === 'PROGRAMME' ? execution.irreversible : false,

    portal_points_used: portalCandidate?.bankPointsRequiredMinimum ?? null,
    portal_cash_payable_inr: portalCandidate?.cashPayableMinor !== null && portalCandidate?.cashPayableMinor !== undefined
      ? portalCandidate.cashPayableMinor / 100
      : null,
    portal_fee_inr: portalCandidate ? portalCandidate.feeMinor / 100 : null,

    conversion_value_per_bank_point_inr: rationalPaiseToInr(plan.conversionValuePerBankPointPaise),
    booking_specific_value_per_bank_point_inr:
      execution?.kind === 'PROGRAMME'
        ? rationalPaiseToInr(execution.incrementalBookingOffsetPerTransferredBankPointPaise)
        : null,

    conflicts: plan.conflicts.map((c) => c.effect),
    rate_age_label: rateAgeLabel(r.captured_at),
    rate_source: r.source_id,
    rate_is_live: r.is_live,
    booking_url: r.hotel.booking_url,
  };
}

function bestProgrammeCandidate(candidates: RedemptionCandidate[]): RedemptionCandidate | null {
  const programme = candidates.filter((c) => c.kind === 'PROGRAMME');
  if (programme.length === 0) return null;
  return programme.reduce((best, candidate) => {
    if (candidate.programmePointsSpent !== best.programmePointsSpent) {
      return candidate.programmePointsSpent > best.programmePointsSpent ? candidate : best;
    }
    const candidateCash = candidate.cashPayableMinor ?? Number.MAX_SAFE_INTEGER;
    const bestCash = best.cashPayableMinor ?? Number.MAX_SAFE_INTEGER;
    return candidateCash < bestCash ? candidate : best;
  });
}

function rationalPaiseToInr(value: RedemptionPlan['conversionValuePerBankPointPaise']): number | null {
  if (!value) return null;
  // Presentation-only conversion. All ranking and financial decisions are made
  // by exact Rational arithmetic inside the engine.
  return value.num / value.den / 100;
}

function notPricedRules(programmeId: string, label: string, bookingUrl: string): NotPricedRules {
  return {
    programme_id: programmeId,
    currency_label: `${label} points`,
    requires_direct_booking: {
      value: true,
      state: 'UNKNOWN',
      source_url: bookingUrl,
      as_of: '2026-09-01',
    },
    booking_url: bookingUrl,
    pricing: 'NOT_PRICED',
    mechanic: null,
  };
}

function pathOrder(path: StayCard['recommended_path']): number {
  switch (path) {
    case 'REDEEM_EXISTING_BALANCE': return 0;
    case 'TRANSFER_THEN_BOOK': return 1;
    case 'PORTAL': return 2;
    case 'CASH_AND_RETAIN': return 3;
    case 'QUOTE_REQUIRED': return 4;
    case 'NO_RECOMMENDATION': return 5;
  }
}
