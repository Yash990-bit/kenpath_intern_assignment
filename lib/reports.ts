/**
 * reports.ts
 * ────────────────────────────────────────────────────────────────────────────
 * Accountability metrics computed from the append-only audit trail.
 * Pure functions (no DB access) so they are unit-testable and so the
 * Reports page shows exactly what the audit log records — nothing inferred.
 * ────────────────────────────────────────────────────────────────────────────
 */

import { SLA_BREACH_DAYS, isSlaBreached } from "./eligibility";

export type Decision = "APPROVE" | "REJECT" | "RETURN";
export const DECISIONS: Decision[] = ["APPROVE", "REJECT", "RETURN"];

export interface ReportApplication {
  id: string;
  status: string;
  submittedAt: Date;
}

export interface ReportLog {
  id: string;
  applicationId: string;
  applicantName: string;
  officerName: string;
  action: string;
  aiSuggested: string | null;
  finalDecision: string | null;
  overridden: boolean;
  reason: string | null;
  createdAt: Date;
}

export interface ReportMetrics {
  totalApplications: number;
  pendingCount: number;
  pendingSlaBreached: number;
  decisionCount: number;
  decisionsByType: Record<Decision, number>;
  /** Decisions where the officer chose the same action the AI suggested (0–1), null if no comparable decisions */
  aiAgreementRate: number | null;
  overrideCount: number;
  /** matrix[aiSuggested][finalDecision] = count */
  agreementMatrix: Record<Decision, Record<Decision, number>>;
  /** Mean days from submission to first decision, null if no decisions */
  avgDaysToDecision: number | null;
  /** Share of decisions recorded within the SLA window (0–1), null if no decisions */
  slaComplianceRate: number | null;
}

function isDecision(v: string | null): v is Decision {
  return v === "APPROVE" || v === "REJECT" || v === "RETURN";
}

function emptyMatrix(): Record<Decision, Record<Decision, number>> {
  return {
    APPROVE: { APPROVE: 0, REJECT: 0, RETURN: 0 },
    REJECT: { APPROVE: 0, REJECT: 0, RETURN: 0 },
    RETURN: { APPROVE: 0, REJECT: 0, RETURN: 0 },
  };
}

export function computeReportMetrics(
  applications: ReportApplication[],
  logs: ReportLog[],
  referenceDate: Date = new Date()
): ReportMetrics {
  const submittedById = new Map(applications.map((a) => [a.id, new Date(a.submittedAt)]));

  const decisionsByType: Record<Decision, number> = { APPROVE: 0, REJECT: 0, RETURN: 0 };
  const agreementMatrix = emptyMatrix();
  let comparable = 0;
  let agreed = 0;
  let overrideCount = 0;

  // First decision per application (logs may arrive in any order)
  const firstDecisionAt = new Map<string, Date>();

  for (const log of logs) {
    if (!isDecision(log.finalDecision)) continue; // registrations & views are not decisions

    decisionsByType[log.finalDecision]++;
    if (log.overridden) overrideCount++;

    if (isDecision(log.aiSuggested)) {
      comparable++;
      agreementMatrix[log.aiSuggested][log.finalDecision]++;
      if (log.aiSuggested === log.finalDecision) agreed++;
    }

    const at = new Date(log.createdAt);
    const prev = firstDecisionAt.get(log.applicationId);
    if (!prev || at < prev) firstDecisionAt.set(log.applicationId, at);
  }

  let totalDays = 0;
  let withinSla = 0;
  let timed = 0;
  for (const [appId, decidedAt] of firstDecisionAt) {
    const submittedAt = submittedById.get(appId);
    if (!submittedAt) continue;
    const days = Math.max(0, (decidedAt.getTime() - submittedAt.getTime()) / 86_400_000);
    totalDays += days;
    if (days < SLA_BREACH_DAYS) withinSla++;
    timed++;
  }

  const pending = applications.filter((a) => a.status === "PENDING");

  return {
    totalApplications: applications.length,
    pendingCount: pending.length,
    pendingSlaBreached: pending.filter((a) =>
      isSlaBreached(a.submittedAt, a.status, referenceDate)
    ).length,
    decisionCount: DECISIONS.reduce((sum, d) => sum + decisionsByType[d], 0),
    decisionsByType,
    aiAgreementRate: comparable > 0 ? agreed / comparable : null,
    overrideCount,
    agreementMatrix,
    avgDaysToDecision: timed > 0 ? totalDays / timed : null,
    slaComplianceRate: timed > 0 ? withinSla / timed : null,
  };
}

/** RFC 4180 CSV with a UTF-8 BOM so Excel renders Devanagari correctly. */
export function auditLogsToCsv(logs: ReportLog[]): string {
  const header = [
    "Timestamp",
    "Application ID",
    "Applicant",
    "Officer",
    "Action",
    "AI Suggested",
    "Final Decision",
    "Overridden AI",
    "Reason",
  ];
  const escape = (v: string) => (/[",\r\n]/.test(v) ? `"${v.replace(/"/g, '""')}"` : v);
  const rows = logs.map((l) =>
    [
      new Date(l.createdAt).toISOString(),
      l.applicationId,
      l.applicantName,
      l.officerName,
      l.action,
      l.aiSuggested ?? "",
      l.finalDecision ?? "",
      l.finalDecision ? (l.overridden ? "YES" : "NO") : "",
      l.reason ?? "",
    ]
      .map(escape)
      .join(",")
  );
  return "﻿" + [header.join(","), ...rows].join("\r\n");
}
