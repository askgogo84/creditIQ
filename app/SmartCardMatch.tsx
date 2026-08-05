'use client';

import { useMemo, useState } from 'react';
import styles from './page.module.css';

// Smart Card Match — the seven-question stepper from docs/design/home-merge-v4.html,
// ported from the comp's vanilla-JS state machine to React. No credit pull, nothing
// stored: it's a pure client-side score over a small POOL of representative cards, so
// the "best match so far" panel updates from the first answer on. Honesty framing kept
// verbatim (Estimated · published earn rules; "if your current card already wins, we'll
// tell you to keep it").
//
// This is a REPRESENTATIVE demo pool + heuristic scoring, deliberately NOT the full
// engine over SEED_CARDS — the comp models it as a lightweight interactive teaser that
// hands off to the real compute ("See the full working" / upload a statement). The
// figures it shows are card names/fees, not fabricated rupee returns.

type QType = 'single' | 'multi';
type Question = { k: string; t: QType; q: string; why: string; o: [string, string][] };
type Card = { id: string; n: string; b: string; tags: Record<string, number> };

const Q: Question[] = [
  {
    k: 'goal', t: 'single', q: 'What should this card actually do for you?',
    why: 'This decides whether we optimise for rupees back or for point value at redemption.',
    o: [['cash', 'Cash back on everyday spend'], ['points', "Points I'll turn into flights"], ['both', "Both — I'll carry two cards"]],
  },
  {
    k: 'cats', t: 'multi', q: 'Where does your money actually go?',
    why: 'Indian cards pay wildly different rates by category. Pick your top three.',
    o: [['online', 'Online shopping'], ['dining', 'Dining and food delivery'], ['grocery', 'Groceries and quick commerce'], ['fuel', 'Fuel'], ['travel', 'Flights and hotels'], ['bills', 'Utilities and bills']],
  },
  {
    k: 'rent', t: 'single', q: 'Do you pay rent or big bills on a card?',
    why: 'Most Indian cards exclude rent from rewards or charge 1% on it. This is where people lose the most without noticing.',
    o: [['rent', 'Yes, rent goes on the card'], ['bills', 'Utilities only, not rent'], ['none', 'Neither']],
  },
  {
    k: 'fly', t: 'single', q: 'How much do you fly in a year?',
    why: 'Lounge access and transfer partners only earn their keep above a certain frequency.',
    o: [['rare', 'Rarely — once or twice'], ['dom', '3–8 domestic trips'], ['intl', 'International at least once a year'], ['heavy', "I'm on a plane most months"]],
  },
  {
    k: 'fee', t: 'single', q: 'What annual fee are you willing to pay?',
    why: "We'll only show a fee card if the computed return clears the fee at your spend.",
    o: [['free', '₹0 — free cards only'], ['1k', 'Up to ₹1,000'], ['5k', 'Up to ₹5,000'], ['any', 'Anything, if it pays for itself']],
  },
  {
    k: 'have', t: 'multi', q: 'Which cards do you already hold?',
    why: "So we don't recommend a card you have, and so we can respect issuer limits and cooling periods.",
    o: [['hdfc', 'Something from HDFC'], ['axis', 'Something from Axis'], ['icici', 'Something from ICICI'], ['sbi', 'Something from SBI'], ['amex', 'American Express'], ['none', 'None yet']],
  },
  {
    k: 'effort', t: 'single', q: 'How much effort will you put in?',
    why: 'An optimiser and someone who wants one card in the wallet need different answers.',
    o: [['one', 'One card, keep it simple'], ['two', 'Two cards, split by category'], ['max', "Whatever earns the most, I'll juggle"]],
  },
];

const POOL: Card[] = [
  { id: 'icici', n: 'Amazon Pay Credit Card', b: 'ICICI Bank · ₹0 fee', tags: { cash: 3, online: 3, free: 3, one: 2, rare: 1 } },
  { id: 'sbi', n: 'Cashback Card', b: 'SBI Card · ₹999 fee', tags: { cash: 3, online: 2, dining: 2, '1k': 3, one: 2 } },
  { id: 'axis', n: 'Atlas', b: 'Axis Bank · ₹5,000 fee', tags: { points: 3, travel: 3, intl: 3, dom: 2, '5k': 3, two: 2, max: 2 } },
  { id: 'hdfc', n: 'Infinia Metal Edition', b: 'HDFC Bank · ₹12,500 fee', tags: { points: 3, travel: 2, heavy: 3, intl: 2, any: 3, max: 3 } },
  { id: 'amex', n: 'Platinum Travel', b: 'American Express · ₹5,000 fee', tags: { points: 2, travel: 2, dom: 3, '5k': 2, two: 1 } },
];

type Answers = Record<string, string | string[]>;

function score(ans: Answers) {
  return POOL.map((c) => {
    let v = 0;
    Object.keys(ans).forEach((k) => {
      const a = ans[k];
      (Array.isArray(a) ? a : [a]).forEach((x) => { if (c.tags[x]) v += c.tags[x]; });
    });
    const have = ans.have;
    if (Array.isArray(have) && have.indexOf(c.id) > -1) v -= 4;
    return { c, v };
  }).sort((a, b) => b.v - a.v);
}

