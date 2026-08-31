'use client';

// components/ciq/stay-points/StayOnPointsView.tsx
//
// The Stay on Points surface. Mobile-first, tested at 375px, light theme,
// no italic type anywhere — emphasis comes from weight, size and colour.
//
// HONESTY RULES THIS COMPONENT ENFORCES (see docs/stay-on-points/04-UIUX-Brief.md):
//   • an unknown value renders "--", never 0 and never an estimate
//   • "est" means WE ESTIMATED IT, never "we don't know"
//   • every card states where its numbers came from and how old they are
//   • CASH_WINS is presented as useful advice, not as a failure
//   • the verdict band is the visual centre — it is the answer

import { useState } from 'react';

export interface StayCoverage {
  covers_fully: boolean;
  bank_points_needed: number;
  points_left_over: number;
  points_short: number;
  cash_still_due_inr: number;
}

export interface StayCard {
  id: string;
  name: string;
  area: string;
  star_rating: number;
  room_type: string;
  programme_name: string;
  programme_is_fixed: boolean;

  room_total_inr: number;
  taxes_inr: number;
  cash_total_inr: number;
  public_room_total_inr: number | null;

  programme_points: number | null;
  bank_points: number | null;
  points_offset_inr: number | null;
  points_cash_remainder_inr: number | null;
  value_per_bank_point_inr: number | null;

  portal_nominal_per_point_inr: number;
  portal_effective_per_point_inr: number;
  portal_capped: boolean;
  portal_max_payable_inr: number;
  portal_cash_remainder_inr: number;

  advantage_pct: number | null;
  verdict:
    | 'POINTS_WIN'
    | 'CLOSE_CALL'
    | 'CASH_WINS'
    | 'NOT_PUBLISHED'
    | 'RATIO_UNKNOWN'
    | 'FX_UNAVAILABLE';
  coverage: StayCoverage | null;

  transfer_ratio_label: string | null;
  transfer_warning: string | null;

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
  portalPerPoint: number;
  portalCapPct: number;
  portalFeeInr: number;
  portalSource: string;
  portalAsOf: string;
  ratioSource: string;
  ratioAsOf: string;
  programmeCount: number;
}

const inr = (n: number) =>
  '\u20B9' + Math.round(n).toLocaleString('en-IN');
const pts = (n: number) => Math.round(n).toLocaleString('en-IN');

const VERDICT_COPY: Record<StayCard['verdict'], { label: string; tone: string }> = {
  POINTS_WIN: { label: 'Points win', tone: 'good' },
  CLOSE_CALL: { label: 'Close call', tone: 'warn' },
  CASH_WINS: { label: 'Keep your points', tone: 'warn' },
  NOT_PUBLISHED: { label: 'Points cost not published', tone: 'unknown' },
  RATIO_UNKNOWN: { label: 'Transfer route not verified', tone: 'unknown' },
  FX_UNAVAILABLE: { label: 'Cannot compare right now', tone: 'unknown' },
};

