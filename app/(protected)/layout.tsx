import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { signOut } from "@/auth";
import Link from "next/link";

export const instant = false;

export default async function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const officer = session.user as {
    name?: string | null;
    email?: string | null;
    designation?: string;
  };

  // Get officer initials for avatar
  const initials = officer.name
    ? officer.name.split(" ").map((n) => n[0]).slice(0, 2).join("")
    : "अध";

  return (
    <div style={{ display: "flex", flexDirection: "column", minHeight: "100dvh", background: "var(--clr-surface)" }}>
      {/* Top 3-color Government of Haryana Ribbon */}
      <div className="gov-ribbon" />

      {/* State Executive Top Navigation Bar */}
      <header
        style={{
          background: "linear-gradient(90deg, #07152b 0%, #0b1f3a 60%, #132e57 100%)",
          color: "white",
          padding: "0 1.75rem",
          height: "64px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          boxShadow: "0 4px 20px rgba(7, 21, 43, 0.35)",
          position: "sticky",
          top: 0,
          zIndex: 100,
          fontFamily: "var(--font-devanagari)",
          borderBottom: "1px solid rgba(255, 255, 255, 0.1)",
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
            <div
              style={{
                width: "40px",
                height: "40px",
                borderRadius: "10px",
                background: "linear-gradient(135deg, rgba(251, 211, 141, 0.2) 0%, rgba(255, 255, 255, 0.05) 100%)",
                border: "1px solid rgba(251, 211, 141, 0.3)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "1.3rem",
                boxShadow: "0 2px 10px rgba(0,0,0,0.2)",
              }}
            >
              🏛️
            </div>
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
                वृद्धा पेंशन समीक्षा पोर्टल
              </div>
              <div
                style={{
                  fontSize: "0.72rem",
                  color: "#cbd5e1",
                  display: "flex",
                  alignItems: "center",
                  gap: "0.5rem",
                }}
              >
                <span>हरियाणा सरकार • समाज कल्याण विभाग</span>
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
                  <span className="live-dot pulse-dot" style={{ width: "6px", height: "6px", borderRadius: "50%", background: "#10b981", display: "inline-block" }}></span>
                  सक्रिय सत्र
                </span>
              </div>
            </div>
          </Link>
        </div>

        {/* Right: Officer Profile & Logout */}
        <div style={{ display: "flex", alignItems: "center", gap: "1.25rem" }}>
          {/* Quick Nav to Dashboard */}
          <Link
            href="/dashboard"
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
            }}
          >
            📊 डैशबोर्ड
          </Link>

          {/* Officer Identity Card */}
          <div
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
            <div style={{ textAlign: "left", lineHeight: 1.15 }}>
              <div style={{ fontWeight: 600, fontSize: "0.84rem", color: "#ffffff" }}>
                {officer.name}
              </div>
              <div style={{ fontSize: "0.7rem", color: "#fbd38d", fontWeight: 500 }}>
                {officer.designation ?? "तहसीलदार"}
              </div>
            </div>
          </div>

          {/* Logout Button */}
          <form
            action={async () => {
              "use server";
              await signOut({ redirectTo: "/login" });
            }}
          >
            <button
              type="submit"
              title="सुरक्षित लॉगआउट करें"
              style={{
                background: "rgba(239, 68, 68, 0.15)",
                border: "1px solid rgba(239, 68, 68, 0.35)",
                borderRadius: "8px",
                color: "#fca5a5",
                padding: "0.4rem 0.85rem",
                fontSize: "0.8rem",
                fontWeight: 600,
                cursor: "pointer",
                fontFamily: "var(--font-devanagari)",
                transition: "all 0.18s ease",
                display: "flex",
                alignItems: "center",
                gap: "0.4rem",
              }}
            >
              <span>लॉगआउट</span>
              <span style={{ fontSize: "0.9rem" }}>🚪</span>
            </button>
          </form>
        </div>
      </header>

      {/* Main Content Viewport */}
      <main
        style={{
          flex: 1,
          padding: "2rem 1.5rem 3.5rem",
          maxWidth: "1320px",
          margin: "0 auto",
          width: "100%",
        }}
      >
        {children}
      </main>

      {/* Official State Portal Footer */}
      <footer
        style={{
          borderTop: "1px solid var(--clr-border)",
          background: "#ffffff",
          padding: "1.25rem 1.75rem",
          fontSize: "0.76rem",
          color: "var(--clr-text-secondary)",
          fontFamily: "var(--font-devanagari)",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: "0.75rem",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
          <span>🏛️ हरियाणा वृद्धावस्था सम्मान भत्ता नियम, 1991</span>
          <span>•</span>
          <span>हरियाणा सेवा का अधिकार अधिनियम, 2014</span>
        </div>
        <div style={{ color: "var(--clr-text-muted)", fontFamily: "var(--font-sans)" }}>
          NIC & State Data Centre, Haryana • Secured with Prisma & Neon DB
        </div>
      </footer>
    </div>
  );
}
