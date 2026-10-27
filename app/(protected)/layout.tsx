import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { signOut } from "@/auth";

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

  return (
    <div style={{ display: "flex", flexDirection: "column", minHeight: "100dvh" }}>
      {/* Top navigation bar */}
      <header
        style={{
          background: "linear-gradient(90deg, #0f2e5e 0%, #1a3f7a 100%)",
          color: "white",
          padding: "0 1.5rem",
          height: "56px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          boxShadow: "0 2px 8px rgba(15,46,94,0.3)",
          position: "sticky",
          top: 0,
          zIndex: 100,
          fontFamily: "var(--font-devanagari)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
          <span style={{ fontSize: "1.5rem" }}>🏛️</span>
          <div>
            <div style={{ fontWeight: 700, fontSize: "1rem", lineHeight: 1.2 }}>
              वृद्धा पेंशन समीक्षा
            </div>
            <div style={{ fontSize: "0.7rem", opacity: 0.7 }}>
              हरियाणा सरकार — समाज कल्याण विभाग
            </div>
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
          <div style={{ textAlign: "right" }}>
            <div style={{ fontWeight: 600, fontSize: "0.88rem" }}>
              {officer.name}
            </div>
            <div style={{ fontSize: "0.72rem", opacity: 0.7 }}>
              {officer.designation ?? officer.email}
            </div>
          </div>
          <form
            action={async () => {
              "use server";
              await signOut({ redirectTo: "/login" });
            }}
          >
            <button
              type="submit"
              style={{
                background: "rgba(255,255,255,0.12)",
                border: "1px solid rgba(255,255,255,0.25)",
                borderRadius: "6px",
                color: "white",
                padding: "0.35rem 0.9rem",
                fontSize: "0.82rem",
                cursor: "pointer",
                fontFamily: "var(--font-devanagari)",
                transition: "background 0.2s",
              }}
            >
              लॉगआउट
            </button>
          </form>
        </div>
      </header>

      <main style={{ flex: 1, padding: "1.5rem", maxWidth: "1200px", margin: "0 auto", width: "100%" }}>
        {children}
      </main>
    </div>
  );
}
