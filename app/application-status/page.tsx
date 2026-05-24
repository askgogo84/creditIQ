'use client';
import { useState } from 'react';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { CompareTray } from '@/components/CompareTray';
import { ExternalLink, Clock, CheckCircle, Search } from 'lucide-react';

const STATUS_LINKS = [
  { bank: 'HDFC Bank', color: '#004C8F', url: 'https://leads.hdfcbank.com/applications/webforms/apply/HDFC_TrackApp/TrackApp.aspx', steps: ['Apply online', 'Verification call within 48hrs', 'Physical verification', 'Card dispatched in 7-10 days'], typical_days: '7-15' },
  { bank: 'SBI Card', color: '#2C4C9C', url: 'https://www.sbicard.com/en/personal/track-your-application.page', steps: ['Apply online', 'Document verification', 'Credit assessment', 'Card dispatched in 10-15 days'], typical_days: '10-21' },
  { bank: 'ICICI Bank', color: '#F58220', url: 'https://www.icicibank.com/card/credit-card/track-application', steps: ['Apply online', 'Instant decision in some cases', 'Physical verification', 'Card dispatched in 7-14 days'], typical_days: '7-14' },
  { bank: 'Axis Bank', color: '#97144D', url: 'https://www.axisbank.com/retail/credit-cards/track-application', steps: ['Apply online', 'Credit bureau check', 'Income verification', 'Card dispatched in 7-14 days'], typical_days: '7-14' },
  { bank: 'Kotak Bank', color: '#EF3E23', url: 'https://www.kotak.com/en/credit-cards/track-application.html', steps: ['Apply online', 'KYC verification', 'Credit assessment', 'Card dispatched in 7-10 days'], typical_days: '7-10' },
  { bank: 'American Express', color: '#006FCF', url: 'https://www.americanexpress.com/in/contact-us/check-application-status.html', steps: ['Apply online', 'Document submission', 'Credit review', 'Card dispatched in 10-14 days'], typical_days: '10-21' },
  { bank: 'IDFC FIRST Bank', color: '#9B0C2C', url: 'https://www.idfcfirstbank.com/credit-card/track-application', steps: ['Apply online', 'Video KYC (many cases)', 'Credit assessment', 'Card dispatched in 5-7 days'], typical_days: '5-10' },
  { bank: 'RBL Bank', color: '#1D4ED8', url: 'https://www.rblbank.com/cards/credit-card/track-my-application', steps: ['Apply online', 'Document verification', 'Credit check', 'Card dispatched in 7-14 days'], typical_days: '7-14' },
  { bank: 'YES Bank', color: '#0C2461', url: 'https://www.yesbank.in/personal-banking/yes-individual/cards/credit-card', steps: ['Apply online', 'KYC verification', 'Credit assessment', 'Card dispatched in 7-15 days'], typical_days: '7-15' },
  { bank: 'IndusInd Bank', color: '#312E81', url: 'https://www.indusind.com/in/en/personal/cards/credit-card.html', steps: ['Apply online', 'In-person verification', 'Credit assessment', 'Card dispatched in 10-15 days'], typical_days: '10-21' },
  { bank: 'Standard Chartered', color: '#0473EA', url: 'https://www.sc.com/in/credit-cards/track-application/', steps: ['Apply online', 'Document verification', 'Credit bureau check', 'Card dispatched in 7-14 days'], typical_days: '7-14' },
  { bank: 'AU Bank', color: '#7C2D12', url: 'https://www.aubank.in/credit-cards', steps: ['Apply online', 'Video KYC', 'Credit assessment', 'Card dispatched in 5-10 days'], typical_days: '5-10' },
  { bank: 'HSBC Bank', color: '#DB0011', url: 'https://www.hsbc.co.in/credit-cards/track-your-application/', steps: ['Apply online', 'Document verification', 'Credit review', 'Card dispatched in 10-14 days'], typical_days: '10-14' },
];

const STATUS_TIPS = [
  { icon: '📞', tip: 'Call the bank\'s credit card helpline after 5 working days if no update.' },
  { icon: '📧', tip: 'Check your registered email -- most banks send status emails at each stage.' },
  { icon: '📱', tip: 'SMS your application reference number to the bank\'s SMS service.' },
  { icon: '⚠️', tip: 'A "verification pending" status usually means a physical visit or document is needed.' },
  { icon: '❌', tip: 'If rejected, wait 6 months before applying again -- multiple rejections hurt your score.' },
];

