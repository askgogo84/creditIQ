'use client';
import React, { useState, useEffect } from 'react';

export function ScrollButton() {
  const [visible, setVisible] = useState(false);
  const [atBottom, setAtBottom] = useState(false);

  useEffect(() => {
    const onScroll = () => {
      const scrollY = window.scrollY;
      const docH = document.documentElement.scrollHeight - window.innerHeight;
      setVisible(scrollY > 300);
      setAtBottom(scrollY > docH - 100);
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const handleClick = () => {
    if (atBottom) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      window.scrollTo({ top: document.documentElement.scrollHeight, behavior: 'smooth' });
    }
  };

  if (!visible) return null;

  return (
    <button
      onClick={handleClick}
      aria-label={atBottom ? 'Scroll to top' : 'Scroll to bottom'}
      style={{
        position: 'fixed',
        bottom: 28,
        right: 28,
        width: 48,
        height: 48,
        borderRadius: '50%',
        background: 'var(--ink,#142950)',
        color: '#fff',
        border: 'none',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        boxShadow: '0 4px 20px rgba(20,41,80,0.25)',
        zIndex: 999,
        transition: 'all 0.25s',
        fontSize: 20,
        lineHeight: 1,
      }}
      onMouseEnter={e => {
        (e.currentTarget as HTMLElement).style.background = 'var(--copper-3,#D89B2A)';
        (e.currentTarget as HTMLElement).style.transform = 'scale(1.1)';
      }}
      onMouseLeave={e => {
        (e.currentTarget as HTMLElement).style.background = 'var(--ink,#142950)';
        (e.currentTarget as HTMLElement).style.transform = 'scale(1)';
      }}
    >
      {atBottom ? '↑' : '↓'}
    </button>
  );
}
