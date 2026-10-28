"use client";

import { useLanguage } from "@/lib/i18n/LanguageContext";

export default function Loading() {
  const { language } = useLanguage();
  const isEn = language === "en";

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        minHeight: "50vh",
        gap: "1rem",
        fontFamily: isEn ? "var(--font-sans)" : "var(--font-devanagari)",
        color: "var(--clr-navy)",
      }}
    >
      <div
        style={{
          width: "48px",
          height: "48px",
          border: "4px solid var(--clr-navy-light)",
          borderTopColor: "var(--clr-navy)",
          borderRadius: "50%",
          animation: "spin 0.8s linear infinite",
        }}
      />
      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
      <div style={{ fontSize: "1.1rem", fontWeight: 600 }}>
        {isEn ? "Loading records, please wait..." : "डेटा लोड हो रहा है, कृपया प्रतीक्षा करें..."}
      </div>
      <div style={{ fontSize: "0.82rem", color: "var(--clr-text-secondary)" }}>
        {isEn ? "Haryana Old Age Pension Review Portal" : "हरियाणा वृद्धावस्था सम्मान भत्ता समीक्षा पोर्टल"}
      </div>
    </div>
  );
}
