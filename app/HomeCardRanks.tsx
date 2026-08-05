'use client';

import { useMemo } from 'react';
import { SEED_CARDS } from '@/lib/data/seed-cards';
import { matchCards } from '@/lib/engine';
import { useSpend } from '@/components/marketing/landing/SpendContext';
import styles from './page.module.css';

// §06 Cards at your spend — a ranked list computed LIVE from the engine (matchCards
// over SEED_CARDS), never a hardcoded leaderboard. Reads the ONE shared spend from
// SpendContext — the hero's slider — so moving that slider reorders these rows in the
// same tick (and they can never contradict the hero's leak range). Each value is a real
// net-annual figure (earn from published rules at cached rates, minus the fee); all
// rows are Estimated until a statement is linked (see the ranknote below the list).
//
// Same data source as /landing's CardRankings; this is the home-merge-v4 row treatment
// (position · name · bank · value/year) on the white/copper palette, not a re-skin of
// that navy/gold table.

const cx = (...names: string[]) => names.map((n) => styles[n]).join(' ');
const INR = (n: number) => '₹' + Math.round(n).toLocaleString('en-IN');
const TOP_N = 6;

export function HomeCardRanks() {
  const { spend } = useSpend();
  const ranked = useMemo(
    () => matchCards(SEED_CARDS, { monthly_total_inr: spend }).slice(0, TOP_N),
    [spend]
  );

  return (
    <div className={cx('hm-ranks')}>
      {ranked.map((r, i) => {
        const fee = r.card.annual_fee_inr > 0 ? `fee ${INR(r.card.annual_fee_inr)}` : 'no annual fee';
        return (
          <div key={r.card.id} className={cx('hm-rank')}>
            <div className={cx('hm-pos')}>{String(i + 1).padStart(2, '0')}</div>
            <div style={{ minWidth: 0 }}>
              <div className={cx('hm-nm')}>{r.card.name}</div>
              <div className={cx('hm-bank')}>{r.card.bank} · {fee}</div>
            </div>
            <div className={cx('hm-val')}>
              <div className={cx('hm-v')}>{INR(r.annual_value_inr)}</div>
              <div className={cx('hm-l')}>per year</div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
