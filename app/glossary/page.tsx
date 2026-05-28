import { Header } from '@/components/Header';
import { DesignFooter } from '@/components/design/Footer';
import { Reveal } from '@/components/design/Reveal';

const TERMS = [
  { term: 'Annual Fee', def: 'Yearly charge for holding the card. Many cards waive this if you spend above a threshold (fee waiver spend).' },
  { term: 'Annual Percentage Rate (APR)', def: 'The yearly interest rate charged if you carry a balance. Indian cards typically range from 23% to 53%. Always pay in full to avoid this.' },
  { term: 'Base Reward Rate', def: 'The standard percentage of spend returned as rewards on non-category purchases. E.g. 1% means Rs.1 back per Rs.100 spent.' },
  { term: 'CIBIL Score', def: "India's most widely used credit score, ranging from 300-900. Above 750 is considered excellent. Maintained by TransUnion CIBIL." },
  { term: 'Credit Utilisation', def: 'The percentage of your total credit limit currently in use. Keeping it below 30% positively impacts your credit score.' },
  { term: 'Devaluation', def: 'When a bank reduces card benefits — cutting reward rates, adding caps, gating lounge access, or increasing fees — without changing the card name.' },
  { term: 'EDGE Miles', def: "Axis Bank's reward currency. Can be transferred to airline miles (KrisFlyer) or hotel points at competitive ratios." },
  { term: 'Fee Waiver', def: 'Many cards waive the annual fee if you spend above a certain amount in a year. E.g. HDFC Regalia Gold waives Rs.2,500 fee on Rs.4L annual spend.' },
  { term: 'Flying Returns', def: "Air India's frequent flyer program. Earnable via Air India SBI card and some other co-branded cards." },
  { term: 'Forex Markup', def: 'Additional charge on international transactions, typically 1.5% to 3.5% of the transaction amount. Zero forex cards waive this entirely.' },
  { term: 'Fuel Surcharge Waiver', def: 'Most credit cards charge 1% surcharge on fuel purchases. Cards with this benefit waive it, saving Rs.10-50 per fill-up.' },
  { term: 'Hard Inquiry', def: 'A credit check triggered by a card application. Reduces your score by 5-10 points. Too many in a short period signals risk.' },
  { term: 'Interchange Fee', def: 'The fee banks charge merchants for accepting card payments. This is how banks fund reward programs without charging users.' },
  { term: 'Interest-Free Period', def: 'Days between purchase and payment due date where no interest is charged. Typically 20-50 days depending on when in the billing cycle you spend.' },
  { term: 'Joining Fee', def: 'One-time fee paid when you first get the card. Different from annual fee (which recurs). Often offset by welcome benefits.' },
  { term: 'KrisFlyer', def: "Singapore Airlines' frequent flyer program. One of the best partners for HDFC and Axis card transfers. Known for Business Class sweet spots." },
  { term: 'Lounge Access', def: 'Complimentary access to airport lounges. Domestic (Dreamfolks/VISA) and international (Priority Pass) are different networks with different coverage.' },
  { term: 'Marriott Bonvoy', def: "Marriott's hotel loyalty program. Points transfer partner for HDFC, Axis, and Amex cards. Cat 1-4 hotels in India offer best value redemptions." },
  { term: 'Membership Rewards', def: "American Express's reward currency. Transfers to Marriott Bonvoy (1:1), British Airways Avios (1:1), and other partners." },
  { term: 'Milestone Bonus', def: 'Extra rewards earned when cumulative spend hits a threshold. E.g. Amex gives 7,700 bonus MR points on Rs.1.9L annual spend.' },
  { term: 'MITC', def: 'Most Important Terms and Conditions. The official document banks publish with all card terms. Changes here = devaluations.' },
  { term: 'NeuCoins', def: "Tata Neu app's reward currency, worth Rs.1 each within the Tata ecosystem (BigBasket, Croma, 1mg, Westside, Air Asia)." },
  { term: 'Priority Pass', def: "The world's largest independent airport lounge access program. Cards with Priority Pass give access to 1,300+ lounges globally." },
  { term: 'Redemption Haircut', def: 'The value lost when redeeming points for low-value options. E.g. HDFC points worth Rs.1.80 via KrisFlyer are worth only Rs.0.30 as cashback.' },
  { term: 'Reward Currency', def: 'The points/miles/cashback type earned by a card. Different currencies have different transfer partners and redemption values.' },
  { term: 'Reward Rate', def: 'The effective percentage return on spend as rewards. Always verify the redemption value — a "5X points" card may only give 0.5% actual value.' },
  { term: 'Revolving Credit', def: "Carrying a balance from one month to the next. Triggers interest charges at the APR. Should be avoided given India's high APRs (42-53%)." },
  { term: 'Soft Inquiry', def: 'A credit check that does NOT affect your score. Checking your own score is always a soft inquiry.' },
  { term: 'Welcome Benefit', def: 'One-time reward given on joining a card, often as bonus points, vouchers, or fee reversal. Best cards give benefits equal to or exceeding the joining fee.' },
];

