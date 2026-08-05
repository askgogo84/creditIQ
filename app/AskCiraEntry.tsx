'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import styles from './page.module.css';

const cx = (...names: string[]) => names.map((n) => styles[n]).join(' ');

// §08 Ask CIRA — the chat entry block. A static demo exchange sits above a live
// launcher: whatever you type is carried to the real CIRA surface at /cira?q=… (the
// same ?q= prefill convention the assistant itself uses for /travel). CIRA reads the
// param on mount and drops it in its box. Empty submit still routes to /cira.
export function AskCiraEntry() {
  const router = useRouter();
  const [q, setQ] = useState('');

  const go = (e: React.FormEvent) => {
    e.preventDefault();
    const t = q.trim();
    router.push(t ? `/cira?q=${encodeURIComponent(t)}` : '/cira');
  };

  return (
    <div className={cx('hm-ask')}>
      <div className={cx('hm-chat')}>
        <div className={cx('hm-msg', 'hm-you')}>
          <span>I have HDFC Regalia. ₹2,500 fee.</span>
        </div>
        <div className={cx('hm-msg', 'hm-ai')}>
          <span>
            <b>Grade: C+</b>
            <br />
            You&rsquo;re earning about 1.2% effective. For a ₹2,500 annual fee you need roughly ₹2L a month to break even.
            <br />
            <br />
            <b>Verdict:</b> overpriced for most spends. Axis Magnus or IDFC Wealth do more at your level.
          </span>
        </div>
      </div>
      <form className={cx('hm-askrow')} onSubmit={go}>
        <input
          className={cx('hm-askinput')}
          type="text"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Try: I have SBI SimplyCLICK"
          aria-label="Ask CIRA a question"
        />
        <button className={cx('hm-btn', 'hm-solid')} type="submit">Ask →</button>
      </form>
      <div className={cx('hm-askmeta')}>
        <span>Live · responses in seconds</span>
        <span>No login · no data stored</span>
      </div>
    </div>
  );
}
