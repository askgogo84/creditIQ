'use client';

// /transfer-partners — a LIVE transfer calculator on findTransferRoutes
// (lib/transfer-ladder.ts). Replaces the old hardcoded PARTNERS marketing table
// (unsourced ratio/timeline/sweet-spot strings keyed by bank name) — those were
// deliberately NOT migrated: any figure worth keeping goes through transfer-graph
// with a real source + state (the separate issuer-sourcing task), never as a
// display string here.
//
// Pick a from-currency (defaulting to your wallet cards, balances inline the way
// the wallet shows them), a to-programme, and the miles you need -> the ladder
// renders in the SAME component the board's expanded row uses (one Ladder, not two):
// path, nominal ratio, hops, days ("time unknown" where unknown), provenance state,
// and the payable pointsRequired. No route -> we say so; never a guessed ratio.

import { useEffect, useMemo, useState } from 'react';
import { authedFetch } from '@/lib/authed-fetch';
import { Ladder } from '@/components/ciq/fly-points/Ladder';
import { findTransferRoutes } from '@/lib/transfer-ladder';
import { TRANSFER_EDGES } from '@/lib/data/transfer-graph';
import { resolveCardCurrency } from '@/lib/transfer-map';
import { currencyToEdgeSlug, programLabel } from '@/lib/fusion-core';
import '@/components/ciq/fly-points/fly-points.css';

// Human labels for the transfer-graph from_currency slugs (the generic, no-wallet
// options). Anything unmapped falls back to a prettified slug.
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
  key: string;                 // select value
  label: string;               // display name (card or currency)
  slug: string;                // edge from_currency
  matchedCardName?: string;    // gates card-name-allowlisted edges (wallet cards only)
  balance?: number;            // wallet balance
  selfEntered?: boolean;       // provenance for the balance chip
  wallet: boolean;
}

// Distinct to-programmes present in the graph, labelled.
const TO_PROGRAMMES = Array.from(new Set(TRANSFER_EDGES.map((e) => e.to_programme)))
  .map((slug) => ({ slug, label: programLabel(slug) }))
  .sort((a, b) => a.label.localeCompare(b.label));

// Generic (no-wallet) from-currencies: every distinct edge from_currency.
const GENERIC_FROM: FromOption[] = Array.from(new Set(TRANSFER_EDGES.map((e) => e.from_currency)))
  .sort()
  .map((slug) => ({ key: `cur:${slug}`, label: prettySlug(slug), slug, wallet: false }));

export default function TransferCalculatorPage() {
  const [walletFrom, setWalletFrom] = useState<FromOption[]>([]);
  const [loadingCards, setLoadingCards] = useState(true);
  const [fromKey, setFromKey] = useState<string>('');
  const [toSlug, setToSlug] = useState<string>(TO_PROGRAMMES[0]?.slug ?? '');
  const [miles, setMiles] = useState<number>(40000);

  // Load wallet cards -> from-currency options (resolvable cards only). Balances
  // shown inline; statement cards are verified unless self-edited, manual are
  // self-entered — the same provenance the wallet uses.
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
          if (!resolved) return; // unresolvable card -> can't price honestly, skip
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
        if (opts.length) setFromKey(opts[0].key);
        else setFromKey(GENERIC_FROM[0]?.key ?? '');
      } catch {
        setFromKey(GENERIC_FROM[0]?.key ?? '');
      } finally {
        setLoadingCards(false);
      }
    })();
  }, []);

  const allFrom = useMemo(() => [...walletFrom, ...GENERIC_FROM], [walletFrom]);
  const from = allFrom.find((o) => o.key === fromKey) ?? null;
  const toLabel = TO_PROGRAMMES.find((p) => p.slug === toSlug)?.label ?? toSlug;

  const routes = useMemo(() => {
    if (!from || !toSlug || !(miles > 0)) return [];
    return findTransferRoutes(
      TRANSFER_EDGES,
      from.slug,
      toSlug,
      miles,
      from.matchedCardName ? { cardName: from.matchedCardName } : undefined,
    );
  }, [from, toSlug, miles]);

  // Wallet affordability, shown the wallet way (only when a held card is selected).
  const holds = from?.wallet ? from.balance ?? 0 : null;
  const need = routes[0]?.pointsRequired ?? null;
  const shortfall = holds != null && need != null ? Math.max(0, need - holds) : 0;

  return (
    <div className="fp-root">
      <h1 className="fp-title">Transfer calculator</h1>
      <p className="fp-sub">
        Pick where your points sit and where you want them — we show the real routes
        from the transfer graph, the payable number, and where there’s no route rather
        than a guessed ratio.
      </p>

      {/* CONTROLS — one frame */}
      <div className="fp-search fp-tc-controls">
        <div className="fp-fld wide">
          <label className="fp-fld-label" htmlFor="tc-from">From</label>
          <select
            id="tc-from"
            className="fp-fld-val"
            value={fromKey}
            onChange={(e) => setFromKey(e.target.value)}
          >
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
          <select
            id="tc-to"
            className="fp-fld-val"
            value={toSlug}
            onChange={(e) => setToSlug(e.target.value)}
          >
            {TO_PROGRAMMES.map((p) => (
              <option key={p.slug} value={p.slug}>{p.label}</option>
            ))}
          </select>
        </div>

        <div className="fp-fld wide">
          <label className="fp-fld-label" htmlFor="tc-miles">Miles you need</label>
          <input
            id="tc-miles"
            type="number"
            min={0}
            step={1000}
            className="fp-fld-val fp-mono"
            value={miles || ''}
            onChange={(e) => setMiles(Math.max(0, Number(e.target.value) || 0))}
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

      {/* RESULT — one frame; the ladder (shared with the board) sits inside it */}
      {loadingCards && !from ? (
        <div className="fp-empty" style={{ marginTop: 18 }}>Loading your cards…</div>
      ) : routes.length ? (
        <div className="fp-result">
          {holds != null && need != null && (
            <p className="fp-tc-afford">
              {shortfall > 0 ? (
                <>Best route needs <b className="fp-mono">{need.toLocaleString('en-IN')}</b> — you’re{' '}
                  <b className="fp-mono">{shortfall.toLocaleString('en-IN')} short</b>.
                  {from?.selfEntered && ' Based on the balance you entered.'}</>
              ) : (
                <>Your balance covers the best route (<b className="fp-mono">{need.toLocaleString('en-IN')}</b> needed).</>
              )}
            </p>
          )}
          <Ladder routes={routes} cardName={from?.label ?? 'Your points'} programme={toLabel} />
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
