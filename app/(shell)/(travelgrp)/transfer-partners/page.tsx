'use client';

// /transfer-partners — a LIVE transfer calculator on findTransferRoutes
// (lib/transfer-ladder.ts). Replaces the old hardcoded PARTNERS marketing table
// (unsourced ratio/timeline/sweet-spot strings keyed by bank name) — those were
// deliberately NOT migrated: any figure worth keeping goes through transfer-graph
// with a real source + state (the separate issuer-sourcing task), never a display
// string here.
//
// Two directions off the SAME engine (findTransferRoutes keeps its signature):
//   FORWARD (default) — "I have these points, what do they become?" miles received,
//     via milesReceivedFor (rounds DOWN to the transfer minimum). From-currency
//     defaults to a wallet card with its real balance prefilled.
//   REVERSE (toggle)  — "I need these miles, what does it cost?" the payable
//     pointsRequired. Same path the board's expanded row uses.
// Both render the SAME Ladder component: path, nominal ratio, hops, days ("time
// unknown" where unknown), provenance state. No route -> we say so, never a guess.

import { useEffect, useMemo, useState } from 'react';
import { authedFetch } from '@/lib/authed-fetch';
import { Ladder } from '@/components/ciq/fly-points/Ladder';
import { findTransferRoutes, milesReceivedFor } from '@/lib/transfer-ladder';
import { TRANSFER_EDGES } from '@/lib/data/transfer-graph';
import { resolveCardCurrency } from '@/lib/transfer-map';
import { currencyToEdgeSlug, programLabel } from '@/lib/fusion-core';
import '@/components/ciq/fly-points/fly-points.css';

