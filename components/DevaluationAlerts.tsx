'use client';

import { useState } from 'react';
import { SEED_CARDS } from '@/lib/data/seed-cards';
import { Bell, Check, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export function DevaluationAlerts() {
  const [email, setEmail] = useState('');
  const [selectedCards, setSelectedCards] = useState<string[]>([]);
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState<'email' | 'cards'>('email');

  const toggleCard = (id: string) => {
    setSelectedCards(prev =>
      prev.includes(id) ? prev.filter(c => c !== id) : [...prev, id]
    );
  };

  const handleEmailSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !email.includes('@')) return;
    setStep('cards');
  };

  const handleSubmit = async () => {
    if (selectedCards.length === 0) return;
    setLoading(true);
    try {
      await fetch('/api/alerts/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, cards: selectedCards }),
      });
    } catch {}
    setLoading(false);
    setSubmitted(true);
  };

  if (submitted) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-emerald-500/10 border border-emerald-500/30 rounded-xl p-6 text-center"
      >
        <div className="w-12 h-12 rounded-full bg-emerald-500/20 flex items-center justify-center mx-auto mb-4">
          <Check className="w-6 h-6 text-emerald-400" />
        </div>
        <h3 className="font-display text-xl text-ink-50 mb-2">You're on the watchlist</h3>
        <p className="text-sm text-ink-300">
          We'll email you at <span className="text-copper-300">{email}</span> the moment any of your {selectedCards.length} card{selectedCards.length > 1 ? 's' : ''} gets devalued.
        </p>
      </motion.div>
    );
  }

  return (
    <div className="bg-ink-900/60 border border-white/10 rounded-xl overflow-hidden">
      <div className="p-6 border-b border-white/5">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-9 h-9 rounded-lg bg-crimson-500/15 border border-crimson-500/30 flex items-center justify-center">
            <Bell className="w-4 h-4 text-crimson-400" />
          </div>
          <div>
            <h3 className="font-display text-lg text-ink-50">Devaluation alerts</h3>
            <p className="text-xs text-ink-400">Free. No spam. Unsubscribe anytime.</p>
          </div>
        </div>
        <p className="text-sm text-ink-300 leading-relaxed">
          Indian banks devalue cards without warning. Get emailed the moment your card's rewards are cut.
        </p>
      </div>

      <div className="p-6">
        <AnimatePresence mode="wait">
          {step === 'email' ? (
            <motion.form
              key="email"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              onSubmit={handleEmailSubmit}
              className="space-y-3"
            >
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="your@email.com"
                required
                className="w-full bg-ink-950 border border-white/10 rounded-lg px-4 py-3 text-sm text-ink-100 placeholder:text-ink-500 focus:border-copper-500 focus:outline-none"
              />
              <button
                type="submit"
                className="w-full btn-primary text-sm"
              >
                Continue  --  pick your cards ->
              </button>
            </motion.form>
          ) : (
            <motion.div
              key="cards"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-4"
            >
              <p className="text-xs text-ink-400 uppercase tracking-widest font-mono">
                Select cards you hold ({selectedCards.length} selected)
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-64 overflow-y-auto pr-1">
                {SEED_CARDS.filter(c => c.active).map(card => (
                  <button
                    key={card.id}
                    onClick={() => toggleCard(card.id)}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-lg border text-left transition-all ${
                      selectedCards.includes(card.id)
                        ? 'bg-copper-500/15 border-copper-500/40 text-copper-100'
                        : 'border-white/5 text-ink-200 hover:border-white/15 bg-ink-950/50'
                    }`}
                  >
                    <div
                      className="w-3 h-3 rounded-full shrink-0"
                      style={{ background: card.color }}
                    />
                    <span className="text-xs font-medium truncate">{card.name}</span>
                    {selectedCards.includes(card.id) && (
                      <Check className="w-3 h-3 text-copper-400 shrink-0 ml-auto" />
                    )}
                  </button>
                ))}
              </div>
              <div className="flex gap-2 pt-2">
                <button
                  onClick={() => setStep('email')}
                  className="btn-ghost text-sm flex-1"
                >
                  <- Back
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={selectedCards.length === 0 || loading}
                  className="btn-primary text-sm flex-1 disabled:opacity-50"
                >
                  {loading ? 'Saving...' : `Alert me on ${selectedCards.length} card${selectedCards.length !== 1 ? 's' : ''}`}
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
