'use client';

import { useState } from 'react';

export interface StayCard {
  id: string;
  name: string;
  area: string;
  star_rating: number;
  room_type: string;
  programme_name: string;

  room_total_inr: number;
  taxes_inr: number;
  cash_total_inr: number;
  public_room_total_inr: number | null;

  pricing_state: 'FIXED_VALUE' | 'PUBLISHED_CHART' | 'QUOTE_REQUIRED' | 'NOT_PRICED';
  transfer_state: 'VERIFIED' | 'RATIO_ONLY' | 'UNAVAILABLE' | 'ENDED';
  balance_state: 'SUFFICIENT' | 'SUFFICIENT_VIA_PROGRAMME_BALANCE' | 'PARTIAL' | 'BELOW_MINIMUM';
  rule_state: 'VERIFIED' | 'SOURCE_CONFLICT' | 'UNKNOWN';
  recommended_path:
    | 'TRANSFER_THEN_BOOK'
    | 'REDEEM_EXISTING_BALANCE'
    | 'PORTAL'
    | 'CASH_AND_RETAIN'
    | 'QUOTE_REQUIRED'
    | 'NO_RECOMMENDATION';
  blocked_reason: string | null;

  programme_points_spent: number | null;
  bank_points_target: number | null;
  bank_points_exact: number | null;
  bank_points_retained: number | null;
  existing_programme_points_consumed: number | null;
  programme_points_received: number | null;
  residual_programme_balance: number | null;
  stranded_programme_points: number | null;
  points_offset_inr: number | null;
  execution_cash_payable_inr: number | null;
  instruction_blocked:
    | 'TRANSFER_INCREMENT_UNVERIFIED'
    | 'TRANSFER_MINIMUM_UNVERIFIED'
    | 'PROGRAMME_ELIGIBLE_AMOUNT_UNKNOWN'
    | 'RATIO_SOURCE_CONFLICT'
    | null;
  transfer_duration_hours: { min: number; max: number } | null;
  transfer_irreversible: boolean;

  portal_points_used: number | null;
  portal_cash_payable_inr: number | null;
  portal_fee_inr: number | null;

  conversion_value_per_bank_point_inr: number | null;
  booking_specific_value_per_bank_point_inr: number | null;
  conflicts: string[];

  rate_age_label: string;
  rate_source: string;
  rate_is_live: boolean;
  booking_url: string;
}

interface Props {
  city: string;
  mode: string;
  nights: number;
  balance: number | null;
  cards: StayCard[];
  fx: { rate: number; fetched_at: string; source: string } | null;
  programmeConversionValueInr: number | null;
  portalPerPoint: number;
  portalCapPct: number;
  portalFeeInr: number;
  portalSource: string;
  portalAsOf: string;
  ratioSource: string;
  ratioAsOf: string;
  programmeCount: number;
}

