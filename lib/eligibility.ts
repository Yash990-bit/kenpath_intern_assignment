/**
 * eligibility.ts
 * ────────────────────────────────────────────────────────────────────────────
 * SINGLE SOURCE OF TRUTH for Old-Age Pension eligibility rules.
 *
 * NOTE: ALL ELIGIBILITY VALUES IN THIS FILE ARE ILLUSTRATIVE SAMPLE VALUES
 * (for hiring assignment purposes). If state policy thresholds change, updating
 * them here updates all checks across the entire system.
 * ────────────────────────────────────────────────────────────────────────────
 */

// Illustrative sample value: Minimum age threshold in years (must be >= MIN_AGE_YEARS)
export const MIN_AGE_YEARS = 60;

// Illustrative sample value: Annual household income ceiling in INR (must be <= MAX_ANNUAL_INCOME_INR)
export const MAX_ANNUAL_INCOME_INR = 200_000; // ₹2,00,000

// Illustrative sample value: SLA breach threshold in days (pending >= SLA_BREACH_DAYS is an SLA breach)
export const SLA_BREACH_DAYS = 30;
export const SLA_BREACH_LABEL = `≥ ${SLA_BREACH_DAYS} दिन`;
export const SLA_BREACH_TEXT = `${SLA_BREACH_DAYS} दिन या अधिक`;

// Illustrative sample value: 6 mandatory documents required for Haryana Vridha Pension
export const REQUIRED_DOCUMENTS: string[] = [
  "आयु प्रमाण पत्र",       // Age certificate
  "आय प्रमाण पत्र",        // Income certificate
  "आधार कार्ड",             // Aadhaar card
  "बैंक पासबुक",            // Bank passbook
  "निवास प्रमाण पत्र",     // Residence certificate
  "पासपोर्ट साइज फोटो",    // Passport-size photograph
];

/**
 * Single unified SLA check used everywhere (Dashboard, AI engine, Client UI).
 * Returns true if the application has been pending for at least SLA_BREACH_DAYS.
 */
export function isSlaBreached(
  submittedAt: Date,
  status: string,
  referenceDate: Date = new Date()
): boolean {
  if (status !== "PENDING") return false;
  const refTime = new Date(referenceDate).getTime();
  const subTime = new Date(submittedAt).getTime();
  const days = Math.floor((refTime - subTime) / 86_400_000);
  return days >= SLA_BREACH_DAYS;
}
