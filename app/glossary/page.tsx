import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { CompareTray } from '@/components/CompareTray';

const TERMS = [
  { term: 'Annual Fee', def: 'Yearly charge for holding the card. Many cards waive this if you spend above a threshold (fee waiver spend).' },
  { term: 'Annual Percentage Rate (APR)', def: 'The yearly interest rate charged if you carry a balance. Indian cards typically range from 23% to 53%. Always pay in full to avoid this.' },
  { term: 'Base Reward Rate', def: 'The standard percentage of spend returned as rewards on non-category purchases. E.g. 1% means â‚¹1 back per â‚¹100 spent.' },
  { term: 'CIBIL Score', def: 'India\'s most widely used credit score, ranging from 300-900. Above 750 is considered excellent. Maintained by TransUnion CIBIL.' },
  { term: 'Credit Utilisation', def: 'The percentage of your total credit limit currently in use. Keeping it below 30% positively impacts your credit score.' },
  { term: 'Devaluation', def: 'When a bank reduces the benefits of a credit card â€” cutting reward rates, adding caps, gating lounge access, or increasing fees â€” without changing the card name.' },
  { term: 'EDGE Miles', def: 'Axis Bank\'s reward currency. Can be transferred to airline miles (KrisFlyer) or hotel points (Marriott Bonvoy) at competitive ratios.' },
  { term: 'Fee Waiver', def: 'Many cards waive the annual fee if you spend above a certain amount in a year. E.g. HDFC Regalia Gold waives â‚¹2,500 fee on â‚¹4L annual spend.' },
  { term: 'Flying Returns', def: 'Air India\'s frequent flyer program. Earnable via Air India SBI card and some other co-branded cards.' },
  { term: 'Forex Markup', def: 'Additional charge on international transactions, typically 1.5% to 3.5% of the transaction amount. Zero forex cards (YES Marquee, IDFC Wealth) waive this.' },
  { term: 'Fuel Surcharge Waiver', def: 'Most credit cards charge 1% surcharge on fuel purchases. Cards with this benefit waive it, saving â‚¹10-50 per fill-up.' },
  { term: 'Hard Inquiry', def: 'A credit check triggered by a card application. Reduces your score by 5-10 points. Too many in a short period signals risk.' },
  { term: 'Interchange Fee', def: 'The fee banks charge merchants for accepting card payments. This is how banks fund reward programs without charging users.' },
  { term: 'Interest-Free Period', def: 'Days between purchase and payment due date where no interest is charged. Typically 20-50 days depending on when in the billing cycle you spend.' },
  { term: 'Joining Fee', def: 'One-time fee paid when you first get the card. Different from annual fee (which recurs). Often offset by welcome benefits.' },
  { term: 'KrisFlyer', def: 'Singapore Airlines\' frequent flyer program. One of the best partners for HDFC and Axis card transfers. Known for Business Class sweet spots.' },
  { term: 'Lounge Access', def: 'Complimentary access to airport lounges. Domestic (Dreamfolks/VISA) and international (Priority Pass) are different networks with different coverage.' },
  { term: 'Marriott Bonvoy', def: 'Marriott\'s hotel loyalty program. Points transfer partner for HDFC, Axis, and Amex cards. Cat 1-4 hotels in India offer best value redemptions.' },
  { term: 'Membership Rewards', def: 'American Express\'s reward currency. Transfers to Marriott Bonvoy (1:1), British Airways Avios (1:1), and other partners.' },
  { term: 'Milestone Bonus', def: 'Extra rewards earned when cumulative spend hits a threshold. E.g. Amex gives 7,700 bonus MR points on â‚¹1.9L annual spend.' },
  { term: 'MITC', def: 'Most Important Terms and Conditions. The official document banks publish with all card terms. Changes here = devaluations.' },
  { term: 'NeuCoins', def: 'Tata Neu app\'s reward currency, worth â‚¹1 each within the Tata ecosystem (BigBasket, Croma, 1mg, Westside, Air Asia).' },
  { term: 'Priority Pass', def: 'The world\'s largest independent airport lounge access program. Cards with Priority Pass give access to 1,300+ lounges globally.' },
  { term: 'Redemption Haircut', def: 'The value lost when redeeming points for low-value options like catalog items or cashback. E.g. HDFC points worth â‚¹1.80 via KrisFlyer are worth only â‚¹0.30 as cashback.' },
  { term: 'Reward Currency', def: 'The points/miles/cashback type earned by a card. Different currencies have different transfer partners and redemption values.' },
  { term: 'Reward Rate', def: 'The effective percentage return on spend as rewards. Always verify the redemption value â€” a "5X points" card may only give 0.5% actual value.' },
  { term: 'Revolving Credit', def: 'Carrying a balance from one month to the next. Triggers interest charges at the APR. Should be avoided given India\'s high APRs (42-53%).' },
  { term: 'Soft Inquiry', def: 'A credit check that does NOT affect your score. Checking your own score is always a soft inquiry.' },
  { term: 'Welcome Benefit', def: 'One-time reward given on joining a card, often as bonus points, vouchers, or fee reversal. Best cards give benefits equal to or exceeding the joining fee.' },
];

export const metadata = {
  title: 'Credit Card Glossary Â· CreditIQ',
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
    <main className="min-h-screen">
      <Header />
      <section className="pt-28 pb-12 px-4 sm:px-6 grain">
        <div className="max-w-4xl mx-auto">
          <div className="divider-rule mb-6 max-w-xs">Credit card glossary</div>
          <h1 className="font-display text-4xl sm:text-5xl text-ink-50 mb-4">Plain-English definitions</h1>
          <p className="text-ink-300 text-lg font-display leading-relaxed">Every term banks use, explained without jargon. {TERMS.length} terms and counting.</p>
          <div className="flex flex-wrap gap-2 mt-6">
            {Object.keys(grouped).sort().map(l => (
              <a key={l} href={`#${l}`} className="w-8 h-8 rounded border border-white/10 flex items-center justify-center text-sm font-mono text-ink-300 hover:border-copper-500/40 hover:text-copper-300 transition-colors">{l}</a>
            ))}
          </div>
        </div>
      </section>
      <section className="pb-24 px-4 sm:px-6">
        <div className="max-w-4xl mx-auto space-y-10">
          {Object.keys(grouped).sort().map(letter => (
            <div key={letter} id={letter}>
              <div className="font-display text-3xl text-copper-400 mb-4 border-b border-white/10 pb-2">{letter}</div>
              <div className="space-y-4">
                {grouped[letter].map(t => (
                  <div key={t.term} className="bg-ink-900/40 border border-white/10 rounded-lg p-4">
                    <div className="font-display text-lg text-ink-50 mb-1">{t.term}</div>
                    <div className="text-sm text-ink-300 leading-relaxed">{t.def}</div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>
      <Footer />
      <CompareTray />
    </main>
  );
}

