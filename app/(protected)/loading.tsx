export default function Loading() {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        minHeight: "50vh",
        gap: "1rem",
        fontFamily: "var(--font-devanagari)",
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
        डेटा लोड हो रहा है, कृपया प्रतीक्षा करें...
      </div>
      <div style={{ fontSize: "0.82rem", color: "var(--clr-text-secondary)" }}>
        हरियाणा वृद्धावस्था सम्मान भत्ता समीक्षा पोर्टल
      </div>
    </div>
  );
}
