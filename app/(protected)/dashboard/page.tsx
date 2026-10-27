import { prisma } from "@/lib/db";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { ApplicationStatus } from "@prisma/client";
import { SLA_BREACH_DAYS, SLA_BREACH_LABEL, isSlaBreached } from "@/lib/eligibility";
import { calculateUrgencyScore } from "@/lib/urgency";
import { calculateAge } from "@/lib/ai";

export const instant = false;

// ─── Helpers ─────────────────────────────────────────────────────────────────

function daysSince(date: Date): number {
  return Math.floor((Date.now() - date.getTime()) / 86_400_000);
}

// ─── Status badge helpers ─────────────────────────────────────────────────────

const STATUS_LABELS: Record<ApplicationStatus, string> = {
  PENDING: "लंबित",
  APPROVED: "स्वीकृत",
  REJECTED: "अस्वीकृत",
  RETURNED: "वापस",
};

const STATUS_COLORS: Record<ApplicationStatus, { bg: string; text: string; border: string }> = {
  PENDING: { bg: "#fff3e6", text: "#cc5500", border: "#ffcc99" },
  APPROVED: { bg: "#e8f5ee", text: "#1a6b3a", border: "#a8d5bb" },
  REJECTED: { bg: "#fdecea", text: "#a93226", border: "#f5c6c2" },
  RETURNED: { bg: "#fef3c7", text: "#92400e", border: "#fcd34d" },
};

// ─── Dashboard Page ───────────────────────────────────────────────────────────