const inr = (n: number) => `₹${Math.round(n).toLocaleString('en-IN')}`;
const money = (n: number) => `₹${n.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const pts = (n: number) => Math.round(n).toLocaleString('en-IN');

const PATH_COPY: Record<StayCard['recommended_path'], { label: string; tone: string }> = {
  TRANSFER_THEN_BOOK: { label: 'Best path: transfer, then book', tone: 'good' },
  REDEEM_EXISTING_BALANCE: { label: 'Best path: use programme balance', tone: 'good' },
  PORTAL: { label: 'Best path: use SmartBuy', tone: 'neutral' },
  CASH_AND_RETAIN: { label: 'Best path: pay cash, keep points', tone: 'warn' },
  QUOTE_REQUIRED: { label: 'Award quote required', tone: 'unknown' },
  NO_RECOMMENDATION: { label: 'No safe recommendation yet', tone: 'unknown' },
};

export default function StayOnPointsView(p: Props) {
  const [open, setOpen] = useState<string | null>(null);
  const actionable = p.cards.filter((c) => c.recommended_path !== 'NO_RECOMMENDATION').length;

  return (
    <div className="sop" data-mode={p.mode}>
      <style>{CSS}</style>

      <header className="head">
        <div className="eyebrow">CreditIQ Travel</div>
        <h1>Stay on Points</h1>
        <p className="sub">
          Not just what a point is worth. What you can actually do with your balance on this booking.
        </p>
      </header>

      {p.balance !== null ? (
        <section className="balance">
          <div>
            <div className="k">Your HDFC Reward Points</div>
            <div className="big">{pts(p.balance)}</div>
            <div className="mutedOnDark">
              Nominal SmartBuy value {inr(p.balance * p.portalPerPoint)} before the {p.portalCapPct}% cap and redemption fee.
            </div>
          </div>
          <a className="balanceLink" href="/wallet">Wallet</a>
        </section>
      ) : (
        <section className="balance emptyBalance">
          <div>
            <div className="k">Your balance is not connected yet</div>
            <div className="muted">Add your HDFC Reward Points to generate a personal redemption path.</div>
          </div>
          <a className="balanceLink light" href="/wallet">Add balance</a>
        </section>
      )}

      <section className="programmeBand">
        <div className="bandTop">
          <div>
            <div className="k">Accor conversion economics today</div>
            <div className="bandValue">
              {p.programmeConversionValueInr !== null ? `${money(p.programmeConversionValueInr)} / HDFC Reward Point` : 'FX comparison unavailable'}
            </div>
          </div>
          <span className="sourceBadge">2 HDFC → 1 ALL</span>
        </div>
        <div className="bandCopy">
          Accor publishes 2,000 ALL points = €40. This conversion value is programme-level, so it is the same across these Accor hotels at the same EUR/INR rate. What changes hotel by hotel is the legal spend block, cash remainder and whether your balance can execute it.
        </div>
        {p.fx ? (
          <div className="bandMeta">EUR/INR {p.fx.rate.toFixed(2)} · live from {p.fx.source}</div>
        ) : (
          <div className="bandMeta warnText">Live EUR/INR unavailable. CreditIQ is not using a stored fallback rate.</div>
        )}
      </section>

      <div className="barline">
        <h2>{p.city} · {p.nights} nights</h2>
        <div className="count">{p.balance === null ? `${p.cards.length} hotels` : `${actionable} actionable`}</div>
      </div>

      {p.cards.length === 0 && (
        <div className="empty">Captured hotel rates are currently available for Bangkok only.</div>
      )}

      {p.cards.map((c) => {
        const path = PATH_COPY[c.recommended_path];
        const isOpen = open === c.id;
        return (
          <article key={c.id} className="card">
            <div className="cardBody">
              <div className="chainrow">
                <span className="chainbadge">{c.programme_name}</span>
                <span className={`state ${c.rule_state === 'VERIFIED' ? 'stateGood' : 'stateGuarded'}`}>
                  {c.rule_state === 'VERIFIED' ? 'rules verified' : 'guarded data'}
                </span>
              </div>

              <div className="hotelName">{c.name}</div>
              <div className="hotelMeta">{c.area} · {c.star_rating} star · {c.room_type}</div>

              <div className="priceRow">
                <div>
                  <div className="k">Cash booking</div>
                  <div className="price">{inr(c.cash_total_inr)}</div>
                  <div className="muted">{inr(c.room_total_inr)} room + {inr(c.taxes_inr)} tax</div>
                </div>
                {c.execution_cash_payable_inr !== null && c.recommended_path === 'TRANSFER_THEN_BOOK' && (
                  <div className="rightPrice">
                    <div className="k">After selected ALL block</div>
                    <div className="price goodText">{inr(c.execution_cash_payable_inr)}</div>
                    <div className="muted">cash still payable</div>
                  </div>
                )}
                {c.portal_cash_payable_inr !== null && c.recommended_path === 'PORTAL' && (
                  <div className="rightPrice">
                    <div className="k">Via SmartBuy</div>
                    <div className="price">{inr(c.portal_cash_payable_inr)}</div>
                    <div className="muted">including fee</div>
                  </div>
                )}
              </div>

              <section className={`path path-${path.tone}`}>
                <div className="pathLabel">{p.balance === null ? 'Add your balance to unlock this path' : path.label}</div>
                {p.balance === null ? (
                  <div className="pathBody">CreditIQ will not invent a balance just to produce a recommendation.</div>
                ) : (
                  <PathSteps card={c} balance={p.balance} />
                )}
              </section>

              <div className="provenance">
                <span className={`dot ${c.rate_is_live ? '' : 'captured'}`} />
                Cash rate {c.rate_age_label}
                {c.public_room_total_inr !== null && <> · public total {inr(c.public_room_total_inr + c.taxes_inr)}</>}
              </div>

              <div className="actions">
                <button className="btn primary" onClick={() => setOpen(isOpen ? null : c.id)} aria-expanded={isOpen}>
                  {isOpen ? 'Hide evidence' : 'See evidence'}
                </button>
                <a className="btn secondary" href={c.booking_url} target="_blank" rel="noopener noreferrer">Check direct</a>
              </div>

              {isOpen && <Evidence card={c} props={p} />}
            </div>
          </article>
        );
      })}

      <footer className="foot">
        Cash rates are captured and dated. EUR/INR is live and fail-closed. HDFC→Accor ratio and transfer time were captured from the issuer portal on {p.ratioAsOf}. The programme registry currently contains {p.programmeCount} programmes. Unknown financial facts stay unknown.
      </footer>
    </div>
  );
}

function PathSteps({ card: c, balance }: { card: StayCard; balance: number }) {
  if (c.recommended_path === 'TRANSFER_THEN_BOOK') {
    const enoughForTarget = c.bank_points_target !== null && balance >= c.bank_points_target;
    return (
      <div className="steps">
        <Step n="1" title="Confirm the room is still available direct">
          Transfers are irreversible. Check the exact room/rate on {c.programme_name} before moving points.
        </Step>
        <Step n="2" title={c.bank_points_exact !== null ? `Transfer exactly ${pts(c.bank_points_exact)} HDFC Reward Points` : 'Do not transfer yet — exact issuer step is withheld'}>
          {c.programme_points_spent !== null && c.bank_points_target !== null && (
            <>
              Target <b>{pts(c.programme_points_spent)} {c.programme_name} points</b>. At the verified 2:1 ratio this needs at least <b>{pts(c.bank_points_target)} HDFC Reward Points</b>.
              {' '}{enoughForTarget ? 'Your current balance reaches that arithmetic target.' : `Your current balance is ${pts(c.bank_points_target - balance)} HDFC Reward Points short of that target.`}
            </>
          )}
          {c.bank_points_exact === null && <Blockers card={c} />}
        </Step>
        <Step n="3" title={c.programme_points_spent !== null ? `Redeem ${pts(c.programme_points_spent)} ${c.programme_name} points` : 'Redeem the verified programme block'}>
          {c.points_offset_inr !== null && c.execution_cash_payable_inr !== null
            ? <>That block offsets <b>{inr(c.points_offset_inr)}</b> on this booking, leaving <b>{inr(c.execution_cash_payable_inr)}</b> in cash.</>
            : <>CreditIQ is withholding the rupee redemption result until the required inputs are trustworthy.</>}
        </Step>
        <div className="warning">
          HDFC’s issuer page says Accor transfers complete within 24 hours. The transfer is irreversible; award/rate availability can move faster than the transfer.
        </div>
      </div>
    );
  }

  if (c.recommended_path === 'REDEEM_EXISTING_BALANCE') {
    return (
      <div className="steps">
        <Step n="1" title="Use the programme points you already hold">No card-points transfer is required.</Step>
        <Step n="2" title={`Book direct with ${c.programme_name}`}>
          {c.programme_points_spent !== null ? `Redeem ${pts(c.programme_points_spent)} ${c.programme_name} points.` : 'Use the verified redemption amount.'}
        </Step>
      </div>
    );
  }

  if (c.recommended_path === 'PORTAL') {
    return (
      <div className="steps">
        <Step n="1" title="Use SmartBuy instead of transferring">
          {c.portal_points_used !== null ? <>Use <b>{pts(c.portal_points_used)} HDFC Reward Points</b> through SmartBuy.</> : 'Use the portal path shown by the engine.'}
        </Step>
        <Step n="2" title="Pay the remaining cash">
          {c.portal_cash_payable_inr !== null ? <>Cash payable is <b>{inr(c.portal_cash_payable_inr)}</b>, including the redemption fee.</> : 'Cash remainder unavailable.'}
        </Step>
      </div>
    );
  }

  if (c.recommended_path === 'CASH_AND_RETAIN') {
    return <div className="pathBody">Pay {inr(c.cash_total_inr)} in cash and retain your HDFC Reward Points. The portal fee/cap makes redeeming now worse on this booking.</div>;
  }

  if (c.recommended_path === 'QUOTE_REQUIRED') {
    return <div className="pathBody">This programme uses award pricing that must be checked for the exact stay. CreditIQ will not manufacture a points price.</div>;
  }

  return (
    <div className="pathBody">
      {c.blocked_reason ?? 'The available facts do not support a safe recommendation.'}
      {c.balance_state === 'BELOW_MINIMUM' && <div className="smallGap">Your current balance cannot reach the smallest permitted redemption candidate.</div>}
    </div>
  );
}

function Blockers({ card: c }: { card: StayCard }) {
  const items: string[] = [];
  if (c.transfer_state === 'RATIO_ONLY') items.push('HDFC transfer minimum/increment is not yet sourced.');
  if (c.instruction_blocked === 'PROGRAMME_ELIGIBLE_AMOUNT_UNKNOWN' || c.rule_state === 'UNKNOWN') {
    items.push('Accor’s exact eligible charge basis is not yet directly sourced.');
  }
  if (c.rule_state === 'SOURCE_CONFLICT') items.push('Accor’s 1,000-point online floor is disputed; CreditIQ is using only the common 2,000-point blocks.');
  if (c.instruction_blocked === 'RATIO_SOURCE_CONFLICT') items.push('The transfer ratio itself is disputed, so no transfer arithmetic is actionable.');
  if (items.length === 0) items.push('An execution-critical input is not verified.');

  return (
    <ul className="blockers">
      {items.map((item) => <li key={item}>{item}</li>)}
    </ul>
  );
}

function Evidence({ card: c, props: p }: { card: StayCard; props: Props }) {
  return (
    <div className="evidence">
      <Row k="Cash rate" v={inr(c.cash_total_inr)} s={c.rate_source} />
      <Row k="Pricing state" v={c.pricing_state} s={`rule state: ${c.rule_state}`} />
      <Row k="Transfer state" v={c.transfer_state} s={`HDFC source captured ${p.ratioAsOf}`} />
      {c.programme_points_spent !== null && <Row k={`${c.programme_name} points selected`} v={pts(c.programme_points_spent)} s="legal redemption candidate from the v3.1 engine" />}
      {c.bank_points_target !== null && <Row k="HDFC Reward Points arithmetic target" v={pts(c.bank_points_target)} s={c.bank_points_exact === null ? 'not an exact transfer instruction' : 'issuer min/increment verified'} />}
      {c.bank_points_exact !== null && <Row k="Exact HDFC transfer" v={pts(c.bank_points_exact)} s="after issuer minimum/increment rounding" />}
      {c.points_offset_inr !== null && <Row k="Booking offset" v={inr(c.points_offset_inr)} s="booking-specific result" />}
      {c.execution_cash_payable_inr !== null && <Row k="Cash after programme redemption" v={inr(c.execution_cash_payable_inr)} s="separate from transfer affordability" />}
      {c.portal_points_used !== null && <Row k="SmartBuy points used" v={pts(c.portal_points_used)} s={`portal cap ${p.portalCapPct}%`} />}
      {c.portal_cash_payable_inr !== null && <Row k="SmartBuy cash payable" v={inr(c.portal_cash_payable_inr)} s={`includes ${money(c.portal_fee_inr ?? p.portalFeeInr)} redemption fee`} />}
      {c.conversion_value_per_bank_point_inr !== null && <Row k="Programme conversion value" v={`${money(c.conversion_value_per_bank_point_inr)} / HDFC Reward Point`} s="programme-level; not booking-specific" />}
      {c.booking_specific_value_per_bank_point_inr !== null && <Row k="Booking-specific unlocked offset" v={`${money(c.booking_specific_value_per_bank_point_inr)} / transferred HDFC point`} s="may be higher when an existing programme balance is unlocked; not intrinsic point value" />}
      {p.fx && <Row k="EUR / INR" v={p.fx.rate.toFixed(2)} s={`live · ${p.fx.source}`} />}
      <Row k="SmartBuy nominal value" v={`${money(p.portalPerPoint)} / HDFC Reward Point`} s={`${p.portalSource} · ${p.portalAsOf}`} />
      {c.conflicts.length > 0 && (
        <div className="conflictBox">
          <b>Source/eligibility guardrails</b>
          {c.conflicts.map((item) => <div key={item}>• {item}</div>)}
        </div>
      )}
    </div>
  );
}

function Step({ n, title, children }: { n: string; title: string; children: React.ReactNode }) {
  return (
    <div className="step">
      <div className="stepN">{n}</div>
      <div>
        <div className="stepTitle">{title}</div>
        <div className="stepCopy">{children}</div>
      </div>
    </div>
  );
}

function Row({ k, v, s }: { k: string; v: string; s: string }) {
  return (
    <div className="row">
      <div className="rowK">{k}</div>
      <div className="rowV">{v}</div>
      <div className="rowS">{s}</div>
    </div>
  );
}

const CSS = `
.sop{--bg:#fbfaf7;--surface:#fff;--ink:#14181f;--ink2:#59616e;--ink3:#858d98;--line:#e7e3da;--accent:#a87425;--good:#176b45;--goodBg:#edf7f1;--goodLine:#c9e4d6;--warn:#7a5b24;--warnBg:#fcf5e8;--warnLine:#ead9b9;--unk:#58606d;--unkBg:#f3f4f6;--unkLine:#dfe2e7;max-width:430px;margin:0 auto;padding:0 16px 64px;color:var(--ink);font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif}
@media(min-width:760px){.sop{max-width:760px}}
.head{padding:20px 0 8px}.eyebrow{font-size:11px;letter-spacing:.14em;text-transform:uppercase;color:var(--accent);font-weight:800}.head h1{font-size:32px;line-height:1.1;font-weight:850;letter-spacing:-.025em;margin:8px 0 0}.sub{font-size:14px;color:var(--ink2);line-height:1.55;margin:10px 0 0}
.balance{background:var(--ink);color:#fff;border-radius:15px;padding:16px;margin:18px 0;display:flex;justify-content:space-between;align-items:center;gap:12px}.emptyBalance{background:#fff;color:var(--ink);border:1px solid var(--line)}.k{font-size:10px;letter-spacing:.08em;text-transform:uppercase;font-weight:800;color:var(--ink3)}.balance .k{color:#fff;opacity:.62}.emptyBalance .k{color:var(--ink3);opacity:1}.big{font-size:25px;font-weight:850;margin-top:2px}.mutedOnDark{font-size:11px;line-height:1.45;opacity:.7;margin-top:5px}.muted{font-size:11px;color:var(--ink3);line-height:1.45;margin-top:4px}.balanceLink{background:var(--accent);color:#fff;text-decoration:none;border-radius:10px;padding:10px 12px;font-size:12px;font-weight:800;min-height:44px;display:flex;align-items:center}.balanceLink.light{color:#fff}
.programmeBand{border:1px solid #e7d5b5;background:#faf3e7;border-radius:15px;padding:14px;margin:16px 0}.bandTop{display:flex;justify-content:space-between;gap:12px;align-items:flex-start}.bandValue{font-size:19px;font-weight:850;margin-top:3px;color:#5f461a}.sourceBadge{font-size:10px;font-weight:800;color:#72501b;border:1px solid #dec49b;border-radius:99px;padding:5px 8px;white-space:nowrap}.bandCopy{font-size:12px;line-height:1.55;color:#6a552c;margin-top:9px}.bandMeta{font-size:10px;color:#8a7042;margin-top:9px}.warnText{color:#7c5a22;font-weight:700}
.barline{display:flex;justify-content:space-between;align-items:baseline;margin:22px 0 10px;gap:10px}.barline h2{font-size:17px;font-weight:850;margin:0}.count{font-size:11px;color:var(--ink3);font-weight:700}.empty{background:#fff;border:1px solid var(--line);border-radius:12px;padding:16px;font-size:13px;color:var(--ink2)}
.card{background:var(--surface);border:1px solid var(--line);border-radius:17px;margin-bottom:14px;overflow:hidden}.cardBody{padding:14px}.chainrow{display:flex;gap:8px;align-items:center;flex-wrap:wrap}.chainbadge{font-size:10px;letter-spacing:.09em;text-transform:uppercase;font-weight:800;color:var(--accent)}.state{font-size:9px;border-radius:99px;padding:4px 7px;font-weight:800;text-transform:uppercase;letter-spacing:.05em}.stateGood{background:var(--goodBg);color:var(--good)}.stateGuarded{background:var(--warnBg);color:var(--warn)}.hotelName{font-size:18px;font-weight:850;letter-spacing:-.015em;margin-top:6px}.hotelMeta{font-size:11px;color:var(--ink3);margin-top:3px}
.priceRow{display:flex;justify-content:space-between;gap:16px;margin-top:14px;padding:12px 0;border-top:1px solid #f0ede7;border-bottom:1px solid #f0ede7}.price{font-size:20px;font-weight:850;margin-top:2px}.rightPrice{text-align:right}.goodText{color:var(--good)}
.path{margin-top:12px;border-radius:13px;padding:12px;border:1px solid}.path-good{background:var(--goodBg);border-color:var(--goodLine)}.path-neutral{background:#f5f6f8;border-color:#e1e4e9}.path-warn{background:var(--warnBg);border-color:var(--warnLine)}.path-unknown{background:var(--unkBg);border-color:var(--unkLine)}.pathLabel{font-size:11px;letter-spacing:.05em;text-transform:uppercase;font-weight:850;margin-bottom:10px}.path-good .pathLabel{color:var(--good)}.path-warn .pathLabel{color:var(--warn)}.path-unknown .pathLabel{color:var(--unk)}.pathBody{font-size:13px;line-height:1.55;color:var(--ink2)}.smallGap{margin-top:5px;font-weight:700}
.steps{display:flex;flex-direction:column;gap:11px}.step{display:grid;grid-template-columns:24px 1fr;gap:8px}.stepN{width:24px;height:24px;border-radius:50%;background:#fff;border:1px solid rgba(20,24,31,.13);display:flex;align-items:center;justify-content:center;font-size:11px;font-weight:850}.stepTitle{font-size:13px;font-weight:850;line-height:1.35}.stepCopy{font-size:12px;color:var(--ink2);line-height:1.52;margin-top:3px}.blockers{margin:6px 0 0;padding-left:17px;color:#765724}.blockers li{margin:2px 0}.warning{font-size:11px;line-height:1.5;color:#7b5d28;border-top:1px solid rgba(122,91,36,.15);padding-top:9px;font-weight:650}
.provenance{display:flex;align-items:center;gap:6px;margin-top:10px;font-size:10px;color:var(--ink3);line-height:1.45;flex-wrap:wrap}.dot{width:6px;height:6px;border-radius:50%;background:var(--good);flex:none}.dot.captured{background:var(--warn)}.actions{display:flex;gap:8px;margin-top:12px}.btn{flex:1;min-height:44px;border-radius:10px;font-size:13px;font-weight:800;display:flex;align-items:center;justify-content:center;text-decoration:none;cursor:pointer;font-family:inherit}.primary{background:var(--ink);color:#fff;border:1px solid var(--ink)}.secondary{background:#fff;color:var(--ink);border:1px solid var(--line)}
.evidence{margin-top:12px;padding-top:8px;border-top:1px solid var(--line)}.row{display:grid;grid-template-columns:1fr auto;gap:4px 10px;padding:7px 0;border-bottom:1px solid #f2efe9}.row:last-child{border-bottom:0}.rowK{font-size:11px;color:var(--ink2);font-weight:700}.rowV{font-size:12px;font-weight:850;text-align:right}.rowS{grid-column:1/-1;font-size:10px;color:var(--ink3);line-height:1.4}.conflictBox{margin-top:9px;background:var(--warnBg);border:1px solid var(--warnLine);border-radius:10px;padding:10px;font-size:10px;color:#725526;line-height:1.55}.conflictBox b{display:block;margin-bottom:4px}.foot{margin:26px 0 10px;font-size:10px;color:var(--ink3);line-height:1.65}
`;
