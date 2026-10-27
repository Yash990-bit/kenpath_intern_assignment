"use client";

import { useEffect } from "react";
import Link from "next/link";

export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Protected page error:", error);
  }, [error]);

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        minHeight: "50vh",
        gap: "1rem",
        textAlign: "center",
        fontFamily: "var(--font-devanagari)",
        padding: "2rem",
      }}
    >
      <div style={{ fontSize: "3rem" }}>⚠️</div>
      <h2 style={{ fontSize: "1.4rem", fontWeight: 700, color: "var(--clr-red)" }}>
        डेटा लोड करने में समस्या आई
      </h2>
      <p style={{ color: "var(--clr-text-secondary)", fontSize: "0.9rem", maxWidth: "480px" }}>
        सर्वर से संपर्क करने में अस्थायी बाधा उत्पन्न हुई है। कृपया पुनः प्रयास करें अथवा डैशबोर्ड पर जाएँ।
      </p>

      <div style={{ display: "flex", gap: "1rem", marginTop: "0.5rem" }}>
        <button
          onClick={() => reset()}
          style={{
            background: "var(--clr-navy)",
            color: "white",
            border: "none",
            borderRadius: "6px",
            padding: "0.6rem 1.25rem",
            fontSize: "0.9rem",
            fontWeight: 600,
            cursor: "pointer",
            fontFamily: "var(--font-devanagari)",
          }}
        >
          🔄 पुनः प्रयास करें
        </button>

        <Link
          href="/dashboard"
          style={{
            background: "white",
            color: "var(--clr-navy)",
            border: "1px solid var(--clr-border)",
            borderRadius: "6px",
            padding: "0.6rem 1.25rem",
            fontSize: "0.9rem",
            fontWeight: 600,
            textDecoration: "none",
            display: "inline-flex",
            alignItems: "center",
          }}
        >
          डैशबोर्ड पर जाएँ
        </Link>
      </div>
    </div>
  );
}
