"use client";

import GovEmblem from "@/components/GovEmblem";
import { useLanguage } from "@/lib/i18n/LanguageContext";

export default function ProtectedFooter() {
  const { language, t } = useLanguage();

  return (
    <footer
      style={{
        borderTop: "1px solid var(--clr-border)",
        background: "#ffffff",
        padding: "1.25rem 1.75rem",
        fontSize: "0.76rem",
        color: "var(--clr-text-secondary)",
        fontFamily: language === "hi" ? "var(--font-devanagari)" : "var(--font-sans)",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        flexWrap: "wrap",
        gap: "0.75rem",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: "0.6rem", flexWrap: "wrap" }}>
        <GovEmblem size={22} style={{ flexShrink: 0 }} />
        <span>{t.common.footerRule1}</span>
        <span>•</span>
        <span>{t.common.footerRule2}</span>
      </div>
      <div style={{ color: "var(--clr-text-muted)", fontFamily: "var(--font-sans)" }}>
        {t.common.footerTech}
      </div>
    </footer>
  );
}
