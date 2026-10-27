"use server";

import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { analyzeWithRules } from "@/lib/ai";
import { ApplicationStatus } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { z } from "zod";

export type DecisionType = "APPROVE" | "REJECT" | "RETURN";

const decisionEnumSchema = z.enum(["APPROVE", "REJECT", "RETURN"]);

const ACTION_HINDI_MAP: Record<
  DecisionType,
  { status: ApplicationStatus; label: string }
> = {
  APPROVE: { status: "APPROVED", label: "स्वीकृत" },
  REJECT: { status: "REJECTED", label: "अस्वीकृत" },
  RETURN: { status: "RETURNED", label: "वापस" },
};

export async function submitDecision({
  applicationId,
  decision,
  reason,
}: {
  applicationId: string;
  decision: DecisionType;
  reason: string;
  aiSuggested?: string;
}): Promise<{ success: boolean; error?: string }> {
  try {
    // 1. Verify session with auth()
    const session = await auth();
    if (!session?.user?.id) {
      return {
        success: false,
        error: "सत्र समाप्त हो गया है। कृपया पुनः लॉगिन करें।",
      };
    }
    const officerId = session.user.id;

    // 2. Validate decision value with Zod
    const decisionParse = decisionEnumSchema.safeParse(decision);
    if (!decisionParse.success) {
      return {
        success: false,
        error: "अवैध निर्णय प्रकार (केवल स्वीकृत, अस्वीकृत या वापस मान्य है)।",
      };
    }
    const validatedDecision = decisionParse.data;

    // 3. Require reason of at least 10 characters (trimmed)
    const trimmedReason = reason?.trim();
    if (!trimmedReason || trimmedReason.length < 10) {
      return {
        success: false,
        error:
          "निर्णय हेतु कारण दर्ज करना अनिवार्य है (कम से कम 10 अक्षर आवश्यक हैं)।",
      };
    }

    const mapping = ACTION_HINDI_MAP[validatedDecision];

    // 4. Status check, status update, and audit log creation inside ONE prisma transaction
    await prisma.$transaction(async (tx) => {
      // Check current status inside transaction to prevent race conditions & double submits
      const current = await tx.application.findUnique({
        where: { id: applicationId },
      });

      if (!current) {
        throw new Error("आवेदन नहीं मिला।");
      }

      if (current.status !== "PENDING") {
        throw new Error(
          "इस आवेदन पर निर्णय पहले ही दर्ज किया जा चुका है। दोहरा निर्णय मान्य नहीं है।"
        );
      }

      // Item 7: Derive aiSuggested server-side (cached Gemini analysis if present, else analyzeWithRules)
      let serverAiSuggested: string | null = null;
      if (
        current.aiAnalysis &&
        typeof current.aiAnalysis === "object" &&
        "suggestedDecision" in current.aiAnalysis
      ) {
        serverAiSuggested = (
          current.aiAnalysis as { suggestedDecision: string }
        ).suggestedDecision;
      } else {
        const baseline = await analyzeWithRules(current, {
          checkDbDuplicates: false,
        });
        serverAiSuggested = baseline.suggestedDecision;
      }

      const overridden = Boolean(
        serverAiSuggested && serverAiSuggested !== validatedDecision
      );

      // Update application status
      await tx.application.update({
        where: { id: applicationId },
        data: {
          status: mapping.status,
        },
      });

      // Insert append-only audit log entry
      await tx.auditLog.create({
        data: {
          applicationId,
          officerId,
          action: mapping.label,
          aiSuggested: serverAiSuggested,
          finalDecision: validatedDecision,
          overridden,
          reason: trimmedReason,
        },
      });
    });

    // Revalidate paths so dashboard counters and application views reflect changes immediately
    revalidatePath(`/applications/${applicationId}`);
    revalidatePath("/dashboard");

    return { success: true };
  } catch (error: unknown) {
    const msg =
      error instanceof Error
        ? error.message
        : "सर्वर त्रुटि: निर्णय सहेजने में विफल।";
    return {
      success: false,
      error: msg,
    };
  }
}