export default async function DashboardPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  // Fetch all applications with audit log counts
  const applications = await prisma.application.findMany({
    include: { _count: { select: { auditLogs: true } } },
    orderBy: { submittedAt: "asc" },
  });

  // Sort by urgency score (descending)
  const sorted = [...applications].sort(
    (a, b) =>
      calculateUrgencyScore(b.submittedAt, b.priority, b.status) -
      calculateUrgencyScore(a.submittedAt, a.priority, a.status)
  );

  // Stats
  const total = applications.length;
  const pending = applications.filter((a) => a.status === "PENDING").length;
  const approved = applications.filter((a) => a.status === "APPROVED").length;
  const rejected = applications.filter((a) => a.status === "REJECTED").length;
  const slaBreached = applications.filter((a) =>
    isSlaBreached(a.submittedAt, a.status)
  ).length;
  const highPriority = applications.filter(
    (a) => a.status === "PENDING" && a.priority === "HIGH"
  ).length;

  return (
    <div style={{ fontFamily: "var(--font-devanagari)" }}>
      {/* Page heading */}
      <div style={{ marginBottom: "1.5rem" }}>
        <h1
          style={{
            fontSize: "1.6rem",
            fontWeight: 700,
            color: "var(--clr-navy)",
            marginBottom: "0.25rem",
          }}
        >
          आवेदन डैशबोर्ड
        </h1>
        <p style={{ color: "var(--clr-text-secondary)", fontSize: "0.88rem" }}>
          वृद्धा पेंशन आवेदनों की सूची — प्राथमिकता के अनुसार क्रमबद्ध
        </p>
      </div>

      {/* Stats strip */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))",
          gap: "1rem",
          marginBottom: "1.75rem",
        }}
      >
        <StatCard label="कुल आवेदन" value={total} icon="📋" color="#0f2e5e" />
        <StatCard label="लंबित" value={pending} icon="⏳" color="#cc5500" />
        <StatCard label="SLA उल्लंघन" value={slaBreached} icon="🚨" color="#a93226" />
        <StatCard label="उच्च प्राथमिकता" value={highPriority} icon="⚠️" color="#d97706" />
        <StatCard label="स्वीकृत" value={approved} icon="✅" color="#1a6b3a" />
        <StatCard label="अस्वीकृत" value={rejected} icon="❌" color="#a93226" />
      </div>

      {/* Legend */}
      <div
        style={{
          display: "flex",
          gap: "1.25rem",
          flexWrap: "wrap",
          marginBottom: "1rem",
          fontSize: "0.8rem",
          color: "var(--clr-text-secondary)",
          alignItems: "center",
        }}
      >
        <span style={{ fontWeight: 600 }}>क्रम-आधार:</span>
        <LegendItem color="#a93226" bg="#fdecea" label={`SLA उल्लंघन (${SLA_BREACH_LABEL})`} />
        <LegendItem color="#d97706" bg="#fef3c7" label="उच्च प्राथमिकता" />
        <LegendItem color="#4a5568" bg="#f7f8fc" label="प्रतीक्षित दिन (पुराना पहले)" />
      </div>

      {/* Application table */}
      <div
        style={{
          background: "white",
          borderRadius: "12px",
          border: "1px solid var(--clr-border)",
          overflowX: "auto",
          WebkitOverflowScrolling: "touch",
          boxShadow: "0 2px 16px rgba(15,46,94,0.06)",
        }}
      >
        <table style={{ width: "100%", minWidth: "800px", borderCollapse: "collapse", fontSize: "0.88rem" }}>
          <thead>
            <tr
              style={{
                background: "linear-gradient(90deg, #0f2e5e 0%, #1a3f7a 100%)",
                color: "white",
              }}
            >
              <Th>क्र.सं.</Th>
              <Th>आवेदक का नाम</Th>
              <Th>गाँव / तहसील</Th>
              <Th>आयु</Th>
              <Th>आवेदन तिथि</Th>
              <Th>प्रतीक्षा</Th>
              <Th>स्थिति</Th>
              <Th>प्राथमिकता</Th>
              <Th>कार्यवाही</Th>
            </tr>
          </thead>
          <tbody>
            {sorted.map((app, idx) => {
              const days = daysSince(app.submittedAt);
              const sla = isSlaBreached(app.submittedAt, app.status);
              const isHigh = app.priority === "HIGH" && app.status === "PENDING";

              const rowBg = sla
                ? "#fff8f5"
                : isHigh
                ? "#fffdf0"
                : "white";

              const age = calculateAge(app.dob);

              const statusColor = STATUS_COLORS[app.status];

              return (
                <tr
                  key={app.id}
                  style={{
                    background: rowBg,
                    borderBottom: "1px solid var(--clr-border)",
                    transition: "background 0.15s",
                  }}
                  onMouseEnter={(e) =>
                    ((e.currentTarget as HTMLTableRowElement).style.background =
                      sla ? "#ffe8d6" : isHigh ? "#fef9e0" : "#f0f4ff")
                  }
                  onMouseLeave={(e) =>
                    ((e.currentTarget as HTMLTableRowElement).style.background = rowBg)
                  }
                >
                  <td style={{ padding: "0.85rem 0.75rem", textAlign: "center", color: "var(--clr-text-secondary)", fontWeight: 500 }}>
                    {idx + 1}
                  </td>

                  <td style={{ padding: "0.85rem 0.75rem" }}>
                    <div style={{ fontWeight: 600, color: "var(--clr-navy)" }}>
                      {app.applicantName}
                    </div>
                    <div style={{ fontSize: "0.77rem", color: "var(--clr-text-secondary)" }}>
                      {app.fatherHusbandName}
                    </div>
                    {app.flagNote && (
                      <div
                        style={{
                          fontSize: "0.72rem",
                          color: "#a93226",
                          background: "#fdecea",
                          borderRadius: "4px",
                          padding: "0.15rem 0.5rem",
                          marginTop: "0.25rem",
                          display: "inline-block",
                        }}
                      >
                        ⚠ {app.flagNote}
                      </div>
                    )}
                  </td>

                  <td style={{ padding: "0.85rem 0.75rem" }}>
                    <div>{app.village}</div>
                    <div style={{ fontSize: "0.77rem", color: "var(--clr-text-secondary)" }}>
                      {app.tehsil}
                    </div>
                  </td>

                  <td style={{ padding: "0.85rem 0.75rem", textAlign: "center" }}>
                    <span
                      style={{
                        fontWeight: 600,
                        color: age < 60 ? "var(--clr-red)" : "var(--clr-green)",
                      }}
                    >
                      {age} वर्ष
                    </span>
                  </td>

                  <td style={{ padding: "0.85rem 0.75rem", whiteSpace: "nowrap", fontSize: "0.82rem" }}>
                    {app.submittedAt.toLocaleDateString("hi-IN", {
                      day: "2-digit",
                      month: "short",
                      year: "numeric",
                    })}
                  </td>

                  <td style={{ padding: "0.85rem 0.75rem", textAlign: "center" }}>
                    <span
                      style={{
                        fontWeight: 600,
                        color: sla ? "var(--clr-red)" : days > 14 ? "var(--clr-amber)" : "var(--clr-text)",
                      }}
                    >
                      {app.status === "PENDING" ? `${days} दिन` : "—"}
                    </span>
                    {sla && (
                      <div style={{ fontSize: "0.7rem", color: "var(--clr-red)" }}>
                        SLA उल्लंघन!
                      </div>
                    )}
                  </td>

                  <td style={{ padding: "0.85rem 0.75rem", textAlign: "center" }}>
                    <span
                      style={{
                        background: statusColor.bg,
                        color: statusColor.text,
                        border: `1px solid ${statusColor.border}`,
                        borderRadius: "999px",
                        padding: "0.25rem 0.75rem",
                        fontSize: "0.78rem",
                        fontWeight: 600,
                        whiteSpace: "nowrap",
                      }}
                    >
                      {STATUS_LABELS[app.status]}
                    </span>
                  </td>

                  <td style={{ padding: "0.85rem 0.75rem", textAlign: "center" }}>
                    {app.priority === "HIGH" && app.status === "PENDING" ? (
                      <span
                        style={{
                          background: "#fef3c7",
                          color: "#92400e",
                          border: "1px solid #fcd34d",
                          borderRadius: "999px",
                          padding: "0.25rem 0.75rem",
                          fontSize: "0.75rem",
                          fontWeight: 600,
                        }}
                      >
                        ⚠ उच्च
                      </span>
                    ) : (
                      <span style={{ color: "var(--clr-text-secondary)", fontSize: "0.78rem" }}>
                        सामान्य
                      </span>
                    )}
                  </td>

                  <td style={{ padding: "0.85rem 0.75rem", textAlign: "center" }}>
                    <Link
                      href={`/applications/${app.id}`}
                      style={{
                        display: "inline-block",
                        background: "linear-gradient(135deg, #0f2e5e, #1a3f7a)",
                        color: "white",
                        textDecoration: "none",
                        borderRadius: "6px",
                        padding: "0.4rem 0.85rem",
                        fontSize: "0.8rem",
                        fontWeight: 600,
                        transition: "opacity 0.15s, transform 0.15s",
                      }}
                    >
                      समीक्षा करें →
                    </Link>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>

        {sorted.length === 0 && (
          <div
            style={{
              padding: "3rem",
              textAlign: "center",
              color: "var(--clr-text-secondary)",
            }}
          >
            कोई आवेदन नहीं मिला।
          </div>
        )}
      </div>

      <p
        style={{
          marginTop: "1rem",
          fontSize: "0.75rem",
          color: "var(--clr-text-secondary)",
          textAlign: "right",
        }}
      >
        कुल {total} आवेदन • SLA सीमा: {SLA_BREACH_DAYS} दिन
      </p>
    </div>
  );
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function StatCard({
  label,
  value,
  icon,
  color,
}: {
  label: string;
  value: number;
  icon: string;
  color: string;
}) {
  return (
    <div
      style={{
        background: "white",
        border: "1px solid var(--clr-border)",
        borderRadius: "10px",
        padding: "1rem",
        display: "flex",
        flexDirection: "column",
        gap: "0.25rem",
        boxShadow: "0 1px 6px rgba(15,46,94,0.06)",
      }}
    >
      <div style={{ fontSize: "1.4rem" }}>{icon}</div>
      <div style={{ fontSize: "1.8rem", fontWeight: 700, color, lineHeight: 1 }}>
        {value}
      </div>
      <div style={{ fontSize: "0.78rem", color: "var(--clr-text-secondary)" }}>
        {label}
      </div>
    </div>
  );
}

function Th({ children }: { children: React.ReactNode }) {
  return (
    <th
      style={{
        padding: "0.85rem 0.75rem",
        textAlign: "left",
        fontWeight: 600,
        fontSize: "0.8rem",
        whiteSpace: "nowrap",
        letterSpacing: "0.02em",
      }}
    >
      {children}
    </th>
  );
}

function LegendItem({
  color,
  bg,
  label,
}: {
  color: string;
  bg: string;
  label: string;
}) {
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: "0.35rem",
      }}
    >
      <span
        style={{
          display: "inline-block",
          width: "12px",
          height: "12px",
          borderRadius: "3px",
          background: bg,
          border: `1.5px solid ${color}`,
        }}
      />
      {label}
    </span>
  );
}