export default function ApplicationStatusPage() {
  const [search, setSearch] = useState('');
  const filtered = STATUS_LINKS.filter(b => b.bank.toLowerCase().includes(search.toLowerCase()));

  return (
    <main className="min-h-screen">
      <Header />
      <section className="pt-28 pb-12 px-4 sm:px-6 grain">
        <div className="max-w-4xl mx-auto">
          <div className="divider-rule mb-6 max-w-xs">Application tracker</div>
          <h1 className="font-display text-4xl sm:text-5xl text-ink-50 mb-4 leading-tight">
            Track your card application
          </h1>
          <p className="text-ink-300 text-lg font-display leading-relaxed mb-8">
            Direct links to every bank's application status page. Know exactly where your application stands.
          </p>
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: 'var(--text-dim)' }} />
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search your bank..."
              style={{ width: '100%', paddingLeft: 36, paddingRight: 12, paddingTop: 10, paddingBottom: 10, background: 'var(--bg-input)', border: '1px solid var(--border)', borderRadius: 8, fontSize: 14, color: 'var(--text)', outline: 'none' }}
            />
          </div>
        </div>
      </section>

      <section className="pb-24 px-4 sm:px-6">
        <div className="max-w-4xl mx-auto space-y-12">

          <div className="grid sm:grid-cols-2 gap-4">
            {filtered.map(b => (
              <div key={b.bank} className="bg-ink-900/40 border border-white/10 rounded-xl overflow-hidden">
                <div className="flex items-center justify-between p-4 border-b border-white/5">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded flex items-center justify-center text-white font-bold text-xs" style={{ background: b.color }}>
                      {b.bank.slice(0,2)}
                    </div>
                    <div>
                      <div className="font-medium" style={{ color: 'var(--text)' }}>{b.bank}</div>
                      <div className="text-xs font-mono" style={{ color: 'var(--text-dim)' }}>Typically {b.typical_days} days</div>
                    </div>
                  </div>
                  <a href={b.url} target="_blank" rel="noopener noreferrer"
                    className="btn-primary text-xs py-2 px-3 flex items-center gap-1.5" style={{ minHeight: 36 }}>
                    Check status <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
                <div className="p-4">
                  <div className="text-[10px] font-mono uppercase tracking-widest mb-2" style={{ color: 'var(--text-dim)' }}>Typical process</div>
                  <div className="space-y-1.5">
                    {b.steps.map((step, i) => (
                      <div key={i} className="flex items-start gap-2 text-xs" style={{ color: 'var(--text-muted)' }}>
                        <div className="w-4 h-4 rounded-full flex items-center justify-center text-[9px] font-mono shrink-0 mt-0.5" style={{ background: 'var(--border)', color: 'var(--text-dim)' }}>{i+1}</div>
                        {step}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="bg-copper-500/10 border border-copper-500/30 rounded-xl p-6">
            <div className="flex items-center gap-2 mb-4">
              <Clock className="w-5 h-5 text-copper-400" />
              <h2 className="font-display text-xl" style={{ color: 'var(--text)' }}>Tips for faster approval</h2>
            </div>
            <div className="space-y-3">
              {STATUS_TIPS.map((t, i) => (
                <div key={i} className="flex items-start gap-3 text-sm" style={{ color: 'var(--text-muted)' }}>
                  <span className="text-lg shrink-0">{t.icon}</span>
                  {t.tip}
                </div>
              ))}
            </div>
          </div>

          <div className="bg-ink-900/40 border border-white/10 rounded-xl p-6">
            <div className="flex items-center gap-2 mb-4">
              <CheckCircle className="w-5 h-5 text-emerald-400" />
              <h2 className="font-display text-xl" style={{ color: 'var(--text)' }}>What the statuses mean</h2>
            </div>
            <div className="space-y-3">
              {[
                ['Application Received', 'Bank has your application. No action needed yet.', '#60a5fa'],
                ['Under Verification', 'Bank is verifying your documents and details. May call you.', '#fbbf24'],
                ['Credit Assessment', 'Credit bureau check in progress. Final decision coming soon.', '#a78bfa'],
                ['Approved', 'Congratulations. Card will be dispatched within 3-5 working days.', '#34d399'],
                ['Dispatched', 'Card is on its way. Track via courier link sent to your email.', '#34d399'],
                ['Rejected', 'Wait 6 months. Check your credit score and address any issues before re-applying.', '#f87171'],
                ['Documents Pending', 'Submit the requested documents immediately to avoid rejection.', '#fb923c'],
              ].map(([status, desc, color]) => (
                <div key={status} className="flex items-start gap-3">
                  <div className="text-xs font-bold font-mono px-2 py-1 rounded shrink-0 mt-0.5" style={{ background: `${color}20`, color }}>{status}</div>
                  <div className="text-sm" style={{ color: 'var(--text-muted)' }}>{desc}</div>
                </div>
              ))}
            </div>
          </div>

        </div>
      </section>
      <Footer />
      <CompareTray />
    </main>
  );
}