const CURRENCY_LABEL: Record<string, string> = {
  hdfc_reward_points: 'HDFC Reward Points',
  axis_edge: 'Axis EDGE Rewards',
  axis_miles: 'Axis EDGE Miles',
  amex_membership_rewards: 'Amex Membership Rewards',
};
function prettySlug(slug: string): string {
  return CURRENCY_LABEL[slug] || slug.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

interface FromOption {
  key: string;
  label: string;
  slug: string;
  matchedCardName?: string;
  balance?: number;
  selfEntered?: boolean;
  wallet: boolean;
}

const TO_PROGRAMMES = Array.from(new Set(TRANSFER_EDGES.map((e) => e.to_programme)))
  .map((slug) => ({ slug, label: programLabel(slug) }))
  .sort((a, b) => a.label.localeCompare(b.label));

const GENERIC_FROM: FromOption[] = Array.from(new Set(TRANSFER_EDGES.map((e) => e.from_currency)))
  .sort()
  .map((slug) => ({ key: `cur:${slug}`, label: prettySlug(slug), slug, wallet: false }));

type Direction = 'forward' | 'reverse';
const REVERSE_DEFAULT_MILES = 40000;

export default function TransferCalculatorPage() {
  const [walletFrom, setWalletFrom] = useState<FromOption[]>([]);
  const [loadingCards, setLoadingCards] = useState(true);
  const [direction, setDirection] = useState<Direction>('forward');
  const [fromKey, setFromKey] = useState<string>('');
  const [toSlug, setToSlug] = useState<string>(TO_PROGRAMMES[0]?.slug ?? '');
  const [amount, setAmount] = useState<number>(REVERSE_DEFAULT_MILES); // points-to-send (fwd) or miles-needed (rev)

  const allFrom = useMemo(() => [...walletFrom, ...GENERIC_FROM], [walletFrom]);
  const from = allFrom.find((o) => o.key === fromKey) ?? null;
  const toLabel = TO_PROGRAMMES.find((p) => p.slug === toSlug)?.label ?? toSlug;

  // Load wallet cards -> from-currency options (resolvable cards only), balances
  // inline with the wallet's own provenance. On first load, forward mode prefills
  // the amount with the first card's real balance.
  useEffect(() => {
    (async () => {
      try {
        const [stmtRes, manualRes] = await Promise.all([
          authedFetch('/api/user-cards'),
          authedFetch('/api/manual-cards'),
        ]);
        const stmt = stmtRes.ok ? (await stmtRes.json()).cards || [] : [];
        const manual = manualRes.ok ? (await manualRes.json()).cards || [] : [];
        const rows = [
          ...stmt.map((r: any) => ({ ...r, _self: r.self_entered === true })),
          ...manual.map((r: any) => ({ ...r, _self: true })),
        ];
        const seen = new Set<string>();
        const opts: FromOption[] = [];
        rows.forEach((r: any, i: number) => {
          if (!r?.card_name) return;
          const dedupe = `${(r.bank || '').toLowerCase()}-${r.card_last4 || 'x'}-${r.card_name.toLowerCase()}`;
          if (seen.has(dedupe)) return;
          seen.add(dedupe);
          const resolved = resolveCardCurrency(r.bank, r.card_name);
          if (!resolved) return;
          const slug = currencyToEdgeSlug(resolved.currency, resolved.bank);
          if (!slug) return;
          opts.push({
            key: `w:${i}`,
            label: r.card_name,
            slug,
            matchedCardName: resolved.matchedCardName,
            balance: Number(r.points_balance) || 0,
            selfEntered: r._self,
            wallet: true,
          });
        });
        setWalletFrom(opts);
        if (opts.length) {
          setFromKey(opts[0].key);
          setAmount(opts[0].balance || 0); // forward default: prefill real balance
        } else {
          setFromKey(GENERIC_FROM[0]?.key ?? '');
        }
      } catch {
        setFromKey(GENERIC_FROM[0]?.key ?? '');
      } finally {
        setLoadingCards(false);
      }
    })();
  }, []);

  // Changing the from-currency in forward mode re-prefills the new card's balance.
  const onFromChange = (key: string) => {
    setFromKey(key);
    if (direction === 'forward') {
      const opt = allFrom.find((o) => o.key === key);
      if (opt?.wallet) setAmount(opt.balance || 0);
    }
  };
  // Switching direction resets the amount to that direction's sensible default.
  const switchDirection = (dir: Direction) => {
    setDirection(dir);
    if (dir === 'forward') setAmount(from?.wallet ? from.balance || 0 : amount || 0);
    else setAmount(REVERSE_DEFAULT_MILES);
  };

  const routes = useMemo(() => {
    if (!from || !toSlug) return [];
    // Reverse enumerates FOR the target miles; forward enumerates once (route set is
    // amount-independent) then orders by miles received.
    const milesNeeded = direction === 'reverse' ? amount : 1;
    if (!(milesNeeded > 0)) return [];
    const rs = findTransferRoutes(
      TRANSFER_EDGES,
      from.slug,
      toSlug,
      milesNeeded,
      from.matchedCardName ? { cardName: from.matchedCardName } : undefined,
    );
    return direction === 'forward'
      ? [...rs].sort((x, y) => milesReceivedFor(y, amount) - milesReceivedFor(x, amount))
      : rs;
  }, [from, toSlug, amount, direction]);

  const holds = from?.wallet ? from.balance ?? 0 : null;
  const revNeed = direction === 'reverse' ? routes[0]?.pointsRequired ?? null : null;
  const revShort = holds != null && revNeed != null ? Math.max(0, revNeed - holds) : 0;
  const fwdBestMiles = direction === 'forward' && routes.length ? milesReceivedFor(routes[0], amount) : 0;

  return (
    <div className="fp-root">
      <h1 className="fp-title">Transfer calculator</h1>
      <p className="fp-sub">
        See what your points become — the real miles after the ratio and any transfer
        minimum, the days, the provenance, and where there’s no route rather than a
        guessed ratio.
      </p>

      {/* direction toggle */}
      <div className="fp-filters" role="group" aria-label="Direction">
        <button className="fp-chip" aria-pressed={direction === 'forward'} onClick={() => switchDirection('forward')}>
          Points → miles
        </button>
        <button className="fp-chip" aria-pressed={direction === 'reverse'} onClick={() => switchDirection('reverse')}>
          Miles → cost
        </button>
      </div>

      {/* CONTROLS — one frame */}
      <div className="fp-search fp-tc-controls">
        <div className="fp-fld wide">
          <label className="fp-fld-label" htmlFor="tc-from">From</label>
          <select id="tc-from" className="fp-fld-val" value={fromKey} onChange={(e) => onFromChange(e.target.value)}>
            {walletFrom.length > 0 && (
              <optgroup label="Your cards">
                {walletFrom.map((o) => (
                  <option key={o.key} value={o.key}>
                    {o.label} · {(o.balance ?? 0).toLocaleString('en-IN')} pts
                  </option>
                ))}
              </optgroup>
            )}
            <optgroup label="All currencies">
              {GENERIC_FROM.map((o) => (
                <option key={o.key} value={o.key}>{o.label}</option>
              ))}
            </optgroup>
          </select>
        </div>

        <div className="fp-fld wide">
          <label className="fp-fld-label" htmlFor="tc-to">To programme</label>
          <select id="tc-to" className="fp-fld-val" value={toSlug} onChange={(e) => setToSlug(e.target.value)}>
            {TO_PROGRAMMES.map((p) => (
              <option key={p.slug} value={p.slug}>{p.label}</option>
            ))}
          </select>
        </div>

        <div className="fp-fld wide">
          <label className="fp-fld-label" htmlFor="tc-amount">
            {direction === 'forward' ? 'Points to transfer' : 'Miles you need'}
          </label>
          <input
            id="tc-amount"
            type="number"
            min={0}
            step={1000}
            className="fp-fld-val fp-mono"
            value={amount || ''}
            onChange={(e) => setAmount(Math.max(0, Number(e.target.value) || 0))}
          />
        </div>
      </div>

      {/* balance context — the wallet way (verified / self-entered) */}
      {from?.wallet && (
        <p className="fp-tc-balance">
          You hold <b className="fp-mono">{(from.balance ?? 0).toLocaleString('en-IN')}</b> in {from.label}{' '}
          <span className={`fp-pill ${from.selfEntered ? 'self' : 'wallet'}`}>
            {from.selfEntered ? 'Self-entered' : 'In wallet'}
          </span>
        </p>
      )}

      {/* RESULT — one frame; the shared Ladder sits inside it */}
      {loadingCards && !from ? (
        <div className="fp-empty" style={{ marginTop: 18 }}>Loading your cards…</div>
      ) : routes.length ? (
        <div className="fp-result">
          {direction === 'forward' ? (
            <p className="fp-tc-afford">
              {amount > 0 ? (
                <><b className="fp-mono">{amount.toLocaleString('en-IN')}</b> {from?.label ?? 'points'} become up to{' '}
                  <b className="fp-mono">{fwdBestMiles.toLocaleString('en-IN')}</b> {toLabel} miles on the best route
                  {from?.selfEntered && ' (based on the balance you entered)'}.</>
              ) : (
                'Enter the points you want to transfer.'
              )}
            </p>
          ) : holds != null && revNeed != null ? (
            <p className="fp-tc-afford">
              {revShort > 0 ? (
                <>Best route needs <b className="fp-mono">{revNeed.toLocaleString('en-IN')}</b> — you’re{' '}
                  <b className="fp-mono">{revShort.toLocaleString('en-IN')} short</b>.
                  {from?.selfEntered && ' Based on the balance you entered.'}</>
              ) : (
                <>Your balance covers the best route (<b className="fp-mono">{revNeed.toLocaleString('en-IN')}</b> needed).</>
              )}
            </p>
          ) : null}
          <Ladder
            routes={routes}
            cardName={from?.label ?? 'Your points'}
            programme={toLabel}
            receive={direction === 'forward' ? amount : undefined}
          />
        </div>
      ) : from ? (
        <div className="fp-empty" style={{ marginTop: 18 }}>
          No known route from {from.label} into {toLabel}. We won’t guess a ratio — a
          route only appears here once it’s in the transfer graph with a source and a state.
        </div>
      ) : null}
    </div>
  );
}
