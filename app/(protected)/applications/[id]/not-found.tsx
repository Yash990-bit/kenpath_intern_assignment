import Link from "next/link";
import Icon from "@/components/Icon";

export default function ApplicationNotFound() {
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
      <div style={{ color: "var(--clr-text-muted)", display: "flex", justifyContent: "center" }}><Icon name="search" size={44} strokeWidth={1.6} /></div>
      <h2 style={{ fontSize: "1.4rem", fontWeight: 700, color: "var(--clr-navy)" }}>
        आवेदन नहीं मिला
      </h2>
      <p style={{ color: "var(--clr-text-secondary)", fontSize: "0.9rem", maxWidth: "480px" }}>
        यह आवेदन पोर्टल में उपलब्ध नहीं है अथवा हटा दिया गया है। कृपया आवेदन संख्या की पुष्टि करें।
      </p>

      <Link
        href="/dashboard"
        style={{
          marginTop: "0.5rem",
          background: "var(--clr-navy)",
          color: "white",
          borderRadius: "6px",
          padding: "0.6rem 1.25rem",
          fontSize: "0.9rem",
          fontWeight: 600,
          textDecoration: "none",
          display: "inline-flex",
          alignItems: "center",
          gap: "0.4rem",
        }}
      >
        ← डैशबोर्ड पर वापस जाएँ
      </Link>
    </div>
  );
}
