import { ApplicationStatus, Priority } from "@prisma/client";
import { SLA_BREACH_DAYS } from "./eligibility";

/**
 * Calculates an urgency score for triage sorting.
 * Higher score = higher priority in the queue.
 *
 * Sorting order:
 * 1. SLA Breach (days >= 30) -> Score >= 10,000
 * 2. Flagged / High Priority cases -> Score >= 1,000
 * 3. Oldest pending cases (days) -> Score = days
 * 4. Non-pending cases (APPROVED, REJECTED, RETURNED) -> Score = -1
 */
export function calculateUrgencyScore(
  submittedAt: Date,
  priority: Priority | string,
  status: ApplicationStatus | string,
  nowMs: number = Date.now()
): number {
  if (status !== "PENDING") return -1;

  const daysPending = Math.floor(
    (nowMs - new Date(submittedAt).getTime()) / 86_400_000
  );
  let score = Math.max(0, daysPending);

  if (priority === "HIGH") {
    score += 1000;
  }

  if (daysPending >= SLA_BREACH_DAYS) {
    score += 10000;
  }

  return score;
}
