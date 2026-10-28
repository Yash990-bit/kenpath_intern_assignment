"use client";

import Link from "next/link";
import GovEmblem from "@/components/GovEmblem";
import { useLanguage, LanguageSwitcher } from "@/lib/i18n/LanguageContext";
import Icon from "@/components/Icon";

export default function ProtectedHeader({
  officer,
  signOutAction,
}: {
  officer: {
    name?: string | null;
    email?: string | null;
    designation?: string;
  };
  signOutAction: () => Promise<void>;
}) {
  const { language, t } = useLanguage();

  const officerName = officer.name || (language === "hi" ? "अधिकारी" : "Officer");
  const designation =
    officer.designation === "तहसीलदार" || !officer.designation
      ? t.common.tehsildar
      : officer.designation;

  const initials = officer.name
    ? officer.name
        .split(" ")
        .map((n) => n[0])
        .slice(0, 2)
        .join("")
    : language === "hi"
    ? "अध"
    : "OF";

  return (
    <header
      className="ph-header"
      style={{
        background: "linear-gradient(90deg, #07152b 0%, #0b1f3a 60%, #132e57 100%)",
        color: "white",
        padding: "0 1.75rem",
        minHeight: "64px",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        boxShadow: "0 4px 20px rgba(7, 21, 43, 0.35)",
        position: "sticky",
        top: 0,
        zIndex: 100,
        fontFamily: language === "hi" ? "var(--font-devanagari)" : "var(--font-sans)",
        borderBottom: "1px solid rgba(255, 255, 255, 0.1)",
        flexWrap: "wrap",
        gap: "0.75rem",
      }}
    >
      {/* Left: Emblem & Portal Name */}
      <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
        <Link
          href="/dashboard"
          style={{
            display: "flex",
            alignItems: "center",
            gap: "0.85rem",
            textDecoration: "none",
            color: "inherit",
          }}
        >
          <GovEmblem size={44} style={{ flexShrink: 0 }} />
          <div>
            <div
              style={{
                fontWeight: 700,
                fontSize: "1.05rem",
                letterSpacing: "-0.01em",
                color: "#ffffff",
                lineHeight: 1.2,
              }}
            >
              {t.common.appName}
            </div>
            <div
              className="ph-subtitle"
              style={{
                fontSize: "0.72rem",
                color: "#cbd5e1",
                display: "flex",
                alignItems: "center",
                gap: "0.5rem",
                flexWrap: "wrap",
              }}
            >
              <span>{t.common.deptName}</span>
              <span style={{ opacity: 0.5 }}>|</span>
              <span
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "0.3rem",
                  color: "#a7f3d0",
                  fontWeight: 500,
                }}
              >
                <span
                  className="live-dot pulse-dot"
                  style={{
                    width: "6px",
                    height: "6px",
                    borderRadius: "50%",
                    background: "#10b981",
                    display: "inline-block",
                  }}
                />
                {t.common.activeSession}
              </span>
            </div>
          </div>
        </Link>
      </div>

      {/* Right: Language Switcher, Dashboard Nav, Officer Profile & Logout */}
      <div className="ph-actions" style={{ display: "flex", alignItems: "center", gap: "1rem", flexWrap: "wrap" }}>
        {/* Bilingual Switcher: हिंदी | English */}
        <LanguageSwitcher variant="header" />

        {/* Quick Nav to Dashboard */}
        <Link
          href="/dashboard"
          aria-label={t.common.dashboard}
          style={{
            color: "#cbd5e1",
            textDecoration: "none",
            fontSize: "0.82rem",
            fontWeight: 600,
            padding: "0.35rem 0.75rem",
            borderRadius: "6px",
            background: "rgba(255, 255, 255, 0.06)",
            border: "1px solid rgba(255, 255, 255, 0.12)",
            transition: "background 0.15s ease",
            display: "inline-flex",
            alignItems: "center",
            gap: "0.3rem",
          }}
        >
          <Icon name="dashboard" size={15} />
          <span className="ph-label">{t.common.dashboard}</span>
        </Link>

        {/* Reports & AI Accountability */}
        <Link
          href="/reports"
          aria-label={t.reports.navLabel}
          style={{
            color: "#cbd5e1",
            textDecoration: "none",
            fontSize: "0.82rem",
            fontWeight: 600,
            padding: "0.35rem 0.75rem",
            borderRadius: "6px",
            background: "rgba(255, 255, 255, 0.06)",
            border: "1px solid rgba(255, 255, 255, 0.12)",
            display: "inline-flex",
            alignItems: "center",
            gap: "0.3rem",
          }}
        >
          <Icon name="barChart" size={15} />
          <span className="ph-label">{t.reports.navLabel}</span>
        </Link>

        {/* Register New Application */}
        <Link
          href="/applications/new"
          aria-label={t.intake.navLabel}
          style={{
            color: "#ffffff",
            textDecoration: "none",
            fontSize: "0.82rem",
            fontWeight: 700,
            padding: "0.35rem 0.85rem",
            borderRadius: "6px",
            background: "linear-gradient(135deg, #f59e0b 0%, #d97706 100%)",
            boxShadow: "0 2px 8px rgba(245, 158, 11, 0.35)",
            display: "inline-flex",
            alignItems: "center",
            gap: "0.3rem",
          }}
        >
          <Icon name="plus" size={15} strokeWidth={2.4} />
          <span className="ph-label">{t.intake.navLabel}</span>
        </Link>

        {/* Officer Identity Card */}
        <div
          className="ph-officer"
          style={{
            display: "flex",
            alignItems: "center",
            gap: "0.75rem",
            background: "rgba(255, 255, 255, 0.07)",
            border: "1px solid rgba(255, 255, 255, 0.15)",
            borderRadius: "999px",
            padding: "0.25rem 0.85rem 0.25rem 0.35rem",
          }}
        >
          <div
            style={{
              width: "32px",
              height: "32px",
              borderRadius: "50%",
              background: "linear-gradient(135deg, #f59e0b 0%, #d97706 100%)",
              color: "#ffffff",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontWeight: 700,
              fontSize: "0.82rem",
              boxShadow: "0 2px 6px rgba(0,0,0,0.2)",
            }}
          >
            {initials}
          </div>
          <div className="ph-label" style={{ textAlign: "left", lineHeight: 1.15 }}>
            <div style={{ fontWeight: 600, fontSize: "0.84rem", color: "#ffffff" }}>
              {officerName}
            </div>
            <div style={{ fontSize: "0.7rem", color: "#fbd38d", fontWeight: 500 }}>
              {designation}
            </div>
          </div>
        </div>

        {/* Logout Button */}
        <form action={signOutAction}>
          <button
            type="submit"
            title={t.common.logoutConfirm}
            aria-label={t.common.logout}
            style={{
              background: "rgba(239, 68, 68, 0.15)",
              border: "1px solid rgba(239, 68, 68, 0.35)",
              borderRadius: "8px",
              color: "#fca5a5",
              padding: "0.4rem 0.85rem",
              fontSize: "0.8rem",
              fontWeight: 600,
              cursor: "pointer",
              fontFamily: "inherit",
              transition: "all 0.18s ease",
              display: "flex",
              alignItems: "center",
              gap: "0.4rem",
            }}
          >
            <span className="ph-label">{t.common.logout}</span>
            <Icon name="logOut" size={15} />
          </button>
        </form>
      </div>
    </header>
  );
}
