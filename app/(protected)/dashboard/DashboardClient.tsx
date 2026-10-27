"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { Application, ApplicationStatus } from "@prisma/client";
import { SLA_BREACH_DAYS, isSlaBreached } from "@/lib/eligibility";
import { calculateUrgencyScore } from "@/lib/urgency";
import { calculateAge } from "@/lib/ai";

export interface DashboardAppItem extends Application {
  _count: {
    auditLogs: number;
  };
}

const STATUS_LABELS: Record<ApplicationStatus, string> = {
  PENDING: "लंबित",
  APPROVED: "स्वीकृत",
  REJECTED: "अस्वीकृत",
  RETURNED: "वापस",
};

const STATUS_PILL_STYLES: Record<
  ApplicationStatus,
  { bg: string; text: string; border: string; dot: string }
> = {
  PENDING: {
    bg: "#fff7ed",
    text: "#c2410c",
    border: "#fed7aa",
    dot: "#f97316",
  },
  APPROVED: {
    bg: "#ecfdf5",
    text: "#047857",
    border: "#a7f3d0",
    dot: "#10b981",
  },
  REJECTED: {
    bg: "#fef2f2",
    text: "#b91c1c",
    border: "#fecaca",
    dot: "#ef4444",
  },
  RETURNED: {
    bg: "#fffbeb",
    text: "#b45309",
    border: "#fde68a",
    dot: "#f59e0b",
  },
};

function daysSince(date: Date): number {
  return Math.floor((Date.now() - new Date(date).getTime()) / 86_400_000);
}

