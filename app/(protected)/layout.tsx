import { auth, signOut } from "@/auth";
import { redirect } from "next/navigation";
import ProtectedHeader from "@/components/ProtectedHeader";
import ProtectedFooter from "@/components/ProtectedFooter";

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

  async function handleSignOut() {
    "use server";
    await signOut({ redirectTo: "/login" });
  }

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        minHeight: "100dvh",
        background: "var(--clr-surface)",
      }}
    >
      {/* Top 3-color Government of Haryana Ribbon */}
      <div className="gov-ribbon" />

      {/* State Executive Top Navigation Bar */}
      <ProtectedHeader officer={officer} signOutAction={handleSignOut} />

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
      <ProtectedFooter />
    </div>
  );
}
