'use client';

import { useEffect, useState } from 'react';

interface LogoProps {
  size?: 'sm' | 'md' | 'lg';
  showWordmark?: boolean;
}

export function Logo({ size = 'md', showWordmark = true }: LogoProps) {
  const [isDark, setIsDark] = useState(true);

  useEffect(() => {
    const check = () => setIsDark(document.documentElement.classList.contains('dark') || !document.documentElement.classList.contains('light'));
    check();
    const observer = new MutationObserver(check);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
    return () => observer.disconnect();
  }, []);

  const dims = { sm: 32, md: 44, lg: 60 }[size];
  const textSize = { sm: 'text-base', md: 'text-xl', lg: 'text-2xl' }[size];
  const subSize = { sm: 'text-[7px]', md: 'text-[9px]', lg: 'text-[11px]' }[size];

  const cardBg = isDark ? ['#0a0a0a', '#1a1a1f', '#0f0f14'] : ['#0f1f35', '#1B3A5C', '#0d2540'];

  return (
    <div className="flex items-center gap-2.5 select-none">
      {/* Card logo mark */}
      <div style={{ position: 'relative', width: dims, height: dims * 0.64, flexShrink: 0 }}>
        <svg
          width={dims}
          height={Math.round(dims * 0.64)}
          viewBox="0 0 100 64"
          xmlns="http://www.w3.org/2000/svg"
          style={{ display: 'block' }}
        >
          <defs>
            <linearGradient id="cardGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor={cardBg[0]} />
              <stop offset="45%" stopColor={cardBg[1]} />
              <stop offset="100%" stopColor={cardBg[2]} />
            </linearGradient>
            <linearGradient id="chipGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#C9972E" />
              <stop offset="30%" stopColor="#f0c060" />
              <stop offset="60%" stopColor="#C9972E" />
              <stop offset="100%" stopColor="#a07820" />
            </linearGradient>
            <linearGradient id="shineGrad" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="transparent" />
              <stop offset="40%" stopColor="rgba(255,255,255,0.06)" />
              <stop offset="50%" stopColor="rgba(255,255,255,0.12)" />
              <stop offset="60%" stopColor="rgba(255,255,255,0.06)" />
              <stop offset="100%" stopColor="transparent" />
            </linearGradient>
            <linearGradient id="edgeGrad" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="transparent" />
              <stop offset="30%" stopColor="rgba(255,255,255,0.35)" />
              <stop offset="55%" stopColor="rgba(201,151,46,0.5)" />
              <stop offset="80%" stopColor="rgba(255,255,255,0.25)" />
              <stop offset="100%" stopColor="transparent" />
            </linearGradient>
            <clipPath id="cardClip">
              <rect x="0" y="0" width="100" height="64" rx="9" ry="9" />
            </clipPath>
          </defs>

          {/* Card body */}
          <rect x="0" y="0" width="100" height="64" rx="9" fill="url(#cardGrad)" />

          {/* Gloss overlay */}
          <rect x="0" y="0" width="100" height="64" rx="9" fill="url(#shineGrad)" clipPath="url(#cardClip)" />

          {/* Top edge shine */}
          <rect x="0" y="0" width="100" height="1" fill="url(#edgeGrad)" rx="9" />

          {/* Chip */}
          <rect x="10" y="18" width="22" height="17" rx="3" fill="url(#chipGrad)" />
          <line x1="10" y1="24" x2="32" y2="24" stroke="rgba(0,0,0,0.15)" strokeWidth="0.5" />
          <line x1="10" y1="29" x2="32" y2="29" stroke="rgba(0,0,0,0.15)" strokeWidth="0.5" />
          <line x1="18" y1="18" x2="18" y2="35" stroke="rgba(0,0,0,0.12)" strokeWidth="0.5" />
          <line x1="24" y1="18" x2="24" y2="35" stroke="rgba(0,0,0,0.12)" strokeWidth="0.5" />

          {/* 4-point sparkle — main */}
          <path d="M76,6 L78.5,13 L86,15.5 L78.5,18 L76,25 L73.5,18 L66,15.5 L73.5,13 Z" fill="#C9972E" />
          {/* secondary small sparkle */}
          <path d="M88,2 L89.5,6.5 L94,8 L89.5,9.5 L88,14 L86.5,9.5 L82,8 L86.5,6.5 Z" fill="#C9972E" opacity="0.65" />
          {/* tiny dot */}
          <circle cx="92" cy="18" r="1.8" fill="#C9972E" opacity="0.4" />
          <circle cx="64" cy="8" r="1.2" fill="#C9972E" opacity="0.3" />

          {/* Card name at bottom */}
          <text x="10" y="52" fontSize="11" fontWeight="500" fill="rgba(255,255,255,0.92)" fontFamily="Arial, sans-serif" letterSpacing="0.3">CreditIQ</text>
          <text x="10" y="61" fontSize="5.5" fill="#C9972E" fontFamily="Arial, sans-serif" letterSpacing="2.5" opacity="0.85">INTELLIGENCE</text>
        </svg>
      </div>

      {/* Wordmark */}
      {showWordmark && (
        <div className="flex flex-col leading-none">
          <span className={`font-display ${textSize} font-medium`} style={{ color: 'var(--text)', letterSpacing: '-0.3px' }}>
            CreditIQ
          </span>
          <span className={`${subSize} font-mono uppercase tracking-widest mt-0.5`} style={{ color: 'var(--text-dim)' }}>
            Intelligence
          </span>
        </div>
      )}
    </div>
  );
}