export default function DashboardClient({
  applications,
  officerName,
  officerDesignation,
}: {
  applications: DashboardAppItem[];
  officerName: string;
  officerDesignation: string;
}) {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [viewMode, setViewMode] = useState<"table" | "grid">("table");
  const [sortBy, setSortBy] = useState<"urgency" | "waiting" | "age" | "date">("urgency");

  // Summary counts
  const total = applications.length;
  const pending = applications.filter((a) => a.status === "PENDING").length;
  const approved = applications.filter((a) => a.status === "APPROVED").length;
  const rejected = applications.filter((a) => a.status === "REJECTED").length;
  const returned = applications.filter((a) => a.status === "RETURNED").length;
  const slaBreached = applications.filter((a) =>
    isSlaBreached(new Date(a.submittedAt), a.status)
  ).length;
  const highPriority = applications.filter(
    (a) => a.status === "PENDING" && a.priority === "HIGH"
  ).length;

  // Filter and sort applications
  const filteredApps = useMemo(() => {
    return applications
      .filter((app) => {
        // Status & Priority tabs
        if (statusFilter === "SLA_BREACH") {
          if (!isSlaBreached(new Date(app.submittedAt), app.status)) return false;
        } else if (statusFilter === "HIGH_PRIORITY") {
          if (app.priority !== "HIGH" || app.status !== "PENDING") return false;
        } else if (statusFilter !== "ALL") {
          if (app.status !== statusFilter) return false;
        }

        // Search filter
        if (searchTerm.trim()) {
          const q = searchTerm.toLowerCase().trim();
          const matchesName = app.applicantName.toLowerCase().includes(q);
          const matchesFather = app.fatherHusbandName.toLowerCase().includes(q);
          const matchesVillage = app.village.toLowerCase().includes(q);
          const matchesTehsil = app.tehsil.toLowerCase().includes(q);
          const matchesAadhaar = app.aadhaarMasked.includes(q);
          const matchesId = app.id.toLowerCase().includes(q);
          return matchesName || matchesFather || matchesVillage || matchesTehsil || matchesAadhaar || matchesId;
        }

        return true;
      })
      .sort((a, b) => {
        if (sortBy === "urgency") {
          return (
            calculateUrgencyScore(new Date(b.submittedAt), b.priority, b.status) -
            calculateUrgencyScore(new Date(a.submittedAt), a.priority, a.status)
          );
        }
        if (sortBy === "waiting") {
          return new Date(a.submittedAt).getTime() - new Date(b.submittedAt).getTime();
        }
        if (sortBy === "age") {
          return (
            calculateAge(new Date(b.dob)) - calculateAge(new Date(a.dob))
          );
        }
        if (sortBy === "date") {
          return new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime();
        }
        return 0;
      });
  }, [applications, statusFilter, searchTerm, sortBy]);

  return (
    <div style={{ fontFamily: "var(--font-devanagari)" }}>
      {/* ─── Hero Briefing Banner ─────────────────────────────────────────── */}
      <div className="hero-banner">
        <div className="hero-left">
          <div className="hero-salutation">
            <span className="hero-badge">हरियाणा समाज कल्याण पोर्टल</span>
            <span className="hero-date">
              {new Date().toLocaleDateString("hi-IN", {
                weekday: "long",
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </span>
          </div>
          <h1 className="hero-title">
            सुप्रभात, <span className="officer-highlight">{officerName} जी</span>
            <span style={{ fontSize: "1rem", fontWeight: 500, color: "#cbd5e1", marginLeft: "0.6rem" }}>
              ({officerDesignation})
            </span>
          </h1>
          <p className="hero-subtitle">
            आपके अधिकार क्षेत्र में कुल <strong>{total} आवेदन</strong> दर्ज हैं। इनमें से{" "}
            <strong className="text-amber">{pending} लंबित</strong> हैं और{" "}
            <strong className="text-red">{slaBreached} आवेदनों में SLA समय-सीमा पार</strong> हो चुकी है।
          </p>
        </div>

        {slaBreached > 0 && (
          <div className="hero-sla-alert">
            <div className="sla-alert-icon">🚨</div>
            <div>
              <div className="sla-alert-title">SLA अतिदेय चेतावनी (RTSA 2014)</div>
              <div className="sla-alert-desc">
                {slaBreached} आवेदन 30 दिन से अधिक समय से लंबित हैं। कृपया प्राथमिकता पर समीक्षा करें।
              </div>
            </div>
            <button
              onClick={() => setStatusFilter("SLA_BREACH")}
              className="btn-filter-sla"
            >
              देखें ({slaBreached}) →
            </button>
          </div>
        )}
      </div>

      {/* ─── Stats KPI Grid ───────────────────────────────────────────────── */}
      <div className="kpi-grid">
        <KpiCard
          label="कुल आवेदन"
          value={total}
          icon="📋"
          color="#0b1f3a"
          bg="linear-gradient(135deg, #f8fafc 0%, #edf2f7 100%)"
          border="#cbd5e1"
          active={statusFilter === "ALL"}
          onClick={() => setStatusFilter("ALL")}
        />
        <KpiCard
          label="लंबित समीक्षा"
          value={pending}
          icon="⏳"
          color="#c2410c"
          bg="linear-gradient(135deg, #fff7ed 0%, #ffedd5 100%)"
          border="#fed7aa"
          active={statusFilter === "PENDING"}
          onClick={() => setStatusFilter("PENDING")}
        />
        <KpiCard
          label="SLA उल्लंघन (>30 दिन)"
          value={slaBreached}
          icon="🚨"
          color="#b91c1c"
          bg="linear-gradient(135deg, #fef2f2 0%, #fee2e2 100%)"
          border="#fecaca"
          active={statusFilter === "SLA_BREACH"}
          onClick={() => setStatusFilter("SLA_BREACH")}
          glowRed={slaBreached > 0}
        />
        <KpiCard
          label="उच्च प्राथमिकता"
          value={highPriority}
          icon="⚠️"
          color="#b45309"
          bg="linear-gradient(135deg, #fffbeb 0%, #fef3c7 100%)"
          border="#fde68a"
          active={statusFilter === "HIGH_PRIORITY"}
          onClick={() => setStatusFilter("HIGH_PRIORITY")}
        />
        <KpiCard
          label="स्वीकृत आवेदन"
          value={approved}
          icon="✅"
          color="#047857"
          bg="linear-gradient(135deg, #ecfdf5 0%, #d1fae5 100%)"
          border="#a7f3d0"
          active={statusFilter === "APPROVED"}
          onClick={() => setStatusFilter("APPROVED")}
        />
        <KpiCard
          label="अस्वीकृत / वापस"
          value={rejected + returned}
          icon="❌"
          color="#7f1d1d"
          bg="linear-gradient(135deg, #fdf2f8 0%, #fae8ff 100%)"
          border="#f5d0fe"
          active={statusFilter === "REJECTED"}
          onClick={() => setStatusFilter("REJECTED")}
        />
      </div>

      {/* ─── Search & Filter Control Bar ──────────────────────────────────── */}
      <div className="controls-panel">
        <div className="search-box-wrapper">
          <span className="search-icon">🔍</span>
          <input
            type="text"
            placeholder="आवेदक का नाम, पिता/पति, गाँव, तहसील या आधार संख्या से खोजें…"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm("")}
              className="search-clear-btn"
              title="खोज साफ़ करें"
            >
              ✕
            </button>
          )}
        </div>

        {/* Filter Pills */}
        <div className="filter-chips-scroll">
          <button
            className={`filter-chip ${statusFilter === "ALL" ? "chip-active" : ""}`}
            onClick={() => setStatusFilter("ALL")}
          >
            सभी ({total})
          </button>
          <button
            className={`filter-chip chip-sla ${statusFilter === "SLA_BREACH" ? "chip-active-sla" : ""}`}
            onClick={() => setStatusFilter("SLA_BREACH")}
          >
            <span className="sla-dot pulse-dot"></span>
            SLA उल्लंघन ({slaBreached})
          </button>
          <button
            className={`filter-chip ${statusFilter === "HIGH_PRIORITY" ? "chip-active" : ""}`}
            onClick={() => setStatusFilter("HIGH_PRIORITY")}
          >
            उच्च प्राथमिकता ({highPriority})
          </button>
          <button
            className={`filter-chip ${statusFilter === "PENDING" ? "chip-active" : ""}`}
            onClick={() => setStatusFilter("PENDING")}
          >
            लंबित ({pending})
          </button>
          <button
            className={`filter-chip ${statusFilter === "APPROVED" ? "chip-active" : ""}`}
            onClick={() => setStatusFilter("APPROVED")}
          >
            स्वीकृत ({approved})
          </button>
          <button
            className={`filter-chip ${statusFilter === "REJECTED" ? "chip-active" : ""}`}
            onClick={() => setStatusFilter("REJECTED")}
          >
            अस्वीकृत ({rejected})
          </button>
        </div>

        {/* Sort & View Mode Toolbar */}
        <div className="toolbar-right">
          <div className="sort-selector">
            <span className="sort-label">क्रम:</span>
            <select
              value={sortBy}
              onChange={(e) =>
                setSortBy(
                  e.target.value as "urgency" | "waiting" | "age" | "date"
                )
              }
              className="sort-dropdown"
            >
              <option value="urgency">⚡ तात्कालिकता स्कोर (प्राथमिकता)</option>
              <option value="waiting">⏱️ प्रतीक्षित दिन (पुराना पहले)</option>
              <option value="age">🎂 आवेदक आयु (वरिष्ठ पहले)</option>
              <option value="date">📅 आवेदन तिथि (नवीनतम)</option>
            </select>
          </div>

          <div className="view-toggle">
            <button
              className={`view-btn ${viewMode === "table" ? "view-btn-active" : ""}`}
              onClick={() => setViewMode("table")}
              title="तालिका दृश्य"
            >
              📑 तालिका
            </button>
            <button
              className={`view-btn ${viewMode === "grid" ? "view-btn-active" : ""}`}
              onClick={() => setViewMode("grid")}
              title="कार्ड दृश्य"
            >
              🗂️ कार्ड
            </button>
          </div>
        </div>
      </div>

      {/* ─── Result Counter & Filter Summary ──────────────────────────────── */}
      <div className="results-meta-bar">
        <span>
          प्रदर्शित: <strong>{filteredApps.length}</strong> / कुल {total} आवेदन
        </span>
        {searchTerm && (
          <span className="active-filter-tag">
            खोज: &quot;{searchTerm}&quot;
            <button onClick={() => setSearchTerm("")} className="tag-remove">×</button>
          </span>
        )}
      </div>

      {/* ─── Application View (Table or Grid) ─────────────────────────────── */}
      {viewMode === "table" ? (
        <div className="table-container executive-card">
          <table className="modern-table">
            <thead>
              <tr className="table-head-row">
                <th style={{ width: "45px", textAlign: "center" }}>#</th>
                <th>आवेदक विवरण</th>
                <th>गाँव / तहसील</th>
                <th style={{ textAlign: "center" }}>आयु (पात्रता)</th>
                <th>वार्षिक आय</th>
                <th style={{ textAlign: "center" }}>प्रतीक्षा काल / SLA</th>
                <th style={{ textAlign: "center" }}>स्थिति</th>
                <th style={{ textAlign: "center" }}>प्राथमिकता</th>
                <th style={{ textAlign: "center", width: "130px" }}>कार्यवाही</th>
              </tr>
            </thead>
            <tbody>
              {filteredApps.map((app, idx) => {
                const days = daysSince(app.submittedAt);
                const sla = isSlaBreached(new Date(app.submittedAt), app.status);
                const isHigh = app.priority === "HIGH" && app.status === "PENDING";
                const age = calculateAge(new Date(app.dob));
                const statusStyle = STATUS_PILL_STYLES[app.status];

                // Progress percentage of SLA (30 days)
                const slaPercent = Math.min(Math.round((days / SLA_BREACH_DAYS) * 100), 100);

                return (
                  <tr
                    key={app.id}
                    className={`table-row-hover ${sla ? "row-sla-breached" : isHigh ? "row-high-priority" : ""}`}
                  >
                    <td className="cell-index">{idx + 1}</td>

                    {/* Applicant Name & Masked Info */}
                    <td className="cell-applicant">
                      <div className="applicant-flex">
                        <div className="applicant-avatar">
                          {app.applicantName[0]}
                        </div>
                        <div>
                          <div className="applicant-name">{app.applicantName}</div>
                          <div className="applicant-relation">
                            पिता/पति: {app.fatherHusbandName}
                          </div>
                          <div className="applicant-id-tag">
                            आधार: {app.aadhaarMasked}
                          </div>
                          {app.flagNote && (
                            <div className="applicant-flag-note">
                              ⚠️ {app.flagNote}
                            </div>
                          )}
                        </div>
                      </div>
                    </td>

                    {/* Village / Tehsil */}
                    <td className="cell-location">
                      <div className="location-village">{app.village}</div>
                      <div className="location-tehsil">{app.tehsil}, {app.district}</div>
                    </td>

                    {/* Age with Qualification Tag */}
                    <td className="cell-age" style={{ textAlign: "center" }}>
                      <div className={`age-badge ${age >= 60 ? "age-eligible" : "age-ineligible"}`}>
                        {age} वर्ष
                      </div>
                      <div className="age-subtext">
                        {age >= 60 ? "✓ 60+ पात्र" : "✕ अपात्र"}
                      </div>
                    </td>

                    {/* Annual Income */}
                    <td className="cell-income">
                      <div className="income-amount">
                        ₹{app.annualIncome.toLocaleString("hi-IN")}
                      </div>
                      <div className="income-ceiling">
                        {app.annualIncome <= 200000 ? "✓ ₹2L सीमा के अंदर" : "⚠️ सीमा से अधिक"}
                      </div>
                    </td>

                    {/* Waiting Days & SLA Bar */}
                    <td className="cell-sla" style={{ textAlign: "center" }}>
                      <div className="sla-days-wrap">
                        <span className={`sla-days ${sla ? "sla-text-red" : days > 15 ? "sla-text-amber" : "sla-text-normal"}`}>
                          {app.status === "PENDING" ? `${days} दिन` : "निस्तारित"}
                        </span>
                        {sla && <span className="sla-badge-pill">SLA अतिदेय</span>}
                      </div>

                      {app.status === "PENDING" && (
                        <div className="sla-progress-track">
                          <div
                            className={`sla-progress-fill ${sla ? "fill-red" : days > 15 ? "fill-amber" : "fill-blue"}`}
                            style={{ width: `${slaPercent}%` }}
                          />
                        </div>
                      )}
                    </td>

                    {/* Status Pill */}
                    <td style={{ textAlign: "center" }}>
                      <span
                        className="status-pill-badge"
                        style={{
                          background: statusStyle.bg,
                          color: statusStyle.text,
                          border: `1px solid ${statusStyle.border}`,
                        }}
                      >
                        <span
                          className="status-dot"
                          style={{ background: statusStyle.dot }}
                        />
                        {STATUS_LABELS[app.status]}
                      </span>
                    </td>

                    {/* Priority */}
                    <td style={{ textAlign: "center" }}>
                      {app.priority === "HIGH" && app.status === "PENDING" ? (
                        <span className="priority-high-badge">
                          ⚠️ उच्च
                        </span>
                      ) : (
                        <span className="priority-normal-badge">
                          सामान्य
                        </span>
                      )}
                    </td>

                    {/* Action Link */}
                    <td style={{ textAlign: "center" }}>
                      <Link
                        href={`/applications/${app.id}`}
                        className="btn-action-review"
                      >
                        समीक्षा करें →
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : (
        /* ─── Grid Cards View ─────────────────────────────────────────────── */
        <div className="cards-grid">
          {filteredApps.map((app, idx) => {
            const days = daysSince(app.submittedAt);
            const sla = isSlaBreached(new Date(app.submittedAt), app.status);
            const isHigh = app.priority === "HIGH" && app.status === "PENDING";
            const age = calculateAge(new Date(app.dob));
            const statusStyle = STATUS_PILL_STYLES[app.status];

            return (
              <div
                key={app.id}
                className={`app-card executive-card ${sla ? "card-sla-breached" : ""}`}
              >
                <div className="card-top-row">
                  <span className="card-index-pill">#{idx + 1}</span>
                  <div className="card-badges-flex">
                    {sla && <span className="sla-badge-pill">SLA अतिदेय</span>}
                    {isHigh && <span className="priority-high-badge">⚠️ उच्च प्राथमिकता</span>}
                    <span
                      className="status-pill-badge"
                      style={{
                        background: statusStyle.bg,
                        color: statusStyle.text,
                        border: `1px solid ${statusStyle.border}`,
                      }}
                    >
                      <span className="status-dot" style={{ background: statusStyle.dot }} />
                      {STATUS_LABELS[app.status]}
                    </span>
                  </div>
                </div>

                <div className="card-applicant-row">
                  <div className="applicant-avatar-lg">
                    {app.applicantName[0]}
                  </div>
                  <div>
                    <h3 className="card-applicant-name">{app.applicantName}</h3>
                    <p className="card-applicant-sub">पिता/पति: {app.fatherHusbandName}</p>
                    <p className="card-applicant-sub">आधार: {app.aadhaarMasked}</p>
                  </div>
                </div>

                <div className="card-meta-grid">
                  <div className="meta-box">
                    <span className="meta-label">आयु (पात्रता)</span>
                    <span className={`meta-val ${age >= 60 ? "age-eligible-text" : "age-ineligible-text"}`}>
                      {age} वर्ष {age >= 60 ? "✓" : "✕"}
                    </span>
                  </div>
                  <div className="meta-box">
                    <span className="meta-label">वार्षिक आय</span>
                    <span className="meta-val">₹{app.annualIncome.toLocaleString("hi-IN")}</span>
                  </div>
                  <div className="meta-box">
                    <span className="meta-label">स्थान</span>
                    <span className="meta-val">{app.village}, {app.tehsil}</span>
                  </div>
                  <div className="meta-box">
                    <span className="meta-label">प्रतीक्षा अवधि</span>
                    <span className={`meta-val ${sla ? "text-red" : ""}`}>
                      {app.status === "PENDING" ? `${days} दिन` : "निस्तारित"}
                    </span>
                  </div>
                </div>

                {app.flagNote && (
                  <div className="card-flag-note">
                    ⚠️ {app.flagNote}
                  </div>
                )}

                <div className="card-footer-row">
                  <span className="docs-count">
                    📄 {app.documentsSubmitted.length} दस्तावेज़ संलग्न
                  </span>
                  <Link
                    href={`/applications/${app.id}`}
                    className="btn-action-review"
                  >
                    समीक्षा करें →
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Empty State */}
      {filteredApps.length === 0 && (
        <div className="empty-state-box executive-card">
          <div className="empty-icon">🔎</div>
          <h3 className="empty-title">कोई आवेदन नहीं मिला</h3>
          <p className="empty-desc">
            आपके द्वारा चुने गए फ़िल्टर या खोज शब्द &quot;{searchTerm}&quot; के अनुसार कोई परिणाम उपलब्ध नहीं है।
          </p>
          <button
            onClick={() => {
              setSearchTerm("");
              setStatusFilter("ALL");
            }}
            className="btn-reset-filters"
          >
            सभी फ़िल्टर रीसेट करें
          </button>
        </div>
      )}

      <style jsx>{`
        /* Hero Banner */
        .hero-banner {
          background: linear-gradient(135deg, #07152b 0%, #0b1f3a 50%, #163660 100%);
          color: white;
          border-radius: 18px;
          padding: 2rem 2.25rem;
          margin-bottom: 2rem;
          display: flex;
          align-items: center;
          justify-content: space-between;
          flex-wrap: wrap;
          gap: 1.5rem;
          box-shadow: var(--shadow-elevated);
          position: relative;
          overflow: hidden;
        }

        .hero-banner::after {
          content: "";
          position: absolute;
          right: -20px;
          bottom: -40px;
          width: 200px;
          height: 200px;
          background: radial-gradient(circle, rgba(249, 115, 22, 0.15) 0%, transparent 70%);
          pointer-events: none;
        }

        .hero-left {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
          max-width: 680px;
        }

        .hero-salutation {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          font-size: 0.8rem;
        }

        .hero-badge {
          background: rgba(251, 211, 141, 0.2);
          color: #fbd38d;
          border: 1px solid rgba(251, 211, 141, 0.35);
          border-radius: 999px;
          padding: 0.2rem 0.75rem;
          font-weight: 600;
        }

        .hero-date {
          color: #cbd5e1;
          font-family: var(--font-sans);
        }

        .hero-title {
          font-size: 1.85rem;
          font-weight: 700;
          letter-spacing: -0.01em;
          color: #ffffff;
        }

        .officer-highlight {
          color: #fbd38d;
        }

        .hero-subtitle {
          font-size: 0.92rem;
          color: #e2e8f0;
          line-height: 1.5;
        }

        .text-amber {
          color: #fbd38d;
        }

        .text-red {
          color: #fca5a5;
        }

        .hero-sla-alert {
          background: rgba(220, 38, 38, 0.2);
          border: 1.5px solid rgba(248, 113, 113, 0.45);
          backdrop-filter: blur(10px);
          border-radius: 14px;
          padding: 1.15rem 1.35rem;
          display: flex;
          align-items: center;
          gap: 1rem;
          max-width: 420px;
        }

        .sla-alert-icon {
          font-size: 1.8rem;
        }

        .sla-alert-title {
          font-size: 0.88rem;
          font-weight: 700;
          color: #fecaca;
        }

        .sla-alert-desc {
          font-size: 0.78rem;
          color: #fee2e2;
          line-height: 1.4;
          margin-top: 0.2rem;
        }

        .btn-filter-sla {
          background: #dc2626;
          color: white;
          border: none;
          border-radius: 8px;
          padding: 0.45rem 0.85rem;
          font-size: 0.8rem;
          font-weight: 600;
          cursor: pointer;
          white-space: nowrap;
          transition: background 0.15s ease;
        }

        .btn-filter-sla:hover {
          background: #b91c1c;
        }

        /* KPI Cards Grid */
        .kpi-grid {
          display: grid;
          grid-templateColumns: repeat(auto-fit, minmax(170px, 1fr));
          gap: 1.1rem;
          margin-bottom: 2rem;
        }

        /* Controls Panel */
        .controls-panel {
          background: #ffffff;
          border: 1px solid var(--clr-border);
          border-radius: 14px;
          padding: 1.15rem 1.35rem;
          display: flex;
          flex-direction: column;
          gap: 1rem;
          margin-bottom: 1rem;
          box-shadow: var(--shadow-card);
        }

        .search-box-wrapper {
          position: relative;
          display: flex;
          align-items: center;
          width: 100%;
        }

        .search-icon {
          position: absolute;
          left: 1.1rem;
          font-size: 1rem;
          opacity: 0.6;
          pointer-events: none;
        }

        .search-input {
          width: 100%;
          border: 1.5px solid var(--clr-border);
          border-radius: 10px;
          padding: 0.75rem 2.5rem 0.75rem 2.85rem;
          font-family: var(--font-devanagari);
          font-size: 0.95rem;
          color: var(--clr-text);
          background: #f8fafc;
          transition: all 0.18s ease;
          outline: none;
        }

        .search-input:focus {
          border-color: #2563eb;
          background: #ffffff;
          box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.12);
        }

        .search-clear-btn {
          position: absolute;
          right: 1rem;
          background: none;
          border: none;
          color: #94a3b8;
          font-size: 1rem;
          cursor: pointer;
        }

        /* Filter Chips */
        .filter-chips-scroll {
          display: flex;
          gap: 0.65rem;
          overflow-x: auto;
          padding-bottom: 0.25rem;
        }

        .filter-chip {
          background: #f1f5f9;
          border: 1px solid #e2e8f0;
          border-radius: 999px;
          padding: 0.4rem 0.95rem;
          font-size: 0.82rem;
          font-weight: 600;
          color: #475569;
          cursor: pointer;
          white-space: nowrap;
          transition: all 0.15s ease;
          display: flex;
          align-items: center;
          gap: 0.4rem;
        }

        .filter-chip:hover {
          background: #e2e8f0;
          color: #1e293b;
        }

        .chip-active {
          background: #0b1f3a !important;
          color: #ffffff !important;
          border-color: #0b1f3a !important;
        }

        .chip-sla {
          background: #fef2f2;
          color: #dc2626;
          border-color: #fecaca;
        }

        .chip-active-sla {
          background: #dc2626 !important;
          color: #ffffff !important;
          border-color: #dc2626 !important;
        }

        .sla-dot {
          width: 7px;
          height: 7px;
          border-radius: 50%;
          background: #dc2626;
        }

        .chip-active-sla .sla-dot {
          background: #ffffff;
        }

        /* Toolbar Right */
        .toolbar-right {
          display: flex;
          align-items: center;
          justify-content: space-between;
          flex-wrap: wrap;
          gap: 1rem;
          padding-top: 0.75rem;
          border-top: 1px solid var(--clr-border-subtle);
        }

        .sort-selector {
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }

        .sort-label {
          font-size: 0.82rem;
          font-weight: 600;
          color: #64748b;
        }

        .sort-dropdown {
          border: 1px solid var(--clr-border);
          border-radius: 8px;
          padding: 0.4rem 0.75rem;
          font-size: 0.84rem;
          font-family: var(--font-devanagari);
          color: var(--clr-text);
          background: white;
          outline: none;
          cursor: pointer;
        }

        .view-toggle {
          display: flex;
          background: #f1f5f9;
          border: 1px solid #e2e8f0;
          border-radius: 8px;
          padding: 2px;
        }

        .view-btn {
          border: none;
          background: none;
          padding: 0.35rem 0.75rem;
          border-radius: 6px;
          font-size: 0.78rem;
          font-weight: 600;
          color: #64748b;
          cursor: pointer;
          transition: all 0.15s ease;
        }

        .view-btn-active {
          background: #ffffff;
          color: #0b1f3a;
          box-shadow: 0 1px 3px rgba(0,0,0,0.1);
        }

        /* Results Meta Bar */
        .results-meta-bar {
          display: flex;
          align-items: center;
          justify-content: space-between;
          font-size: 0.82rem;
          color: var(--clr-text-secondary);
          margin-bottom: 0.85rem;
          padding: 0 0.25rem;
        }

        .active-filter-tag {
          background: #eff6ff;
          color: #1d4ed8;
          border: 1px solid #bfdbfe;
          border-radius: 6px;
          padding: 0.15rem 0.6rem;
          display: flex;
          align-items: center;
          gap: 0.4rem;
        }

        .tag-remove {
          border: none;
          background: none;
          color: #1d4ed8;
          font-weight: 700;
          cursor: pointer;
        }

        /* Table Design */
        .table-container {
          overflow-x: auto;
          border-radius: 14px;
        }

        .modern-table {
          width: 100%;
          border-collapse: collapse;
          font-size: 0.88rem;
          text-align: left;
        }

        .table-head-row {
          background: linear-gradient(90deg, #07152b 0%, #0b1f3a 100%);
          color: #ffffff;
        }

        .table-head-row th {
          padding: 0.95rem 0.85rem;
          font-weight: 600;
          font-size: 0.82rem;
          letter-spacing: 0.02em;
          white-space: nowrap;
        }

        .modern-table td {
          padding: 0.9rem 0.85rem;
          border-bottom: 1px solid #f1f5f9;
        }

        .row-sla-breached {
          background: #fff8f8 !important;
        }

        .row-high-priority {
          background: #fffef2 !important;
        }

        .cell-index {
          text-align: center;
          font-weight: 600;
          color: #94a3b8;
        }

        .applicant-flex {
          display: flex;
          align-items: flex-start;
          gap: 0.75rem;
        }

        .applicant-avatar {
          width: 34px;
          height: 34px;
          border-radius: 50%;
          background: #e2e8f0;
          color: #0b1f3a;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 700;
          font-size: 0.88rem;
          flex-shrink: 0;
        }

        .applicant-name {
          font-weight: 700;
          color: #0b1f3a;
          font-size: 0.92rem;
        }

        .applicant-relation {
          font-size: 0.78rem;
          color: #64748b;
        }

        .applicant-id-tag {
          font-size: 0.72rem;
          color: #94a3b8;
          font-family: var(--font-sans);
        }

        .applicant-flag-note {
          display: inline-block;
          font-size: 0.72rem;
          color: #b91c1c;
          background: #fee2e2;
          border-radius: 4px;
          padding: 0.15rem 0.5rem;
          margin-top: 0.25rem;
        }

        .location-village {
          font-weight: 600;
          color: #1e293b;
        }

        .location-tehsil {
          font-size: 0.78rem;
          color: #64748b;
        }

        .age-badge {
          display: inline-block;
          font-weight: 700;
          font-size: 0.88rem;
          border-radius: 6px;
          padding: 0.2rem 0.6rem;
        }

        .age-eligible {
          background: #ecfdf5;
          color: #047857;
        }

        .age-ineligible {
          background: #fef2f2;
          color: #b91c1c;
        }

        .age-subtext {
          font-size: 0.72rem;
          color: #64748b;
          margin-top: 0.15rem;
        }

        .income-amount {
          font-weight: 600;
          color: #1e293b;
          font-family: var(--font-sans);
        }

        .income-ceiling {
          font-size: 0.72rem;
          color: #64748b;
        }

        .sla-days-wrap {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 0.2rem;
        }

        .sla-days {
          font-weight: 700;
          font-size: 0.88rem;
        }

        .sla-text-red {
          color: #dc2626;
        }

        .sla-text-amber {
          color: #d97706;
        }

        .sla-text-normal {
          color: #334155;
        }

        .sla-badge-pill {
          background: #fee2e2;
          color: #b91c1c;
          border: 1px solid #fecaca;
          border-radius: 999px;
          padding: 0.1rem 0.45rem;
          font-size: 0.68rem;
          font-weight: 700;
        }

        .sla-progress-track {
          width: 70px;
          height: 4px;
          background: #e2e8f0;
          border-radius: 2px;
          margin: 0.35rem auto 0;
          overflow: hidden;
        }

        .sla-progress-fill {
          height: 100%;
          border-radius: 2px;
        }

        .fill-red {
          background: #dc2626;
        }

        .fill-amber {
          background: #d97706;
        }

        .fill-blue {
          background: #3b82f6;
        }

        .status-pill-badge {
          display: inline-flex;
          align-items: center;
          gap: 0.35rem;
          border-radius: 999px;
          padding: 0.25rem 0.75rem;
          font-size: 0.78rem;
          font-weight: 600;
          white-space: nowrap;
        }

        .status-dot {
          width: 6px;
          height: 6px;
          border-radius: 50%;
        }

        .priority-high-badge {
          background: #fffbeb;
          color: #b45309;
          border: 1px solid #fde68a;
          border-radius: 999px;
          padding: 0.2rem 0.65rem;
          font-size: 0.74rem;
          font-weight: 700;
          display: inline-block;
        }

        .priority-normal-badge {
          color: #94a3b8;
          font-size: 0.78rem;
        }

        .btn-action-review {
          display: inline-block;
          background: linear-gradient(135deg, #0b1f3a 0%, #163660 100%);
          color: #ffffff !important;
          text-decoration: none;
          border-radius: 8px;
          padding: 0.45rem 0.95rem;
          font-size: 0.8rem;
          font-weight: 600;
          transition: all 0.18s ease;
          box-shadow: 0 2px 6px rgba(11, 31, 58, 0.15);
        }

        .btn-action-review:hover {
          background: linear-gradient(135deg, #163660 0%, #2563eb 100%);
          transform: translateY(-1px);
          box-shadow: 0 4px 10px rgba(11, 31, 58, 0.25);
        }

        /* Cards Grid View */
        .cards-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
          gap: 1.25rem;
        }

        .app-card {
          padding: 1.35rem;
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }

        .card-sla-breached {
          border-left: 4px solid #dc2626 !important;
        }

        .card-top-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
        }

        .card-index-pill {
          font-weight: 700;
          color: #94a3b8;
          font-size: 0.82rem;
        }

        .card-badges-flex {
          display: flex;
          align-items: center;
          gap: 0.4rem;
          flex-wrap: wrap;
        }

        .card-applicant-row {
          display: flex;
          align-items: center;
          gap: 0.85rem;
        }

        .applicant-avatar-lg {
          width: 44px;
          height: 44px;
          border-radius: 50%;
          background: #e2e8f0;
          color: #0b1f3a;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 700;
          font-size: 1.1rem;
          flex-shrink: 0;
        }

        .card-applicant-name {
          font-size: 1.05rem;
          font-weight: 700;
          color: #0b1f3a;
        }

        .card-applicant-sub {
          font-size: 0.8rem;
          color: #64748b;
        }

        .card-meta-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 0.65rem;
          background: #f8fafc;
          border: 1px solid #f1f5f9;
          border-radius: 10px;
          padding: 0.75rem;
        }

        .meta-box {
          display: flex;
          flex-direction: column;
          gap: 0.15rem;
        }

        .meta-label {
          font-size: 0.72rem;
          color: #64748b;
        }

        .meta-val {
          font-size: 0.85rem;
          font-weight: 700;
          color: #1e293b;
        }

        .age-eligible-text {
          color: #047857;
        }

        .age-ineligible-text {
          color: #b91c1c;
        }

        .card-flag-note {
          background: #fee2e2;
          color: #b91c1c;
          border-radius: 6px;
          padding: 0.4rem 0.65rem;
          font-size: 0.76rem;
        }

        .card-footer-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding-top: 0.75rem;
          border-top: 1px solid #f1f5f9;
        }

        .docs-count {
          font-size: 0.76rem;
          color: #64748b;
        }

        /* Empty State */
        .empty-state-box {
          padding: 4rem 2rem;
          text-align: center;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 0.75rem;
        }

        .empty-icon {
          font-size: 3rem;
          opacity: 0.7;
        }

        .empty-title {
          font-size: 1.25rem;
          font-weight: 700;
          color: #0b1f3a;
        }

        .empty-desc {
          font-size: 0.88rem;
          color: #64748b;
          max-width: 440px;
        }

        .btn-reset-filters {
          margin-top: 0.5rem;
          background: #0b1f3a;
          color: white;
          border: none;
          border-radius: 8px;
          padding: 0.6rem 1.25rem;
          font-size: 0.85rem;
          font-weight: 600;
          cursor: pointer;
        }

        @media (max-width: 768px) {
          .hero-banner {
            padding: 1.5rem;
          }
          .hero-title {
            font-size: 1.45rem;
          }
          .kpi-grid {
            grid-template-columns: repeat(2, 1fr);
          }
          .toolbar-right {
            flex-direction: column;
            align-items: flex-start;
          }
        }
      `}</style>
    </div>
  );
}

function KpiCard({
  label,
  value,
  icon,
  color,
  bg,
  border,
  active,
  onClick,
  glowRed,
}: {
  label: string;
  value: number;
  icon: string;
  color: string;
  bg: string;
  border: string;
  active?: boolean;
  onClick?: () => void;
  glowRed?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        background: bg,
        border: `1.5px solid ${active ? color : border}`,
        borderRadius: "14px",
        padding: "1.1rem 1rem",
        display: "flex",
        flexDirection: "column",
        gap: "0.35rem",
        boxShadow: glowRed
          ? "0 0 16px -2px rgba(220, 38, 38, 0.3)"
          : active
          ? "0 4px 14px rgba(15,46,94,0.12)"
          : "var(--shadow-sm)",
        cursor: "pointer",
        textAlign: "left",
        transition: "all 0.18s ease",
        transform: active ? "translateY(-2px)" : "none",
        position: "relative",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <span style={{ fontSize: "1.4rem" }}>{icon}</span>
        {active && (
          <span
            style={{
              width: "8px",
              height: "8px",
              borderRadius: "50%",
              background: color,
            }}
          />
        )}
      </div>
      <div
        style={{
          fontSize: "1.85rem",
          fontWeight: 800,
          color,
          lineHeight: 1.1,
          fontFamily: "var(--font-sans)",
        }}
      >
        {value}
      </div>
      <div
        style={{
          fontSize: "0.78rem",
          fontWeight: 600,
          color: "#475569",
        }}
      >
        {label}
      </div>
    </button>
  );
}
