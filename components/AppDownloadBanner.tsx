"use client";
import { useState, useEffect } from "react";

export function AppDownloadBanner() {
  const [visible, setVisible] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    // Only show on mobile and if not dismissed this session
    const isDismissed = sessionStorage.getItem("app-banner-dismissed");
    const isMobile = window.innerWidth < 768;
    if (isMobile && !isDismissed) {
      setTimeout(() => setVisible(true), 3000);
    }
  }, []);

  const dismiss = () => {
    sessionStorage.setItem("app-banner-dismissed", "1");
    setVisible(false);
  };

  if (!visible || dismissed) return null;

  return (
    <div style={{
      position: "fixed", bottom: 0, left: 0, right: 0, zIndex: 999,
      background: "#142950", color: "#fff",
      padding: "12px 16px",
      display: "flex", alignItems: "center", gap: 12,
      borderTop: "1px solid rgba(216,155,42,0.3)",
      boxShadow: "0 -4px 20px rgba(0,0,0,0.2)",
    }}>
      {/* CreditIQ icon */}
      <div style={{
        width: 40, height: 40, borderRadius: 10, flexShrink: 0,
        background: "linear-gradient(135deg, #D89B2A, #8C5F12)",
        display: "flex", alignItems: "center", justifyContent: "center",
        fontSize: 20,
      }}>💳</div>

      {/* Text */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 13, fontWeight: 700, lineHeight: 1.2 }}>
          Get CreditIQ on your phone
        </div>
        <div style={{ fontSize: 11, color: "rgba(255,255,255,0.65)", marginTop: 2 }}>
          CIRA in your pocket. Cards, rewards, travel — all there.
        </div>
      </div>

      {/* CTA */}
      <a
        href="https://play.google.com/store/apps/details?id=com.gogo84.cardiq"
        target="_blank"
        rel="noopener noreferrer"
        style={{
          background: "#D89B2A", color: "#fff",
          padding: "8px 14px", borderRadius: 20,
          fontSize: 12, fontWeight: 700, textDecoration: "none",
          whiteSpace: "nowrap", flexShrink: 0,
        }}
      >
        Download
      </a>

      {/* Dismiss */}
      <button onClick={dismiss} style={{
        background: "none", border: "none", color: "rgba(255,255,255,0.5)",
        cursor: "pointer", padding: 4, flexShrink: 0, fontSize: 18, lineHeight: 1,
      }}>×</button>
    </div>
  );
}
