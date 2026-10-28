"use client";

import { useState, useMemo, useSyncExternalStore } from "react";
import Link from "next/link";
import { Application, ApplicationStatus } from "@prisma/client";
import { SLA_BREACH_DAYS, isSlaBreached } from "@/lib/eligibility";
import { calculateUrgencyScore } from "@/lib/urgency";
import { calculateAge } from "@/lib/ai";
import GovEmblem from "@/components/GovEmblem";
import { useLanguage } from "@/lib/i18n/LanguageContext";
import Icon from "@/components/Icon";

export interface DashboardAppItem extends Application {
  _count: {
    auditLogs: number;
  };
}

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

// One restrained navy tone for every applicant initial (no decorative rainbow)
const AVATAR_BACKGROUND = "linear-gradient(135deg, #1e3a8a 0%, #0b1f3a 100%)";

// Phones get the card view by default; the wide table only suits larger screens
const NARROW_QUERY = "(max-width: 768px)";

function subscribeNarrow(callback: () => void) {
  const mql = window.matchMedia(NARROW_QUERY);
  mql.addEventListener("change", callback);
  return () => mql.removeEventListener("change", callback);
}

function useIsNarrowScreen(): boolean {
  return useSyncExternalStore(
    subscribeNarrow,
    () => window.matchMedia(NARROW_QUERY).matches,
    () => false
  );
}

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
  const { language, t, interpolate } = useLanguage();

  const statusLabels: Record<ApplicationStatus, string> = {
    PENDING: t.common.statusPending,
    APPROVED: t.common.statusApproved,
    REJECTED: t.common.statusRejected,
    RETURNED: t.common.statusReturned,
  };

  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  // null = follow screen size until the officer picks a view explicitly
  const [chosenViewMode, setViewMode] = useState<"table" | "grid" | null>(null);
  const isNarrowScreen = useIsNarrowScreen();
  const viewMode = chosenViewMode ?? (isNarrowScreen ? "grid" : "table");
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

  const displayOfficerName = officerName || (language === "hi" ? "अधिकारी" : "Officer");
  const displayDesignation =
    officerDesignation === "तहसीलदार" || !officerDesignation
      ? t.common.tehsildar
      : officerDesignation;

  return (
    <div style={{ fontFamily: language === "hi" ? "var(--font-devanagari)" : "var(--font-sans)" }}>
      {/* ─── Hero Briefing Banner ─────────────────────────────────────────── */}
      <div className="hero-banner">
        <div className="hero-left">
          <div className="hero-salutation">
            <span className="hero-badge">
              <GovEmblem size={22} style={{ marginRight: "6px", flexShrink: 0 }} />{" "}
              {t.dashboard.portalBadge}
            </span>
            <span className="hero-date">
              <Icon name="calendar" size={14} />{" "}
              {new Date().toLocaleDateString(language === "hi" ? "hi-IN" : "en-US", {
                weekday: "long",
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </span>
          </div>
          <h1 className="hero-title">
            {t.dashboard.greetingMorning},{" "}
            <span className="officer-highlight">
              {displayOfficerName}
              {language === "hi" ? " जी" : ""}
            </span>
            <span className="officer-role-tag">{displayDesignation}</span>
          </h1>
          <p className="hero-subtitle">
            {language === "hi" ? (
              <>
                आपके कार्यक्षेत्र में कुल <strong className="stat-pill-white">{total} आवेदन</strong> पंजीकृत हैं — जिनमें से{" "}
                <strong className="stat-pill-amber">{pending} लंबित</strong> हैं एवं{" "}
                <strong className="stat-pill-red">{slaBreached} आवेदनों की 30-दिवसीय SLA सीमा समाप्त</strong> हो चुकी है।
              </>
            ) : (
              <>
                There are <strong className="stat-pill-white">{total} registered applications</strong> in your area —{" "}
                <strong className="stat-pill-amber">{pending} pending review</strong> and{" "}
                <strong className="stat-pill-red">{slaBreached} with 30-day statutory SLA deadline breached</strong>.
              </>
            )}
          </p>
        </div>

        {slaBreached > 0 && (
          <div className="hero-sla-alert">
            <div className="sla-alert-beacon">
              <span className="beacon-ring"></span>
              <span className="beacon-core"><Icon name="alertOctagon" size={22} /></span>
            </div>
            <div className="sla-alert-content">
              <div className="sla-alert-title">{t.dashboard.slaAlertTitle}</div>
              <div className="sla-alert-desc">
                {interpolate(t.dashboard.slaAlertDesc, { count: slaBreached })}
              </div>
            </div>
            <button
              onClick={() => setStatusFilter("SLA_BREACH")}
              className="btn-filter-sla"
            >
              {interpolate(t.dashboard.slaReviewBtn, { count: slaBreached })}
            </button>
          </div>
        )}
      </div>

      {/* ─── Modern 6-Column KPI Grid ─────────────────────────────────────── */}
      <div className="kpi-grid">
        <KpiCard
          label={t.dashboard.kpiTotalLabel}
          value={total}
          icon={<Icon name="clipboardList" size={18} />}
          subtext={t.dashboard.kpiTotalSub}
          color="#0b1f3a"
          accentColor="#1e3a8a"
          active={statusFilter === "ALL"}
          onClick={() => setStatusFilter("ALL")}
        />
        <KpiCard
          label={t.dashboard.kpiPendingLabel}
          value={pending}
          icon={<Icon name="clock" size={18} />}
          subtext={interpolate(t.dashboard.kpiPendingSub, {
            percent: total > 0 ? Math.round((pending / total) * 100) : 0,
          })}
          color="#1d4ed8"
          accentColor="#2563eb"
          active={statusFilter === "PENDING"}
          onClick={() => setStatusFilter("PENDING")}
        />
        <KpiCard
          label={t.dashboard.kpiSlaLabel}
          value={slaBreached}
          icon={<Icon name="alertOctagon" size={18} />}
          subtext={t.dashboard.kpiSlaSub}
          color="#b91c1c"
          accentColor="#ef4444"
          active={statusFilter === "SLA_BREACH"}
          onClick={() => setStatusFilter("SLA_BREACH")}
          glowRed={slaBreached > 0}
        />
        <KpiCard
          label={t.dashboard.kpiHighLabel}
          value={highPriority}
          icon={<Icon name="flag" size={18} />}
          subtext={t.dashboard.kpiHighSub}
          color="#b45309"
          accentColor="#f59e0b"
          active={statusFilter === "HIGH_PRIORITY"}
          onClick={() => setStatusFilter("HIGH_PRIORITY")}
        />
        <KpiCard
          label={t.dashboard.kpiApprovedLabel}
          value={approved}
          icon={<Icon name="checkCircle" size={18} />}
          subtext={t.dashboard.kpiApprovedSub}
          color="#047857"
          accentColor="#10b981"
          active={statusFilter === "APPROVED"}
          onClick={() => setStatusFilter("APPROVED")}
        />
        <KpiCard
          label={t.dashboard.kpiRejectedLabel}
          value={rejected + returned}
          icon={<Icon name="rotateCcw" size={18} />}
          subtext={interpolate(t.dashboard.kpiRejectedSub, { rejected, returned })}
          color="#334155"
          accentColor="#64748b"
          active={statusFilter === "REJECTED"}
          onClick={() => setStatusFilter("REJECTED")}
        />
      </div>

      {/* ─── Search, Filters & View Switcher ──────────────────────────────── */}
      <div className="controls-panel">
        <div className="controls-top-row">
          <div className="search-box-wrapper">
            <span className="search-icon"><Icon name="search" size={17} /></span>
            <input
              type="text"
              placeholder={t.dashboard.searchPlaceholder}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="search-input"
            />
            {searchTerm ? (
              <button
                onClick={() => setSearchTerm("")}
                className="search-clear-btn"
                title={t.dashboard.searchClear}
                aria-label={t.dashboard.searchClear}
              >
                <Icon name="x" size={14} />
              </button>
            ) : (
              <span className="search-shortcut">⌘K</span>
            )}
          </div>

          <div className="view-and-sort-controls">
            {/* Sort Dropdown */}
            <div className="sort-select-wrapper">
              <span className="sort-label">{t.dashboard.sortLabel}</span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
                className="sort-select"
              >
                <option value="urgency">{t.dashboard.sortUrgency}</option>
                <option value="waiting">{t.dashboard.sortWaiting}</option>
                <option value="age">{t.dashboard.sortAge}</option>
                <option value="date">{t.dashboard.sortDate}</option>
              </select>
            </div>

            {/* View Mode Toggle */}
            <div className="view-toggle-group">
              <button
                type="button"
                onClick={() => setViewMode("table")}
                className={`view-toggle-btn ${viewMode === "table" ? "toggle-active" : ""}`}
                title={language === "hi" ? "तालिका दृश्य (Table View)" : "Table View"}
              >
                <Icon name="table" size={15} /> {t.dashboard.viewTable}
              </button>
              <button
                type="button"
                onClick={() => setViewMode("grid")}
                className={`view-toggle-btn ${viewMode === "grid" ? "toggle-active" : ""}`}
                title={language === "hi" ? "कार्ड्स दृश्य (Cards View)" : "Cards View"}
              >
                <Icon name="grid" size={15} /> {t.dashboard.viewCards}
              </button>
            </div>
          </div>
        </div>

        {/* Filter Segmented Control Chips */}
        <div className="filter-chips-scroll">
          <button
            className={`filter-chip ${statusFilter === "ALL" ? "chip-active" : ""}`}
            onClick={() => setStatusFilter("ALL")}
          >
            {t.dashboard.filterAll} <span className="chip-count">{total}</span>
          </button>
          <button
            className={`filter-chip chip-sla ${statusFilter === "SLA_BREACH" ? "chip-active-sla" : ""}`}
            onClick={() => setStatusFilter("SLA_BREACH")}
          >
            <span className="sla-dot pulse-dot"></span>
            {t.dashboard.filterSla} <span className="chip-count-danger">{slaBreached}</span>
          </button>
          <button
            className={`filter-chip ${statusFilter === "HIGH_PRIORITY" ? "chip-active" : ""}`}
            onClick={() => setStatusFilter("HIGH_PRIORITY")}
          >
            {t.dashboard.filterHigh} <span className="chip-count">{highPriority}</span>
          </button>
          <button
            className={`filter-chip ${statusFilter === "PENDING" ? "chip-active" : ""}`}
            onClick={() => setStatusFilter("PENDING")}
          >
            {t.dashboard.filterPending} <span className="chip-count">{pending}</span>
          </button>
          <button
            className={`filter-chip ${statusFilter === "APPROVED" ? "chip-active" : ""}`}
            onClick={() => setStatusFilter("APPROVED")}
          >
            {t.dashboard.filterApproved} <span className="chip-count">{approved}</span>
          </button>
          <button
            className={`filter-chip ${statusFilter === "REJECTED" ? "chip-active" : ""}`}
            onClick={() => setStatusFilter("REJECTED")}
          >
            {t.dashboard.filterRejected} <span className="chip-count">{rejected + returned}</span>
          </button>
        </div>
      </div>

      {/* ─── Results Meta Counter ─────────────────────────────────────────── */}
      <div className="results-meta-bar">
        <div className="results-meta-left">
          <span className="meta-results-count">
            {interpolate(t.dashboard.resultsCount, { shown: filteredApps.length, total })}
          </span>
          {statusFilter !== "ALL" && (
            <span className="active-filter-badge">
              {t.dashboard.filterTagPrefix}{" "}
              {statusFilter === "SLA_BREACH"
                ? t.dashboard.filterSla
                : statusFilter === "HIGH_PRIORITY"
                ? t.dashboard.filterHigh
                : statusLabels[statusFilter as ApplicationStatus] || statusFilter}
              <button onClick={() => setStatusFilter("ALL")} className="tag-remove">×</button>
            </span>
          )}
          {searchTerm && (
            <span className="active-filter-badge">
              {t.dashboard.searchTagPrefix} &quot;{searchTerm}&quot;
              <button onClick={() => setSearchTerm("")} className="tag-remove">×</button>
            </span>
          )}
        </div>
      </div>

      {/* ─── Empty Results State ──────────────────────────────────────────── */}
      {filteredApps.length === 0 ? (
        <div className="empty-results-card executive-card">
          <div className="empty-icon"><Icon name="search" size={40} strokeWidth={1.5} /></div>
          <h3 className="empty-title">{t.dashboard.emptyTitle}</h3>
          <p className="empty-desc">{t.dashboard.emptyDesc}</p>
          <button
            onClick={() => {
              setSearchTerm("");
              setStatusFilter("ALL");
            }}
            className="btn-reset-filters"
          >
            {t.dashboard.resetFilters}
          </button>
        </div>
      ) : viewMode === "table" ? (
        /* ─── Ultra-Clean Modern Table View ──────────────────────────────── */
        <div className="table-container">
          <table className="modern-table">
            <thead>
              <tr className="table-head-row">
                <th style={{ width: "52px", textAlign: "center" }}>{t.dashboard.thIndex}</th>
                <th>{t.dashboard.thApplicant}</th>
                <th>{t.dashboard.thLocation}</th>
                <th style={{ textAlign: "center" }}>{t.dashboard.thAge}</th>
                <th>{t.dashboard.thIncome}</th>
                <th style={{ textAlign: "center" }}>{t.dashboard.thWaiting}</th>
                <th style={{ textAlign: "center" }}>{t.dashboard.thStatus}</th>
                <th style={{ textAlign: "center" }}>{t.dashboard.thPriority}</th>
                <th style={{ textAlign: "center", width: "145px" }}>{t.dashboard.thAction}</th>
              </tr>
            </thead>
            <tbody>
              {filteredApps.map((app, idx) => {
                const days = daysSince(app.submittedAt);
                const sla = isSlaBreached(new Date(app.submittedAt), app.status);
                const isHigh = app.priority === "HIGH" && app.status === "PENDING";
                const isApproved = app.status === "APPROVED";
                const isRejected = app.status === "REJECTED";
                const age = calculateAge(new Date(app.dob));
                const statusStyle = STATUS_PILL_STYLES[app.status];
                const slaPercent = Math.min(Math.round((days / SLA_BREACH_DAYS) * 100), 100);

                return (
                  <tr
                    key={app.id}
                    className={`table-row-card ${
                      sla
                        ? "row-sla-breached"
                        : isHigh
                        ? "row-high-priority"
                        : isApproved
                        ? "row-approved"
                        : isRejected
                        ? "row-rejected"
                        : "row-normal"
                    }`}
                  >
                    <td className="cell-index">
                      <span className={`index-badge ${sla ? "index-sla" : isHigh ? "index-high" : ""}`}>
                        {idx + 1}
                      </span>
                    </td>

                    {/* Applicant Name & Masked Info */}
                    <td className="cell-applicant">
                      <div className="applicant-flex">
                        <div
                          className="applicant-avatar"
                          style={{ background: AVATAR_BACKGROUND }}
                        >
                          {app.applicantName[0]}
                        </div>
                        <div className="applicant-info-block">
                          <div className="applicant-name-row">
                            <span className="applicant-name">{app.applicantName}</span>
                            {app.flagNote && (
                              <span className="applicant-flag-chip" title={app.flagNote}>
                                <Icon name="info" size={13} label={app.flagNote} />
                              </span>
                            )}
                          </div>
                          <div className="applicant-relation">
                            {t.dashboard.relationPrefix} {app.fatherHusbandName}
                          </div>
                          <div className="applicant-aadhaar-pill">
                            <Icon name="idCard" size={13} /> {app.aadhaarMasked}
                          </div>
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
                      <span className={`age-pill ${age >= 60 ? "age-eligible" : "age-ineligible"}`}>
                        {age} {t.common.years}
                      </span>
                      <div className="age-subtext">
                        {age >= 60
                          ? language === "hi"
                            ? "✓ 60+ पूर्ण"
                            : "✓ 60+ Eligible"
                          : language === "hi"
                          ? "✕ अपात्र"
                          : "✕ Underage"}
                      </div>
                    </td>

                    {/* Annual Income */}
                    <td className="cell-income">
                      <div className="income-amount">
                        ₹{app.annualIncome.toLocaleString(language === "hi" ? "hi-IN" : "en-IN")}
                      </div>
                      <div className="income-ceiling">
                        {app.annualIncome <= 200000 ? (
                          <span className="income-pass">
                            {language === "hi" ? "✓ ₹2L सीमा में" : "✓ Within ₹2L"}
                          </span>
                        ) : (
                          <span className="income-fail">
                            <Icon name="alertTriangle" size={12} /> {language === "hi" ? "सीमा से अधिक" : "Above limit"}
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Waiting Days & SLA Progress Bar */}
                    <td className="cell-sla" style={{ textAlign: "center" }}>
                      <div className="sla-days-wrap">
                        <span className={`sla-days ${sla ? "sla-text-red" : days > 15 ? "sla-text-amber" : "sla-text-normal"}`}>
                          {app.status === "PENDING"
                            ? interpolate(t.dashboard.daysPending, { days })
                            : language === "hi"
                            ? "निस्तारित"
                            : "Resolved"}
                        </span>
                        {sla && <span className="sla-badge-pill">{t.dashboard.slaOverdue}</span>}
                      </div>

                      {app.status === "PENDING" && (
                        <div
                          className="sla-progress-track"
                          title={`${days}/${SLA_BREACH_DAYS} ${t.common.days} (${slaPercent}%)`}
                        >
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
                          border: `1.5px solid ${statusStyle.border}`,
                        }}
                      >
                        <span
                          className="status-dot"
                          style={{ background: statusStyle.dot }}
                        />
                        {statusLabels[app.status]}
                      </span>
                    </td>

                    {/* Priority */}
                    <td style={{ textAlign: "center" }}>
                      {app.priority === "HIGH" && app.status === "PENDING" ? (
                        <span className="priority-high-badge">
                          <Icon name="flag" size={12} /> {language === "hi" ? "उच्च" : "High"}
                        </span>
                      ) : (
                        <span className="priority-normal-badge">
                          {language === "hi" ? "सामान्य" : "Normal"}
                        </span>
                      )}
                    </td>

                    {/* Action Link Button */}
                    <td style={{ textAlign: "center" }}>
                      <Link
                        href={`/applications/${app.id}`}
                        className="btn-action-review"
                      >
                        <span>{app.status === "PENDING" ? t.dashboard.btnReview : t.dashboard.btnReviewed}</span>
                        {app.status === "PENDING" && <span className="btn-arrow">→</span>}
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : (
        /* ─── Bento Grid Cards View ───────────────────────────────────────── */
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
                    {sla && <span className="sla-badge-pill"><Icon name="alertOctagon" size={12} /> {t.dashboard.slaOverdue}</span>}
                    {isHigh && (
                      <span className="priority-high-badge">
                        <Icon name="flag" size={12} /> {language === "hi" ? "उच्च" : "High"}
                      </span>
                    )}
                    <span
                      className="status-pill-badge"
                      style={{
                        background: statusStyle.bg,
                        color: statusStyle.text,
                        border: `1.5px solid ${statusStyle.border}`,
                      }}
                    >
                      <span className="status-dot" style={{ background: statusStyle.dot }} />
                      {statusLabels[app.status]}
                    </span>
                  </div>
                </div>

                <div className="card-applicant-row">
                  <div
                    className="applicant-avatar-lg"
                    style={{ background: AVATAR_BACKGROUND }}
                  >
                    {app.applicantName[0]}
                  </div>
                  <div>
                    <h3 className="card-applicant-name">{app.applicantName}</h3>
                    <p className="card-applicant-sub">{t.dashboard.relationPrefix} {app.fatherHusbandName}</p>
                    <p className="card-applicant-aadhaar"><Icon name="idCard" size={13} /> {app.aadhaarMasked}</p>
                  </div>
                </div>

                <div className="card-meta-grid">
                  <div className="meta-box">
                    <span className="meta-label">{t.dashboard.thAge}</span>
                    <span className={`meta-val ${age >= 60 ? "age-eligible-text" : "age-ineligible-text"}`}>
                      {age} {t.common.years} {age >= 60 ? "✓" : "✕"}
                    </span>
                  </div>
                  <div className="meta-box">
                    <span className="meta-label">{t.dashboard.thIncome}</span>
                    <span className="meta-val">₹{app.annualIncome.toLocaleString(language === "hi" ? "hi-IN" : "en-IN")}</span>
                  </div>
                  <div className="meta-box">
                    <span className="meta-label">{t.dashboard.thLocation}</span>
                    <span className="meta-val">{app.village}, {app.tehsil}</span>
                  </div>
                  <div className="meta-box">
                    <span className="meta-label">{language === "hi" ? "प्रतीक्षा काल" : "Waiting Time"}</span>
                    <span className={`meta-val ${sla ? "text-red" : ""}`}>
                      {app.status === "PENDING" ? interpolate(t.dashboard.daysPending, { days }) : (language === "hi" ? "निस्तारित" : "Resolved")}
                    </span>
                  </div>
                </div>

                {app.flagNote && (
                  <div className="card-flag-note">
                    <Icon name="flag" size={14} /> {app.flagNote}
                  </div>
                )}

                <div className="card-footer-row">
                  <span className="docs-count">
                    <Icon name="folder" size={14} /> {app.documentsSubmitted.length}/6 {language === "hi" ? "दस्तावेज़" : "Docs"}
                  </span>
                  <Link
                    href={`/applications/${app.id}`}
                    className="btn-action-review"
                  >
                    <span>{app.status === "PENDING" ? t.dashboard.btnReview : t.dashboard.btnReviewed}</span>
                    {app.status === "PENDING" && <span className="btn-arrow">→</span>}
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ─── Stylesheet Scoped to Dashboard ──────────────────────────────── */}
      <style jsx>{`
        /* Hero Banner */
        .hero-banner {
          background: linear-gradient(135deg, #07152b 0%, #0b1f3a 50%, #153763 100%);
          color: white;
          border-radius: 20px;
          padding: 2.25rem 2.5rem;
          margin-bottom: 2rem;
          display: flex;
          align-items: center;
          justify-content: space-between;
          flex-wrap: wrap;
          gap: 1.75rem;
          box-shadow: 0 16px 36px -8px rgba(7, 21, 43, 0.28);
          position: relative;
          overflow: hidden;
          border: 1px solid rgba(255, 255, 255, 0.12);
        }

        .hero-banner::after {
          content: "";
          position: absolute;
          right: -30px;
          bottom: -40px;
          width: 260px;
          height: 260px;
          background: radial-gradient(circle, rgba(249, 115, 22, 0.18) 0%, rgba(99, 102, 241, 0.08) 50%, transparent 70%);
          pointer-events: none;
        }

        .hero-left {
          display: flex;
          flex-direction: column;
          gap: 0.65rem;
          max-width: 680px;
          position: relative;
          z-index: 2;
        }

        .hero-salutation {
          display: flex;
          align-items: center;
          gap: 0.85rem;
          font-size: 0.82rem;
          flex-wrap: wrap;
        }

        .hero-badge {
          background: rgba(251, 211, 141, 0.18);
          color: #fbd38d;
          border: 1px solid rgba(251, 211, 141, 0.35);
          border-radius: 999px;
          padding: 0.25rem 0.85rem;
          font-weight: 600;
          display: inline-flex;
          align-items: center;
          gap: 0.4rem;
        }

        .badge-sparkle {
          font-size: 0.95rem;
        }

        .hero-date {
          color: #cbd5e1;
          font-family: var(--font-devanagari);
          font-size: 0.82rem;
        }

        .hero-title {
          font-size: 1.95rem;
          font-weight: 800;
          letter-spacing: -0.015em;
          color: #ffffff;
          line-height: 1.2;
          display: flex;
          align-items: center;
          flex-wrap: wrap;
          gap: 0.6rem;
        }

        .officer-highlight {
          background: linear-gradient(90deg, #fbd38d 0%, #ffedd5 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
        }

        .officer-role-tag {
          font-size: 0.88rem;
          font-weight: 600;
          color: #94a3b8;
          background: rgba(255, 255, 255, 0.1);
          border: 1px solid rgba(255, 255, 255, 0.15);
          padding: 0.2rem 0.65rem;
          border-radius: 8px;
        }

        .hero-subtitle {
          font-size: 0.94rem;
          color: #cbd5e1;
          line-height: 1.6;
        }

        .stat-pill-white {
          color: #ffffff;
          background: rgba(255, 255, 255, 0.15);
          padding: 0.1rem 0.45rem;
          border-radius: 6px;
        }

        .stat-pill-amber {
          color: #fef08a;
          background: rgba(234, 179, 8, 0.2);
          padding: 0.1rem 0.45rem;
          border-radius: 6px;
        }

        .stat-pill-red {
          color: #fca5a5;
          background: rgba(239, 68, 68, 0.25);
          padding: 0.1rem 0.45rem;
          border-radius: 6px;
        }

        /* Hero SLA Alert */
        .hero-sla-alert {
          background: linear-gradient(135deg, rgba(220, 38, 38, 0.25) 0%, rgba(153, 27, 27, 0.35) 100%);
          border: 1.5px solid rgba(248, 113, 113, 0.55);
          backdrop-filter: blur(12px);
          border-radius: 16px;
          padding: 1.25rem 1.45rem;
          display: flex;
          align-items: center;
          gap: 1.15rem;
          max-width: 440px;
          position: relative;
          z-index: 2;
          box-shadow: 0 8px 24px rgba(220, 38, 38, 0.25);
        }

        .sla-alert-beacon {
          position: relative;
          display: flex;
          align-items: center;
          justify-content: center;
          width: 44px;
          height: 44px;
          flex-shrink: 0;
        }

        .beacon-core {
          font-size: 1.85rem;
          position: relative;
          z-index: 2;
        }

        .beacon-ring {
          position: absolute;
          inset: 0;
          border-radius: 50%;
          background: rgba(239, 68, 68, 0.4);
          animation: pulse-subtle 1.8s infinite;
        }

        .sla-alert-content {
          flex: 1;
        }

        .sla-alert-title {
          font-size: 0.92rem;
          font-weight: 700;
          color: #fee2e2;
        }

        .sla-alert-desc {
          font-size: 0.8rem;
          color: #fecaca;
          line-height: 1.4;
          margin-top: 0.25rem;
        }

        .btn-filter-sla {
          background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
          color: white;
          border: 1px solid rgba(255, 255, 255, 0.3);
          border-radius: 10px;
          padding: 0.55rem 0.95rem;
          font-size: 0.82rem;
          font-weight: 700;
          cursor: pointer;
          white-space: nowrap;
          transition: all 0.18s ease;
          box-shadow: 0 4px 12px rgba(220, 38, 38, 0.35);
        }

        .btn-filter-sla:hover {
          transform: translateY(-2px);
          box-shadow: 0 6px 16px rgba(220, 38, 38, 0.45);
        }

        /* ─── Modern 6-Column KPI Grid ─────────────────────────────────── */
        .kpi-grid {
          display: grid;
          grid-template-columns: repeat(6, minmax(0, 1fr));
          gap: 1.15rem;
          margin-bottom: 2rem;
        }

        @media (max-width: 1200px) {
          .kpi-grid {
            grid-template-columns: repeat(3, minmax(0, 1fr));
          }
        }

        @media (max-width: 768px) {
          .kpi-grid {
            grid-template-columns: repeat(2, minmax(0, 1fr));
          }
        }

        @media (max-width: 480px) {
          .kpi-grid {
            gap: 0.75rem;
          }
        }

        @media (max-width: 640px) {
          .hero-banner {
            padding: 1.5rem 1.25rem;
            border-radius: 16px;
          }

          .hero-sla-alert {
            max-width: 100%;
            width: 100%;
            flex-wrap: wrap;
          }

          .sla-alert-content {
            flex: 1 1 180px;
          }
        }

        /* Controls Panel */
        .controls-panel {
          background: #ffffff;
          border: 1px solid var(--clr-border);
          border-radius: 16px;
          padding: 1.35rem 1.5rem;
          display: flex;
          flex-direction: column;
          gap: 1.15rem;
          margin-bottom: 1.25rem;
          box-shadow: var(--shadow-card);
        }

        .controls-top-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 1.25rem;
          flex-wrap: wrap;
        }

        .search-box-wrapper {
          position: relative;
          display: flex;
          align-items: center;
          flex: 1;
          min-width: 280px;
        }

        .search-icon {
          position: absolute;
          left: 1.15rem;
          font-size: 1.05rem;
          opacity: 0.55;
          pointer-events: none;
        }

        .search-input {
          width: 100%;
          border: 1.5px solid var(--clr-border);
          border-radius: 12px;
          padding: 0.8rem 3rem 0.8rem 3rem;
          font-family: var(--font-devanagari);
          font-size: 0.95rem;
          color: var(--clr-text);
          background: #f8fafc;
          transition: all 0.2s ease;
          outline: none;
        }

        .search-input:focus {
          border-color: #2563eb;
          background: #ffffff;
          box-shadow: 0 0 0 4px rgba(37, 99, 235, 0.12);
        }

        .search-clear-btn {
          position: absolute;
          right: 1.15rem;
          background: #e2e8f0;
          border: none;
          color: #475569;
          font-size: 0.85rem;
          width: 22px;
          height: 22px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
        }

        .search-shortcut {
          position: absolute;
          right: 1.15rem;
          background: #edf2f7;
          color: #94a3b8;
          font-size: 0.72rem;
          font-weight: 700;
          font-family: var(--font-sans);
          padding: 0.2rem 0.5rem;
          border-radius: 6px;
          border: 1px solid #cbd5e1;
        }

        .view-and-sort-controls {
          display: flex;
          align-items: center;
          gap: 1rem;
          flex-wrap: wrap;
        }

        .sort-select-wrapper {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          background: #f8fafc;
          border: 1.5px solid var(--clr-border);
          border-radius: 12px;
          padding: 0.35rem 0.75rem;
        }

        .sort-label {
          font-size: 0.82rem;
          color: #64748b;
          font-weight: 600;
        }

        .sort-select {
          border: none;
          background: transparent;
          font-family: var(--font-devanagari);
          font-size: 0.85rem;
          font-weight: 600;
          color: #0f172a;
          outline: none;
          cursor: pointer;
        }

        .view-toggle-group {
          display: flex;
          align-items: center;
          background: #f1f5f9;
          padding: 0.25rem;
          border-radius: 10px;
          border: 1px solid #e2e8f0;
        }

        .view-toggle-btn {
          border: none;
          background: transparent;
          padding: 0.45rem 0.85rem;
          font-size: 0.82rem;
          font-weight: 600;
          color: #64748b;
          border-radius: 8px;
          cursor: pointer;
          transition: all 0.15s ease;
          display: flex;
          align-items: center;
          gap: 0.4rem;
          font-family: var(--font-devanagari);
        }

        .toggle-active {
          background: #ffffff;
          color: #0f172a;
          box-shadow: 0 1px 4px rgba(0, 0, 0, 0.08);
        }

        /* Filter Chips Segmented Bar */
        .filter-chips-scroll {
          display: flex;
          gap: 0.65rem;
          overflow-x: auto;
          padding-bottom: 0.2rem;
        }

        .filter-chip {
          border: 1.5px solid var(--clr-border);
          background: #f8fafc;
          border-radius: 10px;
          padding: 0.5rem 0.95rem;
          font-size: 0.84rem;
          font-weight: 600;
          color: #475569;
          cursor: pointer;
          white-space: nowrap;
          display: inline-flex;
          align-items: center;
          gap: 0.55rem;
          font-family: var(--font-devanagari);
          transition: all 0.18s ease;
        }

        .filter-chip:hover {
          background: #f1f5f9;
          border-color: #cbd5e1;
          color: #0f172a;
        }

        .chip-active {
          background: #0b1f3a !important;
          border-color: #0b1f3a !important;
          color: #ffffff !important;
          box-shadow: 0 2px 8px rgba(11, 31, 58, 0.2);
        }

        .chip-active .chip-count {
          background: rgba(255, 255, 255, 0.2);
          color: #ffffff;
        }

        .chip-sla {
          border-color: #fecaca;
          background: #fff8f8;
          color: #b91c1c;
        }

        .chip-active-sla {
          background: #dc2626 !important;
          border-color: #dc2626 !important;
          color: #ffffff !important;
          box-shadow: 0 2px 10px rgba(220, 38, 38, 0.3);
        }

        .chip-active-sla .chip-count-danger {
          background: rgba(255, 255, 255, 0.3);
          color: #ffffff;
        }

        .chip-count {
          background: #e2e8f0;
          color: #475569;
          font-size: 0.74rem;
          padding: 0.15rem 0.55rem;
          border-radius: 999px;
          font-family: var(--font-sans);
          font-weight: 700;
        }

        .chip-count-danger {
          background: #fee2e2;
          color: #b91c1c;
          font-size: 0.74rem;
          padding: 0.15rem 0.55rem;
          border-radius: 999px;
          font-family: var(--font-sans);
          font-weight: 700;
        }

        .sla-dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background: #ef4444;
          display: inline-block;
        }

        /* Results Meta Bar */
        .results-meta-bar {
          display: flex;
          align-items: center;
          justify-content: space-between;
          font-size: 0.85rem;
          color: #64748b;
          margin-bottom: 0.95rem;
          padding: 0 0.35rem;
        }

        .results-meta-left {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          flex-wrap: wrap;
        }

        .active-filter-badge {
          background: #eff6ff;
          color: #1d4ed8;
          border: 1px solid #bfdbfe;
          border-radius: 6px;
          padding: 0.15rem 0.65rem;
          font-size: 0.78rem;
          display: flex;
          align-items: center;
          gap: 0.4rem;
          font-weight: 600;
        }

        .tag-remove {
          border: none;
          background: none;
          color: #1d4ed8;
          font-size: 1rem;
          cursor: pointer;
        }

        /* Floating Card Table Rows */
        .table-container {
          overflow-x: auto;
          background: transparent;
          border: none;
          box-shadow: none;
          padding: 0.25rem 0.15rem;
        }

        .modern-table {
          width: 100%;
          border-collapse: separate;
          border-spacing: 0 10px;
          font-size: 0.88rem;
          text-align: left;
        }

        .table-head-row th {
          padding: 0.5rem 1rem;
          font-weight: 700;
          font-size: 0.76rem;
          color: #64748b;
          letter-spacing: 0.05em;
          text-transform: uppercase;
          white-space: nowrap;
          border: none;
          background: transparent;
        }

        .table-row-card {
          transition: transform 0.18s cubic-bezier(0.16, 1, 0.3, 1), box-shadow 0.18s cubic-bezier(0.16, 1, 0.3, 1);
        }

        .table-row-card:hover {
          transform: translateY(-2px);
        }

        .table-row-card td {
          padding: 1.15rem 1rem;
          border-top: 1px solid #e2e8f0;
          border-bottom: 1px solid #e2e8f0;
          vertical-align: middle;
          background: #ffffff;
          box-shadow: 0 2px 8px rgba(15, 23, 42, 0.04);
          transition: background-color 0.18s ease, border-color 0.18s ease, box-shadow 0.18s ease;
        }

        .table-row-card:hover td {
          background: #fafbfc;
          border-top-color: #cbd5e1;
          border-bottom-color: #cbd5e1;
          box-shadow: 0 10px 24px -4px rgba(15, 23, 42, 0.08), 0 4px 6px -2px rgba(15, 23, 42, 0.03);
        }

        .table-row-card td:first-child {
          border-top-left-radius: 14px;
          border-bottom-left-radius: 14px;
          border-left: 4px solid #cbd5e1; /* Neutral default stripe */
        }

        .table-row-card td:last-child {
          border-top-right-radius: 14px;
          border-bottom-right-radius: 14px;
          border-right: 1px solid #e2e8f0;
        }

        /* SLA Breached Row */
        .row-sla-breached td:first-child {
          border-left: 4px solid #dc2626 !important;
        }

        /* High Priority Row */
        .row-high-priority td:first-child {
          border-left: 4px solid #d97706 !important;
        }

        /* Approved Row */
        .row-approved td:first-child {
          border-left: 4px solid #059669 !important;
        }

        /* Rejected Row */
        .row-rejected td:first-child {
          border-left: 4px solid #94a3b8 !important;
        }

        /* Index badge */
        .cell-index {
          text-align: center;
          vertical-align: middle;
        }

        .index-badge {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: 30px;
          height: 30px;
          border-radius: 50%;
          background: #f1f5f9;
          color: #475569;
          font-weight: 700;
          font-size: 0.8rem;
          font-family: var(--font-sans);
          border: 1px solid #e2e8f0;
          box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
        }

        .index-sla {
          background: #fee2e2;
          color: #b91c1c;
          border-color: #fca5a5;
        }

        .index-high {
          background: #fef3c7;
          color: #b45309;
          border-color: #fde68a;
        }

        .applicant-flex {
          display: flex;
          align-items: center;
          gap: 0.85rem;
        }

        .applicant-avatar {
          width: 40px;
          height: 40px;
          border-radius: 12px;
          color: #ffffff;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 700;
          font-size: 1.05rem;
          box-shadow: 0 2px 6px rgba(0, 0, 0, 0.15);
          flex-shrink: 0;
        }

        .applicant-info-block {
          display: flex;
          flex-direction: column;
          gap: 0.15rem;
        }

        .applicant-name-row {
          display: flex;
          align-items: center;
          gap: 0.4rem;
        }

        .applicant-name {
          font-weight: 700;
          font-size: 0.95rem;
          color: #0f172a;
        }

        .applicant-flag-chip {
          font-size: 0.85rem;
        }

        .applicant-relation {
          font-size: 0.78rem;
          color: #64748b;
        }

        .applicant-aadhaar-pill {
          font-size: 0.72rem;
          color: #64748b;
          font-family: var(--font-sans);
          font-weight: 500;
        }

        .location-village {
          font-weight: 700;
          color: #1e293b;
          font-size: 0.88rem;
        }

        .location-tehsil {
          font-size: 0.76rem;
          color: #64748b;
        }

        .age-pill {
          display: inline-block;
          font-weight: 700;
          padding: 0.25rem 0.65rem;
          border-radius: 999px;
          font-size: 0.82rem;
          font-family: var(--font-sans);
        }

        .age-eligible {
          background: #ecfdf5;
          color: #047857;
          border: 1px solid #a7f3d0;
        }

        .age-ineligible {
          background: #fef2f2;
          color: #b91c1c;
          border: 1px solid #fecaca;
        }

        .age-subtext {
          font-size: 0.72rem;
          margin-top: 0.2rem;
          color: #64748b;
          font-weight: 500;
        }

        .income-amount {
          font-weight: 700;
          font-size: 0.92rem;
          color: #0f172a;
          font-family: var(--font-sans);
        }

        .income-ceiling {
          font-size: 0.74rem;
          margin-top: 0.15rem;
        }

        .income-pass {
          color: #059669;
          font-weight: 600;
        }

        .income-fail {
          color: #dc2626;
          font-weight: 600;
        }

        .sla-days-wrap {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.35rem;
          margin-bottom: 0.35rem;
        }

        .sla-days {
          font-size: 0.88rem;
          font-weight: 700;
          font-family: var(--font-sans);
        }

        .sla-text-red {
          color: #dc2626;
        }

        .sla-text-amber {
          color: #d97706;
        }

        .sla-text-normal {
          color: #2563eb;
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
          width: 80px;
          height: 5px;
          background: #e2e8f0;
          border-radius: 999px;
          overflow: hidden;
          margin: 0 auto;
        }

        .sla-progress-fill {
          height: 100%;
          border-radius: 999px;
          transition: width 0.3s ease;
        }

        .fill-red {
          background: #ef4444;
        }

        .fill-amber {
          background: #f59e0b;
        }

        .fill-blue {
          background: #3b82f6;
        }

        .status-pill-badge {
          display: inline-flex;
          align-items: center;
          gap: 0.45rem;
          padding: 0.28rem 0.75rem;
          border-radius: 999px;
          font-size: 0.78rem;
          font-weight: 700;
        }

        .status-dot {
          width: 7px;
          height: 7px;
          border-radius: 50%;
        }

        .priority-high-badge {
          background: #fffbeb;
          color: #b45309;
          border: 1px solid #fde68a;
          border-radius: 6px;
          padding: 0.2rem 0.55rem;
          font-size: 0.74rem;
          font-weight: 700;
        }

        .priority-normal-badge {
          color: #94a3b8;
          font-size: 0.76rem;
        }

        /* Action Button */
        :global(.btn-action-review) {
          background: linear-gradient(135deg, #0f172a 0%, #1e3a8a 100%) !important;
          color: #ffffff !important;
          padding: 0.5rem 0.95rem !important;
          border-radius: 8px !important;
          font-size: 0.82rem !important;
          font-weight: 700 !important;
          text-decoration: none !important;
          display: inline-flex !important;
          align-items: center !important;
          gap: 0.45rem !important;
          transition: all 0.18s ease !important;
          box-shadow: 0 2px 6px rgba(11, 31, 58, 0.25) !important;
          border: 1px solid rgba(255, 255, 255, 0.15) !important;
          white-space: nowrap !important;
        }

        :global(.btn-action-review:hover) {
          transform: translateY(-2px) !important;
          box-shadow: 0 6px 14px rgba(37, 99, 235, 0.35) !important;
          background: linear-gradient(135deg, #1d4ed8 0%, #2563eb 100%) !important;
          color: #ffffff !important;
        }

        .btn-arrow {
          transition: transform 0.18s ease;
        }

        :global(.btn-action-review:hover .btn-arrow) {
          transform: translateX(3px);
        }

        /* Bento Grid Cards */
        .cards-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
          gap: 1.25rem;
        }

        .app-card {
          padding: 1.35rem;
          display: flex;
          flex-direction: column;
          gap: 1.15rem;
          border-radius: 16px;
          background: #ffffff;
        }

        .card-sla-breached {
          border-left: 4px solid #ef4444 !important;
          background: #fffafa;
        }

        .card-top-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
        }

        .card-index-pill {
          font-size: 0.74rem;
          font-weight: 700;
          color: #94a3b8;
          font-family: var(--font-sans);
        }

        .card-badges-flex {
          display: flex;
          align-items: center;
          gap: 0.4rem;
        }

        .card-applicant-row {
          display: flex;
          align-items: center;
          gap: 0.85rem;
        }

        .applicant-avatar-lg {
          width: 48px;
          height: 48px;
          border-radius: 14px;
          color: #ffffff;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 1.3rem;
          font-weight: 700;
          flex-shrink: 0;
          box-shadow: 0 4px 10px rgba(0, 0, 0, 0.15);
        }

        .card-applicant-name {
          font-size: 1.05rem;
          font-weight: 700;
          color: #0f172a;
        }

        .card-applicant-sub {
          font-size: 0.8rem;
          color: #64748b;
        }

        .card-applicant-aadhaar {
          font-size: 0.74rem;
          color: #64748b;
          font-family: var(--font-sans);
        }

        .card-meta-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 0.65rem;
          background: #f8fafc;
          border: 1px solid #edf2f7;
          border-radius: 12px;
          padding: 0.85rem;
        }

        .meta-box {
          display: flex;
          flex-direction: column;
          gap: 0.15rem;
        }

        .meta-label {
          font-size: 0.72rem;
          color: #64748b;
          font-weight: 600;
        }

        .meta-val {
          font-size: 0.86rem;
          font-weight: 700;
          color: #0f172a;
        }

        .age-eligible-text {
          color: #059669;
        }

        .age-ineligible-text {
          color: #dc2626;
        }

        .card-flag-note {
          background: #fffbeb;
          border: 1px solid #fde68a;
          color: #92400e;
          font-size: 0.76rem;
          padding: 0.4rem 0.65rem;
          border-radius: 8px;
          font-weight: 500;
        }

        .card-footer-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          border-top: 1px solid #f1f5f9;
          padding-top: 0.85rem;
        }

        .docs-count {
          font-size: 0.78rem;
          color: #64748b;
          font-weight: 600;
        }

        /* Empty State */
        .empty-results-card {
          text-align: center;
          padding: 3.5rem 2rem;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 0.85rem;
        }

        .empty-icon {
          font-size: 3rem;
          opacity: 0.6;
        }

        .empty-title {
          font-size: 1.25rem;
          font-weight: 700;
          color: #0f172a;
        }

        .empty-desc {
          color: #64748b;
          font-size: 0.9rem;
          max-width: 440px;
        }

        .btn-reset-filters {
          background: #0b1f3a;
          color: white;
          border: none;
          padding: 0.6rem 1.25rem;
          border-radius: 10px;
          font-size: 0.85rem;
          font-weight: 600;
          cursor: pointer;
          margin-top: 0.5rem;
        }
      `}</style>
    </div>
  );
}

function KpiCard({
  label,
  value,
  icon,
  subtext,
  color,
  accentColor,
  active,
  onClick,
  glowRed,
}: {
  label: string;
  value: number;
  icon: React.ReactNode;
  subtext?: string;
  color: string;
  accentColor: string;
  active?: boolean;
  onClick?: () => void;
  glowRed?: boolean;
}) {
  const { language } = useLanguage();

  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        background: active ? "#ffffff" : "rgba(255, 255, 255, 0.9)",
        borderTop: `3.5px solid ${accentColor}`,
        borderRight: `1.5px solid ${active ? accentColor : "#e2e8f0"}`,
        borderBottom: `1.5px solid ${active ? accentColor : "#e2e8f0"}`,
        borderLeft: `1.5px solid ${active ? accentColor : "#e2e8f0"}`,
        borderRadius: "16px",
        padding: "1.15rem 1rem",
        display: "flex",
        flexDirection: "column",
        gap: "0.45rem",
        boxShadow: glowRed
          ? "0 0 20px -2px rgba(239, 68, 68, 0.35)"
          : active
          ? `0 10px 24px -4px rgba(15, 23, 42, 0.12), 0 0 0 1px ${accentColor}`
          : "var(--shadow-sm)",
        cursor: "pointer",
        textAlign: "left",
        transition: "all 0.2s cubic-bezier(0.16, 1, 0.3, 1)",
        transform: active ? "translateY(-3px)" : "none",
        position: "relative",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", width: "100%" }}>
        <span
          style={{
            fontSize: "1.25rem",
            width: "36px",
            height: "36px",
            borderRadius: "10px",
            background: `${accentColor}15`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          {icon}
        </span>
        {active && (
          <span
            style={{
              fontSize: "0.68rem",
              fontWeight: 700,
              color: accentColor,
              background: `${accentColor}18`,
              padding: "0.15rem 0.5rem",
              borderRadius: "999px",
            }}
          >
            {language === "hi" ? "सक्रिय" : "Active"}
          </span>
        )}
      </div>

      <div
        style={{
          fontSize: "2rem",
          fontWeight: 800,
          color,
          lineHeight: 1.1,
          fontFamily: "var(--font-sans)",
          marginTop: "0.2rem",
        }}
      >
        {value}
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: "0.15rem" }}>
        <div
          style={{
            fontSize: "0.86rem",
            fontWeight: 700,
            color: "#1e293b",
          }}
        >
          {label}
        </div>
        {subtext && (
          <div
            style={{
              fontSize: "0.72rem",
              color: "#64748b",
              fontWeight: 500,
            }}
          >
            {subtext}
          </div>
        )}
      </div>
    </button>
  );
}