function reasons(ans: Answers): string[] {
  const r: string[] = [];
  if (ans.goal === 'cash') r.push('you want rupees back rather than points');
  if (ans.goal === 'points') r.push('you want point value at redemption');
  const cats = ans.cats;
  if (Array.isArray(cats) && cats.length) r.push('your spend is concentrated in ' + cats.length + ' categor' + (cats.length > 1 ? 'ies' : 'y'));
  if (ans.rent === 'rent') r.push('rent is on the card, which most issuers exclude');
  if (ans.fly === 'intl' || ans.fly === 'heavy') r.push('you fly enough for transfer partners to pay');
  if (ans.fee === 'free') r.push('you capped the fee at zero');
  if (ans.fee === 'any') r.push("you'll pay a fee if the maths clears it");
  return r;
}

const cx = (...names: string[]) => names.map((n) => styles[n]).join(' ');

export function SmartCardMatch() {
  const [ans, setAns] = useState<Answers>({});
  const [step, setStep] = useState(0);
  const [skipNote, setSkipNote] = useState(false);

  const ranked = useMemo(() => score(ans), [ans]);
  const answered = Object.keys(ans).length;
  const done = step >= Q.length;

  const choose = (v: string) => {
    if (done) return;
    const q = Q[step];
    setAns((prev) => {
      if (q.t === 'multi') {
        const a = Array.isArray(prev[q.k]) ? [...(prev[q.k] as string[])] : [];
        const i = a.indexOf(v);
        if (i > -1) a.splice(i, 1); else a.push(v);
        return { ...prev, [q.k]: a };
      }
      return { ...prev, [q.k]: v };
    });
  };

  const q = done ? null : Q[step];
  const cur = q ? ans[q.k] : undefined;
  const isOn = (val: string) =>
    q?.t === 'multi' ? Array.isArray(cur) && cur.indexOf(val) > -1 : cur === val;

  const pct = done ? 100 : ((step + 1) / Q.length) * 100;
  const nextLabel = done ? 'See the full working →' : step === Q.length - 1 ? 'See my match' : 'Next';
  const note = skipNote
    ? 'Statement Truth reads your real categories instead of asking you to guess them.'
    : done
      ? 'If your current card already wins at your spend, we will tell you to keep it.'
      : 'Nothing is stored until you ask us to.';

  return (
    <div className={cx('hm-mgrid')}>
      <div className={cx('hm-mcard')}>
        <div className={cx('hm-prog')}>
          <button className={cx('hm-back')} aria-label="Back" onClick={() => setStep((s) => Math.max(0, s - 1))} disabled={step === 0}>←</button>
          <div className={cx('hm-progbar')}><div className={cx('hm-progfill')} style={{ width: `${pct}%` }} /></div>
          <div className={cx('hm-progn')}>{done ? 'Done' : `${step + 1} of ${Q.length}`}</div>
        </div>

        <div>
          {done ? (
            <>
              <div className={cx('hm-qh')}>Here is what the maths picks.</div>
              <div className={cx('hm-qwhy')}>Computed from published earn rules at the spend you set in the hero. No credit check was run and no data was stored.</div>
              <div className={cx('hm-opts')}>
                <button className={cx('hm-opt', 'hm-on')} type="button"><span className={cx('hm-box')}>✓</span>{ranked[0].c.n} — {ranked[0].c.b}</button>
                <button className={cx('hm-opt')} type="button"><span className={cx('hm-box')} />Runner-up: {ranked[1].c.n}</button>
              </div>
            </>
          ) : (
            <>
              <div className={cx('hm-qh')}>{q!.q}</div>
              <div className={cx('hm-qwhy')}>{q!.why}</div>
              <div className={cx('hm-opts')}>
                {q!.o.map(([val, label]) => {
                  const on = isOn(val);
                  return (
                    <button
                      key={val}
                      type="button"
                      className={cx('hm-opt', ...(q!.t === 'multi' ? ['hm-multi'] : []), ...(on ? ['hm-on'] : []))}
                      onClick={() => choose(val)}
                    >
                      <span className={cx('hm-box')}>{on ? '✓' : ''}</span>{label}
                    </button>
                  );
                })}
              </div>
            </>
          )}
        </div>

        <div className={cx('hm-mfoot')}>
          <button className={cx('hm-btn', 'hm-solid')} type="button" onClick={() => setStep((s) => Math.min(Q.length, s + 1))} disabled={done}>{nextLabel}</button>
          <button className={cx('hm-btn', 'hm-tealout')} type="button" onClick={() => setSkipNote(true)}>Skip the questions — upload a statement</button>
        </div>
        <p className={cx('hm-mnote')} style={{ marginTop: 14 }}>{note}</p>
      </div>

      <aside className={cx('hm-side')}>
        <div className={cx('hm-lab')}>Best match so far</div>
        <div className={cx('hm-mname')}>{answered ? ranked[0].c.n : 'Answer one question'}</div>
        <div className={cx('hm-mbank')}>{answered ? ranked[0].c.b : 'The match updates as you go'}</div>
        <p className={cx('hm-why')}>
          {answered
            ? (reasons(ans).length ? 'Leading because ' + reasons(ans).join(', and ') + '.' : 'Leading on your answers so far.')
            : 'We show the leading card from the first answer onward, and the reason it leads. If your current card is already the right one, we say that instead of selling you a new one.'}
        </p>
        <div className={cx('hm-runner')}>
          {answered > 1
            ? <>Runner-up: <b>{ranked[1].c.n}</b> — closer if your split shifts.</>
            : 'Runner-up appears once we have two answers.'}
        </div>
        <span className={cx('hm-mstamp')}>Estimated · published earn rules</span>
      </aside>
    </div>
  );
}
