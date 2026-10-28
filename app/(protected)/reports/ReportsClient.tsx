"use client";

import Link from "next/link";
import { SLA_BREACH_DAYS } from "@/lib/eligibility";
import { auditLogsToCsv, Decision, DECISIONS, ReportLog, ReportMetrics } from "@/lib/reports";
import { useLanguage } from "@/lib/i18n/LanguageContext";
import Icon, { type IconName } from "@/components/Icon";

const RECENT_ACTIVITY_LIMIT = 15;

// Status palette shared with the dashboard pills (approved / rejected / returned)
const DECISION_STYLES: Record<Decision, { fill: string; icon: IconName }> = {
  APPROVE: { fill: "#059669", icon: "check" },
  REJECT: { fill: "#dc2626", icon: "x" },
  RETURN: { fill: "#d97706", icon: "rotateCcw" },
};

export default function ReportsClient({
  metrics,
  logs,
}: {
  metrics: ReportMetrics;
  logs: ReportLog[];
}) {
  const { language, t, interpolate } = useLanguage();
  const locale = language === "hi" ? "hi-IN" : "en-IN";

  const decisionLabel: Record<Decision, string> = {
    APPROVE: t.reports.decisionApprove,
    REJECT: t.reports.decisionReject,
    RETURN: t.reports.decisionReturn,
  };

  const actionLabel = (action: string) => {
    if (action === "स्वीकृत") return t.common.statusApproved;
    if (action === "अस्वीकृत") return t.common.statusRejected;
    if (action === "वापस") return t.common.statusReturned;
    if (action === "पंजीकृत") return t.detail.auditActionRegistered;
    return action;
  };

  const pct = (v: number | null) => (v === null ? "—" : `${Math.round(v * 100)}%`);

  function handleExport() {
    const blob = new Blob([auditLogsToCsv(logs)], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `audit-trail-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  const maxMatrixCell = Math.max(
    1,
    ...DECISIONS.flatMap((ai) => DECISIONS.map((o) => metrics.agreementMatrix[ai][o]))
  );

  const kpis = [
    {
      label: t.reports.kpiDecisions,
      value: metrics.decisionCount.toLocaleString(locale),
      sub: interpolate(t.reports.kpiDecisionsSub, { pending: metrics.pendingCount }),
      icon: "checkSquare" as IconName,
    },
    {
      label: t.reports.kpiAgreement,
      value: pct(metrics.aiAgreementRate),
      sub:
        metrics.aiAgreementRate === null
          ? t.reports.kpiNoData
          : interpolate(t.reports.kpiAgreementSub, { count: metrics.overrideCount }),
      icon: "scale" as IconName,
    },
    {
      label: t.reports.kpiAvgDays,
      value:
        metrics.avgDaysToDecision === null
          ? "—"
          : `${metrics.avgDaysToDecision.toLocaleString(locale, { maximumFractionDigits: 1 })} ${t.reports.daysUnit}`,
      sub: metrics.avgDaysToDecision === null ? t.reports.kpiNoData : t.reports.kpiAvgDaysSub,
      icon: "clock" as IconName,
    },
    {
      label: t.reports.kpiSla,
      value: pct(metrics.slaComplianceRate),
      sub:
        metrics.slaComplianceRate === null
          ? t.reports.kpiNoData
          : interpolate(t.reports.kpiSlaSub, { days: SLA_BREACH_DAYS }),
      icon: "target" as IconName,
    },
  ];

  const recent = logs.slice(0, RECENT_ACTIVITY_LIMIT);

  return (
    <div
      className="reports-page"
      style={{ fontFamily: language === "hi" ? "var(--font-devanagari)" : "var(--font-sans)" }}
    >
      {/* ─── Page Header ─────────────────────────────────────────────────── */}
      <div className="reports-head">
        <div>
          <Link href="/dashboard" className="reports-back">
            <Icon name="arrowLeft" size={14} /> {t.common.back}
          </Link>
          <span className="reports-badge"><Icon name="barChart" size={13} /> {t.reports.pageBadge}</span>
          <h1 className="reports-title">{t.reports.pageTitle}</h1>
          <p className="reports-sub">{t.reports.pageSub}</p>
        </div>
        <button type="button" onClick={handleExport} className="reports-export" disabled={logs.length === 0}>
          <Icon name="download" size={16} /> {t.reports.exportCsv}
        </button>
      </div>

      {/* ─── KPI Tiles ───────────────────────────────────────────────────── */}
      <div className="reports-kpis">
        {kpis.map((k) => (
          <div key={k.label} className="executive-card reports-kpi">
            <div className="reports-kpi-label">
              <Icon name={k.icon} size={15} /> {k.label}
            </div>
            <div className="reports-kpi-value">{k.value}</div>
            <div className="reports-kpi-sub">{k.sub}</div>
          </div>
        ))}
      </div>

      <div className="reports-grid">
        {/* ─── Decision Outcomes ─────────────────────────────────────────── */}
        <section className="executive-card reports-card">
          <h2 className="reports-card-title">{t.reports.outcomesTitle}</h2>
          <p className="reports-card-sub">{t.reports.outcomesSub}</p>

          {metrics.decisionCount === 0 ? (
            <p className="reports-empty">{t.reports.kpiNoData}</p>
          ) : (
            <>
              <div className="outcome-bar" role="img" aria-label={t.reports.outcomesTitle}>
                {DECISIONS.filter((d) => metrics.decisionsByType[d] > 0).map((d) => (
                  <div
                    key={d}
                    className="outcome-seg"
                    title={`${decisionLabel[d]}: ${metrics.decisionsByType[d]}`}
                    style={{
                      flexGrow: metrics.decisionsByType[d],
                      background: DECISION_STYLES[d].fill,
                    }}
                  />
                ))}
              </div>
              <ul className="outcome-legend">
                {DECISIONS.map((d) => {
                  const n = metrics.decisionsByType[d];
                  return (
                    <li key={d}>
                      <span className="outcome-swatch" style={{ background: DECISION_STYLES[d].fill }}>
                        <Icon name={DECISION_STYLES[d].icon} size={12} strokeWidth={3} />
                      </span>
                      <span className="outcome-name">{decisionLabel[d]}</span>
                      <span className="outcome-count">
                        {n} <span className="outcome-pct">({pct(n / metrics.decisionCount)})</span>
                      </span>
                    </li>
                  );
                })}
              </ul>
            </>
          )}
        </section>

        {/* ─── AI vs Officer Matrix ──────────────────────────────────────── */}
        <section className="executive-card reports-card">
          <h2 className="reports-card-title">{t.reports.matrixTitle}</h2>
          <p className="reports-card-sub">{t.reports.matrixSub}</p>

          <div className="matrix-scroll">
            <table className="matrix">
              <thead>
                <tr>
                  <th scope="col" className="matrix-corner">{t.reports.matrixRowHeader}</th>
                  {DECISIONS.map((o) => (
                    <th key={o} scope="col">{decisionLabel[o]}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {DECISIONS.map((ai) => (
                  <tr key={ai}>
                    <th scope="row">{decisionLabel[ai]}</th>
                    {DECISIONS.map((o) => {
                      const n = metrics.agreementMatrix[ai][o];
                      const agree = ai === o;
                      // Single-hue sequential shading: indigo for agreement, amber for overrides
                      const alpha = n === 0 ? 0 : 0.12 + 0.5 * (n / maxMatrixCell);
                      return (
                        <td
                          key={o}
                          title={interpolate(t.reports.matrixCellTitle, {
                            ai: decisionLabel[ai],
                            officer: decisionLabel[o],
                            count: n,
                          })}
                          className={agree ? "matrix-agree" : "matrix-override"}
                          style={{
                            background: agree
                              ? `rgba(99, 102, 241, ${alpha})`
                              : `rgba(245, 158, 11, ${alpha})`,
                          }}
                        >
                          {n}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </div>

      {/* ─── Recent Activity ─────────────────────────────────────────────── */}
      <section className="executive-card reports-card">
        <h2 className="reports-card-title">{t.reports.activityTitle}</h2>
        <p className="reports-card-sub">{t.reports.activitySub}</p>

        {recent.length === 0 ? (
          <p className="reports-empty">{t.reports.emptyActivity}</p>
        ) : (
          <div className="activity-scroll">
            <table className="activity">
              <thead>
                <tr>
                  <th scope="col">{t.reports.thTime}</th>
                  <th scope="col">{t.reports.thApplicant}</th>
                  <th scope="col">{t.reports.thOfficer}</th>
                  <th scope="col">{t.reports.thAction}</th>
                  <th scope="col">{t.reports.thAi}</th>
                </tr>
              </thead>
              <tbody>
                {recent.map((log) => (
                  <tr key={log.id}>
                    <td className="activity-time">
                      {new Date(log.createdAt).toLocaleString(locale, {
                        day: "2-digit",
                        month: "short",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </td>
                    <td>
                      <Link href={`/applications/${log.applicationId}`} className="activity-link">
                        {log.applicantName}
                      </Link>
                    </td>
                    <td>{log.officerName}</td>
                    <td>
                      <span className="activity-action">{actionLabel(log.action)}</span>
                      {log.overridden && <span className="activity-override"><Icon name="alertTriangle" size={11} /> {t.reports.overriddenTag}</span>}
                    </td>
                    <td>
                      {log.aiSuggested && (log.aiSuggested as Decision) in decisionLabel
                        ? decisionLabel[log.aiSuggested as Decision]
                        : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <style jsx>{`
        .reports-page {
          display: flex;
          flex-direction: column;
          gap: 1.5rem;
        }

        .reports-head {
          display: flex;
          justify-content: space-between;
          align-items: flex-end;
          gap: 1rem;
          flex-wrap: wrap;
        }

        .reports-head :global(.reports-back) {
          display: block;
          font-size: 0.82rem;
          color: var(--clr-text-secondary);
          text-decoration: none;
          font-weight: 600;
          margin-bottom: 0.9rem;
        }

        .reports-badge {
          display: inline-block;
          font-size: 0.72rem;
          font-weight: 700;
          color: var(--clr-ai-deep);
          background: var(--clr-ai-light);
          border: 1px solid var(--clr-ai-border);
          border-radius: 999px;
          padding: 0.2rem 0.7rem;
          margin-bottom: 0.6rem;
        }

        .reports-title {
          font-size: 1.6rem;
          font-weight: 800;
          color: var(--clr-navy);
          letter-spacing: -0.01em;
        }

        .reports-sub {
          margin-top: 0.4rem;
          color: var(--clr-text-secondary);
          font-size: 0.9rem;
          max-width: 720px;
        }

        .reports-export {
          padding: 0.65rem 1.1rem;
          border-radius: 10px;
          border: none;
          background: linear-gradient(135deg, var(--clr-navy-mid) 0%, var(--clr-navy-hover) 100%);
          color: #fff;
          font-weight: 700;
          font-size: 0.88rem;
          cursor: pointer;
          font-family: inherit;
          box-shadow: var(--shadow-elevated);
        }

        .reports-export:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .reports-kpis {
          display: grid;
          grid-template-columns: repeat(4, minmax(0, 1fr));
          gap: 1rem;
        }

        .reports-kpi {
          padding: 1.15rem 1.25rem;
          border-radius: 14px;
        }

        .reports-kpi-label {
          font-size: 0.8rem;
          font-weight: 600;
          color: var(--clr-text-secondary);
        }

        .reports-kpi-value {
          font-size: 1.9rem;
          font-weight: 800;
          color: var(--clr-navy);
          margin: 0.35rem 0 0.2rem;
          font-variant-numeric: tabular-nums;
        }

        .reports-kpi-sub {
          font-size: 0.74rem;
          color: var(--clr-text-muted);
        }

        .reports-grid {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 1.5rem;
        }

        .reports-card {
          padding: 1.4rem 1.5rem;
          border-radius: 14px;
          min-width: 0;
        }

        .reports-card-title {
          font-size: 1rem;
          font-weight: 700;
          color: var(--clr-navy);
        }

        .reports-card-sub {
          font-size: 0.76rem;
          color: var(--clr-text-muted);
          margin: 0.2rem 0 1.1rem;
        }

        .reports-empty {
          font-size: 0.85rem;
          color: var(--clr-text-muted);
          padding: 1.5rem 0;
          text-align: center;
        }

        .outcome-bar {
          display: flex;
          gap: 2px;
          height: 18px;
          border-radius: 4px;
          overflow: hidden;
          background: var(--clr-surface-muted);
        }

        .outcome-seg {
          min-width: 6px;
        }

        .outcome-legend {
          list-style: none;
          margin-top: 1.1rem;
          display: flex;
          flex-direction: column;
          gap: 0.6rem;
        }

        .outcome-legend li {
          display: flex;
          align-items: center;
          gap: 0.6rem;
          font-size: 0.86rem;
        }

        .outcome-swatch {
          width: 20px;
          height: 20px;
          border-radius: 6px;
          color: #fff;
          font-size: 0.7rem;
          font-weight: 700;
          display: inline-flex;
          align-items: center;
          justify-content: center;
        }

        .outcome-name {
          flex: 1;
          font-weight: 600;
          color: var(--clr-text);
        }

        .outcome-count {
          font-weight: 700;
          color: var(--clr-text);
          font-variant-numeric: tabular-nums;
        }

        .outcome-pct {
          font-weight: 500;
          color: var(--clr-text-muted);
        }

        .matrix-scroll,
        .activity-scroll {
          overflow-x: auto;
        }

        .matrix {
          width: 100%;
          border-collapse: separate;
          border-spacing: 4px;
          font-size: 0.82rem;
        }

        .matrix th {
          font-weight: 600;
          color: var(--clr-text-secondary);
          padding: 0.4rem;
          text-align: center;
        }

        .matrix th[scope="row"] {
          text-align: left;
        }

        .matrix-corner {
          font-size: 0.7rem;
          color: var(--clr-text-muted) !important;
          text-align: left !important;
        }

        .matrix td {
          text-align: center;
          padding: 0.75rem 0.4rem;
          border-radius: 8px;
          font-weight: 700;
          font-size: 1rem;
          color: var(--clr-text);
          border: 1px solid var(--clr-border-subtle);
          font-variant-numeric: tabular-nums;
        }

        .activity {
          width: 100%;
          border-collapse: collapse;
          font-size: 0.84rem;
        }

        .activity th {
          text-align: left;
          font-size: 0.74rem;
          font-weight: 600;
          color: var(--clr-text-muted);
          padding: 0.5rem 0.6rem;
          border-bottom: 1px solid var(--clr-border);
          white-space: nowrap;
        }

        .activity td {
          padding: 0.7rem 0.6rem;
          border-bottom: 1px solid var(--clr-border-subtle);
          color: var(--clr-text);
          vertical-align: middle;
        }

        .activity-time {
          white-space: nowrap;
          color: var(--clr-text-secondary) !important;
          font-variant-numeric: tabular-nums;
        }

        .activity :global(.activity-link) {
          color: var(--clr-navy);
          font-weight: 600;
          text-decoration: none;
        }

        .activity :global(.activity-link:hover) {
          text-decoration: underline;
        }

        .activity-action {
          font-weight: 600;
        }

        .activity-override {
          margin-left: 0.5rem;
          font-size: 0.7rem;
          font-weight: 700;
          color: var(--clr-amber-hover);
          background: var(--clr-amber-light);
          border: 1px solid var(--clr-amber-border);
          border-radius: 999px;
          padding: 0.1rem 0.5rem;
          white-space: nowrap;
        }

        @media (max-width: 1024px) {
          .reports-kpis {
            grid-template-columns: repeat(2, minmax(0, 1fr));
          }

          .reports-grid {
            grid-template-columns: minmax(0, 1fr);
          }
        }

        @media (max-width: 480px) {
          .reports-kpis {
            gap: 0.75rem;
          }

          .reports-kpi-value {
            font-size: 1.5rem;
          }
        }
      `}</style>
    </div>
  );
}
