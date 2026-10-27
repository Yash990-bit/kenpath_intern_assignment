import { prisma } from "@/lib/db";
import { auth } from "@/auth";
import { redirect, notFound } from "next/navigation";
import { getOrComputeAnalysis } from "@/lib/ai";
import ApplicationDetailClient from "./ApplicationDetailClient";

export const instant = false;

export default async function ApplicationDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const { id } = await params;

  const app = await prisma.application.findUnique({
    where: { id },
    include: {
      auditLogs: {
        include: {
          officer: {
            select: { name: true, designation: true },
          },
        },
        orderBy: { createdAt: "desc" },
      },
    },
  });

  if (!app) notFound();

  // Read cached analysis or compute once if missing
  const initialAnalysis = await getOrComputeAnalysis(app.id);

  return (
    <ApplicationDetailClient
      application={app as never}
      initialAnalysis={initialAnalysis}
      officerName={session.user.name || "अधिकारी"}
    />
  );
}
