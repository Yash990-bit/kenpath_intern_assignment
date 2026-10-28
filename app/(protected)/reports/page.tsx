import { prisma } from "@/lib/db";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { computeReportMetrics, ReportLog } from "@/lib/reports";
import ReportsClient from "./ReportsClient";

export const instant = false;

export default async function ReportsPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const [applications, rawLogs] = await Promise.all([
    prisma.application.findMany({
      select: { id: true, status: true, submittedAt: true },
    }),
    prisma.auditLog.findMany({
      include: {
        officer: { select: { name: true } },
        application: { select: { applicantName: true } },
      },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  const logs: ReportLog[] = rawLogs.map((log) => ({
    id: log.id,
    applicationId: log.applicationId,
    applicantName: log.application.applicantName,
    officerName: log.officer.name,
    action: log.action,
    aiSuggested: log.aiSuggested,
    finalDecision: log.finalDecision,
    overridden: log.overridden,
    reason: log.reason,
    createdAt: log.createdAt,
  }));

  const metrics = computeReportMetrics(applications, logs);

  return <ReportsClient metrics={metrics} logs={logs} />;
}
