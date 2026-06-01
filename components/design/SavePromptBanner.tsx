'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface SavePromptProps {
  feature: 'trip' | 'calculator';
  data?: any;
}

export function SavePromptBanner({ feature, data }: SavePromptProps) {
  const [dismissed, setDismissed] = useState(false);
  const [user, setUser] = useState<any>(null);
  const router = useRouter();

  useEffect(() => {
    const key = 'save_prompt_dismissed_' + feature;
    if (localStorage.getItem(key)) setDismissed(true);
    // Check if already logged in
    import('@/lib/supabase-client').then(({ getUser }) => {
      getUser().then(u => { if (u) setDismissed(true); });
    }).catch(() => {});
  }, [feature]);

  if (dismissed) return null;

  const dismiss = () => {
    localStorage.setItem('save_prompt_dismissed_' + feature, '1');
    setDismissed(true);
  };

  const messages = {
    trip: {
      title: 'Save this trip plan',
      sub: 'Get alerts when award seats open on this route. Free account, no spam.',
      cta: 'Save my trip plan',
      icon: '+',
    },
    calculator: {
      title: 'Get weekly reward alerts',
      sub: 'We will notify you when a better card launches for your spend pattern.',
      cta: 'Save my analysis',
      icon: '+',
    },
  };

  const msg = messages[feature];

  return (
    <div style={{
      background: 'linear-gradient(135deg, #1B3A5C, #0D2240)',
      borderRadius: 16, padding: '20px 24px', marginTop: 16,
      display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap',
      boxShadow: '0 4px 24px rgba(27,58,92,0.2)',
      border: '1px solid rgba(201,151,46,0.2)',
    }}>
      <div style={{ flex: 1, minWidth: 200 }}>
        <div style={{ fontSize: 15, fontWeight: 700, color: 'white', marginBottom: 4 }}>
          {msg.icon} {msg.title}
        </div>
        <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.6)', lineHeight: 1.5 }}>
          {msg.sub}
        </div>
      </div>
      <div style={{ display: 'flex', gap: 10, flexShrink: 0 }}>
        <button
          onClick={() => router.push('/auth/signup?from=' + feature)}
          style={{ padding: '10px 20px', borderRadius: 8, background: '#C9972E', color: 'white', fontWeight: 700, fontSize: 13, border: 'none', cursor: 'pointer', whiteSpace: 'nowrap' }}>
          {msg.cta}
        </button>
        <button
          onClick={dismiss}
          style={{ padding: '10px 16px', borderRadius: 8, background: 'rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.6)', fontWeight: 600, fontSize: 13, border: '1px solid rgba(255,255,255,0.1)', cursor: 'pointer', whiteSpace: 'nowrap' }}>
          Maybe later
        </button>
      </div>
    </div>
  );
}