export default function StayOnPointsView(p: Props) {
  const [open, setOpen] = useState<string | null>(null);

  const computable = p.cards.filter((c) => c.verdict === 'POINTS_WIN' || c.verdict === 'CLOSE_CALL' || c.verdict === 'CASH_WINS');
  const wins = computable.filter((c) => c.verdict === 'POINTS_WIN').length;

  return (
    <div className="sop">
      <style>{CSS}</style>

      <header className="sop-head">
        <div className="eyebrow">CreditIQ Travel</div>
        <h1>Stay on Points</h1>
        <p className="sub">
          Your bank tells you what its portal gives you for your points. It does
          not tell you what those points are worth somewhere else. This does.
        </p>
      </header>

      {/* Balance — the personal hook, or the prompt to supply it */}
      {p.balance !== null ? (
        <div className="balance">
          <div>
            <div className="k">Your points</div>
            <div className="v">{pts(p.balance)}</div>
            <div className="s">
              worth {inr(p.balance * p.portalPerPoint)} through your bank portal
              {p.portalCapPct < 100
                ? ` \u2014 but never more than ${p.portalCapPct}% of a bill`
                : ''}
            </div>
          </div>
        </div>
      ) : (
        <div className="balance balance-empty">
          <div>
            <div className="k">No points balance yet</div>
            <div className="s">
              Add your balance to see exactly which of these stays it covers.
            </div>
          </div>
          <a className="balance-cta" href="/wallet">
            Add balance
          </a>
        </div>
      )}

      {/* FX — the margin, stated plainly */}
      {p.fx ? (
        <div className="fxnote">
          <b>Why the exchange rate decides this.</b> Accor redeems at a fixed
          2,000 points = &euro;40, and Accor&rsquo;s own terms name the euro as the
          reference currency. So the rupee value of a transfer moves with
          EUR/INR &mdash; today {p.fx.rate.toFixed(2)}, fetched live from{' '}
          {p.fx.source}. We recompute on every search and never store a rate.
        </div>
      ) : (
        <div className="fxnote fx-down">
          <b>We can&rsquo;t fetch an exchange rate right now.</b> Rather than show
          you a stale conversion, we are leaving the rupee comparison out. The
          points and cash figures below are still real.
        </div>
      )}

      <div className="barline">
        <h2>
          {p.city} &middot; {p.nights} nights
        </h2>
        <div className="count">
          {computable.length > 0
            ? `${wins} of ${computable.length} favour transferring`
            : `${p.cards.length} hotels`}
        </div>
      </div>

      {p.cards.length === 0 && (
        <div className="empty">
          We only have captured rates for Bangkok right now. More cities as we
          capture them &mdash; we would rather cover a little honestly than a lot
          badly.
        </div>
      )}

      {p.cards.map((c) => {
        const v = VERDICT_COPY[c.verdict];
        const isOpen = open === c.id;
        return (
          <article key={c.id} className="card">
            <div className="body">
              <div className="chainrow">
                <span className="chainbadge">{c.programme_name}</span>
                {c.transfer_ratio_label && (
                  <span className="ratio">transfers {c.transfer_ratio_label}</span>
                )}
              </div>
              <div className="hname">{c.name}</div>
              <div className="hmeta">
                {c.area} &middot; {c.star_rating} star &middot; {c.room_type}
              </div>

              <div className={`verdict v-${v.tone}`}>
                <div className="vlabel">
                  {v.label}
                  {c.advantage_pct !== null &&
                    (c.verdict === 'POINTS_WIN' || c.verdict === 'CLOSE_CALL') &&
                    ` \u2014 ${c.advantage_pct.toFixed(0)}% better than your portal`}
                  {c.verdict === 'CASH_WINS' &&
                    c.advantage_pct !== null &&
                    ` \u2014 your portal gives ${Math.abs(c.advantage_pct).toFixed(0)}% more`}
                </div>

                <div className="split">
                  <div className="leg">
                    <div className="k">Pay with points</div>
                    <div className="v">
                      {c.bank_points !== null ? `${pts(c.bank_points)} pts` : '\u2014'}
                    </div>
                    <div className="s">
                      {c.value_per_bank_point_inr !== null
                        ? `worth \u20B9${c.value_per_bank_point_inr.toFixed(2)} each`
                        : 'not computable'}
                    </div>
                  </div>
                  <div className="vs">VS</div>
                  <div className="leg">
                    <div className="k">Pay cash</div>
                    <div className="v">{inr(c.cash_total_inr)}</div>
                    <div className="s">
                      {inr(c.room_total_inr)} room + {inr(c.taxes_inr)} tax
                    </div>
                  </div>
                </div>

                {/* What the points actually pay for. Two separate facts:
                    (1) can you afford the transfer, (2) how much of the bill
                    does it clear. Conflating them is how a page tells someone
                    a stay is covered when it is half covered. */}
                {c.coverage && c.bank_points !== null && (
                  <div className="topup">
                    {c.coverage.covers_fully ? (
                      <>
                        You have enough points to make this transfer &mdash;{' '}
                        <b>{pts(c.bank_points)}</b> of your{' '}
                        {pts(c.coverage.bank_points_needed + c.coverage.points_left_over)},
                        leaving {pts(c.coverage.points_left_over)}.
                      </>
                    ) : (
                      <>
                        You are <b>{pts(c.coverage.points_short)} points short</b>{' '}
                        of making this transfer.
                      </>
                    )}
                    {c.points_offset_inr !== null &&
                      c.points_cash_remainder_inr !== null && (
                        <>
                          {' '}
                          Those points clear{' '}
                          <b>{inr(c.points_offset_inr)}</b> of the{' '}
                          {inr(c.cash_total_inr)} bill
                          {c.points_cash_remainder_inr > 0 ? (
                            <>
                              , leaving{' '}
                              <b>{inr(c.points_cash_remainder_inr)}</b> in cash
                              {c.taxes_inr > 0 && (
                                <> (of which {inr(c.taxes_inr)} is tax)</>
                              )}
                              .
                            </>
                          ) : (
                            <> in full.</>
                          )}
                        </>
                      )}
                  </div>
                )}

                {/* No balance on file — still say what the transfer would cost. */}
                {!c.coverage &&
                  c.bank_points !== null &&
                  c.points_offset_inr !== null &&
                  c.points_cash_remainder_inr !== null && (
                    <div className="topup">
                      <b>{pts(c.bank_points)} of your points</b> would clear{' '}
                      <b>{inr(c.points_offset_inr)}</b> of the{' '}
                      {inr(c.cash_total_inr)} bill
                      {c.points_cash_remainder_inr > 0 && (
                        <>
                          , leaving {inr(c.points_cash_remainder_inr)} in cash
                        </>
                      )}
                      .
                    </div>
                  )}

                {/* The cap — the thing nobody tells Indian cardholders */}
                {c.portal_capped && c.verdict === 'POINTS_WIN' && (
                  <div className="topup cap">
                    Your bank portal would cover at most{' '}
                    <b>{inr(c.portal_max_payable_inr)}</b> of this bill
                    &mdash; {inr(c.portal_cash_remainder_inr)} would still be
                    cash. Transferred points have no such cap.
                  </div>
                )}

                {c.verdict === 'NOT_PUBLISHED' && (
                  <div className="topup">
                    {c.programme_name} prices awards by date, so we cannot tell
                    you the points cost without checking availability.{' '}
                    <b>We would rather show nothing than guess.</b>
                  </div>
                )}
                {c.verdict === 'RATIO_UNKNOWN' && (
                  <div className="topup">
                    We have not verified a transfer route from your card to{' '}
                    {c.programme_name}, so we will not estimate what your points
                    are worth there.
                  </div>
                )}
              </div>

              <div className="prov">
                <span className={`pd ${c.rate_is_live ? '' : 'est'}`} />
                Cash rate {c.rate_age_label}
                {c.public_room_total_inr !== null && (
                  <> &middot; member rate; public is {inr(c.public_room_total_inr + c.taxes_inr)}</>
                )}
              </div>

              {c.transfer_warning && c.verdict === 'POINTS_WIN' && (
                <div className="warn">{c.transfer_warning}</div>
              )}

              <div className="cta">
                <button
                  className="btn btn-p"
                  onClick={() => setOpen(isOpen ? null : c.id)}
                  aria-expanded={isOpen}
                >
                  {isOpen ? 'Hide the maths' : 'See the maths'}
                </button>
                <a
                  className="btn btn-s"
                  href={c.booking_url}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Book direct
                </a>
              </div>

              {isOpen && (
                <div className="maths">
                  <Row k="Room, 3 nights" v={inr(c.room_total_inr)} s={`captured ${c.rate_age_label}`} />
                  <Row k="Taxes" v={inr(c.taxes_inr)} s="quoted separately by Accor" />
                  {c.programme_points !== null && (
                    <Row
                      k={`${c.programme_name} points needed`}
                      v={pts(c.programme_points)}
                      s="2,000 pts = EUR 40, published"
                    />
                  )}
                  {c.transfer_ratio_label && c.bank_points !== null && (
                    <Row
                      k="Your card points needed"
                      v={pts(c.bank_points)}
                      s={`transfers ${c.transfer_ratio_label}, issuer portal ${p.ratioAsOf}`}
                    />
                  )}
                  {p.fx && (
                    <Row
                      k="EUR / INR"
                      v={p.fx.rate.toFixed(2)}
                      s={`live, ${p.fx.source}`}
                    />
                  )}
                  <Row
                    k="Your portal would give"
                    v={`${inr(p.portalPerPoint)}/point`}
                    s={`${p.portalSource}, ${p.portalAsOf}`}
                  />
                  <Row
                    k="Your portal, after its fee"
                    v={`\u20B9${c.portal_effective_per_point_inr.toFixed(2)}/point`}
                    s={`${inr(p.portalFeeInr)} per redemption, capped at ${p.portalCapPct}% of a bill`}
                  />
                  <Row
                    k="Transferred, per your point"
                    v={
                      c.value_per_bank_point_inr !== null
                        ? `\u20B9${c.value_per_bank_point_inr.toFixed(2)}/point`
                        : '\u2014'
                    }
                    s="after the transfer ratio and block rounding"
                  />
                  {c.advantage_pct !== null && (
                    <Row
                      k="Advantage"
                      v={`${c.advantage_pct > 0 ? '+' : ''}${c.advantage_pct.toFixed(1)}%`}
                      s="computed"
                    />
                  )}
                </div>
              )}
            </div>
          </article>
        );
      })}

      <footer className="sop-foot">
        Cash rates captured by hand from the hotel programme, dated on every
        card. Exchange rate fetched live. Transfer ratios read from your
        issuer&rsquo;s own portal on {p.ratioAsOf}. We do not store a rate we have
        not checked, and we do not show a number we cannot source.
      </footer>
    </div>
  );
}

