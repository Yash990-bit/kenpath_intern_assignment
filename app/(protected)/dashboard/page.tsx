import { prisma } from "@/lib/db";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import DashboardClient, { DashboardAppItem } from "./DashboardClient";

export const instant = false;

export default async function DashboardPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const officerName = session.user.name || "अधिकारी";
  const officerDesignation =
    (session.user as { designation?: string }).designation || "तहसीलदार";

  // Fetch all applications with audit log counts
  const rawApplications = await prisma.application.findMany({
    include: { _count: { select: { auditLogs: true } } },
    orderBy: { submittedAt: "asc" },
  });

  const applications: DashboardAppItem[] = rawApplications.map((app) => ({
    ...app,
    _count: {
      auditLogs: app._count.auditLogs,
    },
  }));

  return (
    <DashboardClient
      applications={applications}
      officerName={officerName}
      officerDesignation={officerDesignation}
    />
  );
}