export const metadata = {
  title: 'Credit Card Glossary | CreditIQ',
  description: 'Plain-English definitions of every credit card term used in India.',
};

export default function GlossaryPage() {
  const grouped = TERMS.reduce((acc, t) => {
    const letter = t.term[0].toUpperCase();
    if (!acc[letter]) acc[letter] = [];
    acc[letter].push(t);
    return acc;
  }, {} as Record<string, typeof TERMS>);

  return (
    <>
      <Header />
      <div className="page-fade">
        <section style={{ position: 'relative', paddingTop: 'clamp(120px,18vw,150px)', paddingBottom: 48 }}>
          <div className="aurora" style={{ top: -80, right: -100, width: 600, height: 500, background: 'radial-gradient(circle,rgba(212,163,115,0.22),transparent 60%)' }} />
          <div className="shell" style={{ position: 'relative', zIndex: 2 }}>
            <Reveal>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: 10, padding: '7px 16px', borderRadius: 999, background: 'rgba(212,163,115,0.12)', border: '1px solid rgba(212,163,115,0.28)', marginBottom: 24 }}>
                <span style={{ fontFamily: 'var(--font-mono,monospace)', fontSize: 10, letterSpacing: '0.18em', color: 'var(--copper,#8C5F12)', textTransform: 'uppercase', fontWeight: 700 }}>{TERMS.length} terms &bull; Updated 2026</span>
              </div>
              <h1 style={{ fontSize: 'clamp(36px,6vw,80px)', fontWeight: 800, color: 'var(--ink,#142950)', lineHeight: 1.0, letterSpacing: '-0.03em', margin: '0 0 16px' }}>
                Plain-English{' '}
                <span style={{ fontFamily: 'var(--font-serif,Georgia,serif)', color: 'var(--copper-3,#D89B2A)', fontStyle: 'italic', fontWeight: 400 }}>definitions</span>
              </h1>
              <p style={{ fontSize: 'clamp(15px,1.4vw,18px)', color: 'var(--ink-2,#2A3F6B)', lineHeight: 1.65, margin: '0 0 28px', maxWidth: 520 }}>
                Every term banks use, explained without jargon.
              </p>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {Object.keys(grouped).sort().map(l => (
                  <a key={l} href={`#${l}`} style={{ width: 36, height: 36, borderRadius: 8, border: '1px solid var(--line,rgba(20,41,80,0.12))', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontFamily: 'var(--font-mono,monospace)', fontWeight: 700, color: 'var(--ink-3,#5A6A8A)', textDecoration: 'none', background: 'var(--surface,#fff)', transition: 'all 0.15s' }}>
                    {l}
                  </a>
                ))}
              </div>
            </Reveal>
          </div>
        </section>

        <section style={{ paddingBottom: 80 }}>
          <div className="shell" style={{ display: 'flex', flexDirection: 'column', gap: 40 }}>
            {Object.keys(grouped).sort().map(letter => (
              <Reveal key={letter}>
                <div id={letter}>
                  <div style={{ fontSize: 'clamp(28px,4vw,48px)', fontFamily: 'var(--font-serif,Georgia,serif)', fontStyle: 'italic', fontWeight: 400, color: 'var(--copper-3,#D89B2A)', marginBottom: 16, paddingBottom: 12, borderBottom: '1px solid var(--line,rgba(20,41,80,0.08))' }}>
                    {letter}
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {grouped[letter].map(t => (
                      <div key={t.term} style={{ background: 'var(--paper,#FAF5EB)', border: '1px solid var(--line,rgba(20,41,80,0.08))', borderRadius: 14, padding: '16px 20px' }}>
                        <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--ink,#142950)', marginBottom: 6, letterSpacing: '-0.01em' }}>{t.term}</div>
                        <div style={{ fontSize: 14, color: 'var(--ink-2,#2A3F6B)', lineHeight: 1.75 }}>{t.def}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
        </section>
        <DesignFooter />
      </div>
    </>
  );
}