function Row({ k, v, s }: { k: string; v: string; s: string }) {
  return (
    <div className="mrow">
      <div className="mk">{k}</div>
      <div className="mv">{v}</div>
      <div className="ms">{s}</div>
    </div>
  );
}

const CSS = `
.sop{--bg:#FBFAF7;--surface:#fff;--ink:#14181F;--ink2:#5A6270;--ink3:#8A919C;
--line:#E7E3DA;--accent:#B4802F;--good:#1F7A4D;--goods:#EDF7F1;--goodl:#CBE6D8;
--warn:#8A6D3B;--warns:#FBF5E8;--warnl:#EBDDBF;--unk:#6B7280;--unks:#F3F4F6;--unkl:#E3E5E9;
max-width:430px;margin:0 auto;padding:0 16px 64px;color:var(--ink);
font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif}
@media(min-width:760px){.sop{max-width:720px}}
.sop-head{padding:20px 0 8px}
.eyebrow{font-size:11px;letter-spacing:.14em;text-transform:uppercase;color:var(--accent);font-weight:700}
.sop h1{font-size:30px;line-height:1.12;font-weight:800;letter-spacing:-.02em;margin-top:8px}
.sub{color:var(--ink2);font-size:14px;line-height:1.55;margin-top:10px}
.balance{background:var(--ink);color:#fff;border-radius:14px;padding:16px;margin:18px 0;
display:flex;justify-content:space-between;align-items:center;gap:12px}
.balance .k{font-size:11px;letter-spacing:.08em;text-transform:uppercase;opacity:.65;font-weight:700}
.balance .v{font-size:24px;font-weight:800;margin-top:2px;letter-spacing:-.02em}
.balance .s{font-size:12px;opacity:.75;margin-top:6px;line-height:1.5}
.balance-empty{background:var(--surface);color:var(--ink);border:1px solid var(--line)}
.balance-empty .k{opacity:1;color:var(--ink3)}
.balance-empty .s{opacity:1;color:var(--ink2)}
.balance-cta{flex:0 0 auto;background:var(--accent);color:#fff;border-radius:10px;
padding:11px 14px;font-size:13px;font-weight:700;text-decoration:none;min-height:44px;
display:flex;align-items:center}
.fxnote{background:#FAF3E6;border:1px solid #EEDFC2;border-radius:12px;padding:12px;
font-size:12px;color:#6B5220;line-height:1.55;margin:16px 0}
.fxnote b{font-weight:800}
.fx-down{background:var(--unks);border-color:var(--unkl);color:var(--ink2)}
.barline{display:flex;justify-content:space-between;align-items:baseline;margin:22px 0 10px;gap:10px}
.barline h2{font-size:17px;font-weight:800;letter-spacing:-.01em}
.count{font-size:12px;color:var(--ink3);font-weight:600;text-align:right}
.empty{background:var(--surface);border:1px solid var(--line);border-radius:12px;
padding:16px;font-size:13px;color:var(--ink2);line-height:1.55}
.card{background:var(--surface);border:1px solid var(--line);border-radius:16px;
overflow:hidden;margin-bottom:14px}
.body{padding:14px}
.chainrow{display:flex;align-items:center;gap:8px;margin-bottom:6px;flex-wrap:wrap}
.chainbadge{font-size:10px;letter-spacing:.1em;text-transform:uppercase;font-weight:700;color:var(--ink3)}
.ratio{font-size:10px;font-weight:700;color:var(--accent);letter-spacing:.04em}
.hname{font-size:17px;font-weight:800;line-height:1.25;letter-spacing:-.01em}
.hmeta{font-size:12px;color:var(--ink3);margin-top:3px}
.verdict{margin-top:12px;border-radius:12px;padding:12px}
.v-good{background:var(--goods);border:1px solid var(--goodl)}
.v-warn{background:var(--warns);border:1px solid var(--warnl)}
.v-unknown{background:var(--unks);border:1px solid var(--unkl)}
.vlabel{font-size:11px;letter-spacing:.06em;text-transform:uppercase;font-weight:800;margin-bottom:10px;line-height:1.4}
.v-good .vlabel{color:var(--good)}
.v-warn .vlabel{color:var(--warn)}
.v-unknown .vlabel{color:var(--unk)}
.split{display:grid;grid-template-columns:1fr auto 1fr;gap:10px;align-items:center}
.leg .k{font-size:11px;color:var(--ink2);font-weight:600;margin-bottom:2px}
.leg .v{font-size:19px;font-weight:800;letter-spacing:-.02em}
.leg .s{font-size:11px;color:var(--ink3);margin-top:3px;line-height:1.4}
.vs{font-size:10px;color:var(--ink3);font-weight:700;letter-spacing:.08em}
.topup{margin-top:10px;padding-top:10px;border-top:1px solid rgba(20,24,31,.08);
font-size:13px;line-height:1.55}
.topup b{font-weight:800}
.cap{color:var(--ink2)}
.prov{display:flex;align-items:center;gap:6px;margin-top:10px;font-size:11px;
color:var(--ink3);line-height:1.5;flex-wrap:wrap}
.prov .pd{width:6px;height:6px;border-radius:50%;background:var(--good);flex:0 0 auto}
.prov .pd.est{background:var(--warn)}
.warn{margin-top:8px;font-size:11px;color:var(--warn);line-height:1.5}
.cta{display:flex;gap:8px;margin-top:12px}
.btn{flex:1;padding:11px;border-radius:10px;font-size:13px;font-weight:700;
text-align:center;cursor:pointer;min-height:44px;display:flex;align-items:center;
justify-content:center;text-decoration:none;font-family:inherit}
.btn-p{background:var(--ink);color:#fff;border:1px solid var(--ink)}
.btn-s{background:#fff;color:var(--ink);border:1px solid var(--line)}
.maths{margin-top:12px;border-top:1px solid var(--line);padding-top:10px}
.mrow{display:grid;grid-template-columns:1fr auto;gap:4px 10px;padding:7px 0;
border-bottom:1px solid #F2EFE9}
.mrow:last-child{border-bottom:0}
.mk{font-size:12px;color:var(--ink2);font-weight:600}
.mv{font-size:13px;font-weight:800;text-align:right}
.ms{grid-column:1/-1;font-size:11px;color:var(--ink3);line-height:1.4}
.sop-foot{margin:26px 0 10px;font-size:11px;color:var(--ink3);line-height:1.65}
`;
