/**
 * intake.ts
 * ────────────────────────────────────────────────────────────────────────────
 * Shared validation schema for registering a new Old-Age Pension application.
 * Used by the intake form (instant field feedback) and by the server action
 * (authoritative re-validation). Only the last 4 digits of Aadhaar and bank
 * account are ever collected — full identifiers are never stored.
 * ────────────────────────────────────────────────────────────────────────────
 */

import { z } from "zod";
import { REQUIRED_DOCUMENTS } from "@/lib/eligibility";

export const IFSC_PATTERN = /^[A-Z]{4}0[A-Z0-9]{6}$/;

export const intakeSchema = z
  .object({
    applicantName: z.string().trim().min(2).max(100),
    fatherHusbandName: z.string().trim().min(2).max(100),
    dob: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/)
      .refine((v) => {
        const d = new Date(v);
        return !isNaN(d.getTime()) && d < new Date() && d.getFullYear() >= 1900;
      }),
    village: z.string().trim().min(2).max(100),
    tehsil: z.string().trim().min(2).max(100),
    district: z.string().trim().min(2).max(100),
    aadhaarLast4: z.string().regex(/^\d{4}$/),
    bankAccountHolder: z.string().trim().min(2).max(100),
    bankIFSC: z
      .string()
      .trim()
      .transform((v) => v.toUpperCase())
      .pipe(z.string().regex(IFSC_PATTERN)),
    bankAccountLast4: z.string().regex(/^\d{4}$/),
    annualIncome: z
      .string()
      .regex(/^\d{1,9}$/)
      .transform(Number),
    documentsSubmitted: z.array(z.enum(REQUIRED_DOCUMENTS as [string, ...string[]])),
    priority: z.enum(["HIGH", "NORMAL"]),
    flagNote: z.string().trim().max(200).optional(),
  })
  .refine((d) => d.priority !== "HIGH" || (d.flagNote?.length ?? 0) >= 5, {
    path: ["flagNote"],
  });

export type IntakeInput = z.input<typeof intakeSchema>;
export type IntakeField = keyof IntakeInput;

/** Returns the set of fields that fail validation (first issue per field). */
export function getIntakeFieldErrors(input: IntakeInput): Partial<Record<IntakeField, true>> {
  const result = intakeSchema.safeParse(input);
  if (result.success) return {};
  const errors: Partial<Record<IntakeField, true>> = {};
  for (const issue of result.error.issues) {
    const field = issue.path[0] as IntakeField | undefined;
    if (field) errors[field] = true;
  }
  return errors;
}
