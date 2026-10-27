import { Application } from "@prisma/client";
import {
  MIN_AGE_YEARS,
  MAX_ANNUAL_INCOME_INR,
  REQUIRED_DOCUMENTS,
  SLA_BREACH_DAYS,
  isSlaBreached,
} from "./eligibility";
import { GoogleGenAI } from "@google/genai";
import { z } from "zod";
import { prisma } from "./db";

export type InconsistencySeverity = "CRITICAL" | "WARNING" | "INFO";

export interface InconsistencyItem {
  fieldOrDoc: string; // The exact cited field or document
  issue: string; // The specific discrepancy description in Hindi
  severity: InconsistencySeverity;
}

export type SuggestedDecision = "APPROVE" | "REJECT" | "RETURN";

export interface AIAnalysisResult {
  summary: string;
  missingDocuments: string[];
  inconsistencies: InconsistencyItem[];
  suggestedDecision: SuggestedDecision;
  reasons: string[];
  confidence: "HIGH" | "MEDIUM" | "LOW";
  source: "GEMINI_AI" | "RULE_ENGINE";
  fallbackMessage?: string; // Informational Hindi message when AI is unavailable
}

// ─── Zod Schema for Validating Gemini API Output at Runtime ─────────────────

const geminiOutputSchema = z.object({
  summary: z.string().min(5),
  missingDocuments: z.array(z.string()).default([]),
  inconsistencies: z.array(
    z.object({
      fieldOrDoc: z.string().min(1),
      issue: z.string().min(1),
      severity: z.enum(["CRITICAL", "WARNING", "INFO"]).default("WARNING"),
    })
  ).default([]),
  suggestedDecision: z.enum(["APPROVE", "REJECT", "RETURN"]),
  reasons: z.array(z.string()).default([]),
  confidence: z.enum(["HIGH", "MEDIUM", "LOW"]).default("HIGH"),
});

// ─── Date & String Helpers ──────────────────────────────────────────────────

/**
 * Calculates calendar-based age (year difference minus 1 if the birthday has not yet occurred this year).
 * Avoids the ±1 day drift of 365.25 day division around birthdays.
 */
export function calculateAge(dob: Date, referenceDate: Date = new Date()): number {
  const birth = new Date(dob);
  const ref = new Date(referenceDate);
  let age = ref.getFullYear() - birth.getFullYear();
  const m = ref.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && ref.getDate() < birth.getDate())) {
    age--;
  }
  return age;
}

export function calculateDaysPending(
  submittedAt: Date,
  referenceDate: Date = new Date()
): number {
  const diffMs = new Date(referenceDate).getTime() - new Date(submittedAt).getTime();
  return Math.floor(diffMs / 86_400_000);
}

/**
 * Checks if two dates fall on the same calendar day (checking both local and UTC representations).
 */
export function isSameCalendarDay(d1: Date, d2: Date): boolean {
  const a = new Date(d1);
  const b = new Date(d2);
  const matchLocal =
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate();
  const matchUtc =
    a.getUTCFullYear() === b.getUTCFullYear() &&
    a.getUTCMonth() === b.getUTCMonth() &&
    a.getUTCDate() === b.getUTCDate();
  return matchLocal || matchUtc;
}

/**
 * Normalizes text: trims leading/trailing whitespace and collapses internal multiple spaces.
 * Note: Paired with Levenshtein edit-distance matching for resilient name comparison.
 */
export function normalizeWhitespace(text: string): string {
  return text.trim().replace(/\s+/g, " ");
}

// Backwards-compatible alias for existing imports
export const normalizeDevanagari = normalizeWhitespace;

/**
 * Checks if two applications have the same normalized applicant name, village, and calendar birth date.
 */
export function isDuplicateApplication(
  app: Pick<Application, "applicantName" | "village" | "dob">,
  other: Pick<Application, "applicantName" | "village" | "dob">
): boolean {
  return (
    normalizeWhitespace(app.applicantName) === normalizeWhitespace(other.applicantName) &&
    normalizeWhitespace(app.village) === normalizeWhitespace(other.village) &&
    isSameCalendarDay(app.dob, other.dob)
  );
}

/**
 * Computes Levenshtein edit distance between two strings
 */
export function computeLevenshtein(a: string, b: string): number {
  const matrix: number[][] = [];
  for (let i = 0; i <= b.length; i++) matrix[i] = [i];
  for (let j = 0; j <= a.length; j++) matrix[0][j] = j;

  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      if (b.charAt(i - 1) === a.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1, // substitution
          matrix[i][j - 1] + 1,     // insertion
          matrix[i - 1][j] + 1      // deletion
        );
      }
    }
  }
  return matrix[b.length][a.length];
}

// ─── Deterministic Rule Engine ──────────────────────────────────────────────

export interface RuleEngineOptions {
  checkDbDuplicates?: boolean;
  existingApplications?: Application[]; // For in-memory / unit testing without hitting database
  now?: Date; // Optional reference date for deterministic testing
}

/**
 * Deterministic rule-based analysis engine in Hindi.
 * Always executed first; provides guaranteed, reliable baseline verification.
 */
export async function analyzeWithRules(
  app: Application,
  options: RuleEngineOptions = { checkDbDuplicates: true }
): Promise<AIAnalysisResult> {
  const now = options.now || new Date();
  const age = calculateAge(app.dob, now);
  const daysPending = calculateDaysPending(app.submittedAt, now);
  const missingDocs: string[] = [];
  const inconsistencies: InconsistencyItem[] = [];
  const reasons: string[] = [];

  // 1. Missing documents check against the 6 required documents
  const submittedSet = new Set(
    (app.documentsSubmitted || []).map((d) => d.trim().toLowerCase())
  );

  for (const reqDoc of REQUIRED_DOCUMENTS) {
    const isPresent = Array.from(submittedSet).some((submitted) =>
      submitted.includes(reqDoc.toLowerCase())
    );
    if (!isPresent) {
      missingDocs.push(reqDoc);
      inconsistencies.push({
        fieldOrDoc: reqDoc,
        issue: `अनिवार्य दस्तावेज़ '${reqDoc}' आवेदन में संलग्न नहीं है।`,
        severity: "CRITICAL",
      });
    }
  }

  // 2. Age eligibility check (must be >= 60)
  const isUnderage = age < MIN_AGE_YEARS;
  if (isUnderage) {
    inconsistencies.push({
      fieldOrDoc: "जन्म तिथि / आयु प्रमाण पत्र",
      issue: `आवेदक की आयु ${age} वर्ष है, जो न्यूनतम पात्रता सीमा (${MIN_AGE_YEARS} वर्ष) से कम है।`,
      severity: "CRITICAL",
    });
    reasons.push(
      `आवेदक की आयु ${age} वर्ष है, जो वृद्धा पेंशन की अनिवार्य न्यूनतम आयु ${MIN_AGE_YEARS} वर्ष की शर्त पूरी नहीं करती।`
    );
  }

  // 3. Income eligibility check (must be <= ₹2,00,000)
  const isOverIncome = app.annualIncome > MAX_ANNUAL_INCOME_INR;
  if (isOverIncome) {
    inconsistencies.push({
      fieldOrDoc: "आय प्रमाण पत्र",
      issue: `दर्ज वार्षिक आय ₹${app.annualIncome.toLocaleString("hi-IN")} है, जो निर्धारित सीमा ₹${MAX_ANNUAL_INCOME_INR.toLocaleString("hi-IN")} से अधिक है।`,
      severity: "CRITICAL",
    });
    reasons.push(
      `वार्षिक आय ₹${app.annualIncome.toLocaleString("hi-IN")} अधिकतम अनुमेय सीमा ₹${MAX_ANNUAL_INCOME_INR.toLocaleString("hi-IN")} से अधिक है।`
    );
  }

  // 4. Bank account holder name comparison (with whitespace normalization & edit distance)
  const normAppName = normalizeWhitespace(app.applicantName);
  const normBankHolder = normalizeWhitespace(app.bankAccountHolder);

  if (normAppName !== normBankHolder) {
    const distance = computeLevenshtein(normAppName, normBankHolder);
    const maxLen = Math.max(normAppName.length, normBankHolder.length);
    const similarity = 1 - distance / maxLen;

    if (similarity >= 0.75 && distance <= 3) {
      // Minor spelling difference -> WARNING
      inconsistencies.push({
        fieldOrDoc: "बैंक पासबुक / खाता धारक नाम",
        issue: `बैंक खातेदार नाम ('${app.bankAccountHolder}') एवं आवेदक नाम ('${app.applicantName}') में मामूली वर्तनी (spelling) अंतर है।`,
        severity: "WARNING",
      });
      reasons.push(
        `बैंक खातेदार नाम (${app.bankAccountHolder}) एवं आवेदक नाम में मामूली वर्तनी अंतर है।`
      );
    } else {
      // Major mismatch -> CRITICAL
      inconsistencies.push({
        fieldOrDoc: "बैंक पासबुक / खाता धारक नाम",
        issue: `बैंक खातेदार का नाम ('${app.bankAccountHolder}') आवेदन में दर्ज नाम ('${app.applicantName}') से पूर्णतः भिन्न है।`,
        severity: "CRITICAL",
      });
      reasons.push(
        `बैंक खाता आवेदक (${app.applicantName}) के नाम पर न होकर अन्य व्यक्ति (${app.bankAccountHolder}) के नाम पर है। DBT अंतरण विफल हो जाएगा।`
      );
    }
  }

  // 5. Expired documents check => CRITICAL severity and forces RETURN
  for (const doc of app.documentsSubmitted || []) {
    if (
      doc.includes("समाप्त") ||
      doc.toLowerCase().includes("expired") ||
      doc.includes("पुराना")
    ) {
      inconsistencies.push({
        fieldOrDoc: doc,
        issue: `दस्तावेज़ की वैधता समाप्त हो चुकी है (${doc})। नवीनतम वैध प्रमाण पत्र संलग्न किया जाना आवश्यक है।`,
        severity: "CRITICAL",
      });
      reasons.push(`संलग्न दस्तावेज़ (${doc}) की वैधता समाप्त हो चुकी है।`);
    }
  }

  // 6. SLA breach check (urgency indicator only, strictly WARNING, never affects suggestedDecision)
  if (isSlaBreached(app.submittedAt, app.status, now)) {
    inconsistencies.push({
      fieldOrDoc: "आवेदन समय-सीमा (SLA)",
      issue: `यह आवेदन ${daysPending} दिनों से लंबित है, जो ${SLA_BREACH_DAYS} दिवसीय सेवा अधिकार (SLA) सीमा का उल्लंघन है।`,
      severity: "WARNING",
    });
  }

  // 7. Duplicate check (same normalized name + village + calendar birth date)
  // ONLY flag the application with the LATER submittedAt (earlier clean application remains unflagged)
  const currentSubTime = new Date(app.submittedAt).getTime();

  if (options.existingApplications && app.id) {
    // In-memory duplicate check for test environments without real DB
    const priorDuplicate = options.existingApplications.find(
      (cand) =>
        cand.id !== app.id &&
        isDuplicateApplication(app, cand) &&
        currentSubTime > new Date(cand.submittedAt).getTime()
    );
    if (priorDuplicate) {
      inconsistencies.push({
        fieldOrDoc: "आवेदक पहचान / पूर्व रिकॉर्ड",
        issue: `संभावित डुप्लीकेट: समान नाम, गाँव व जन्म तिथि पर पूर्व आवेदन (ID: ${priorDuplicate.id}, दिनांक: ${new Date(priorDuplicate.submittedAt).toLocaleDateString("hi-IN")}) पहले से दर्ज है।`,
        severity: "CRITICAL",
      });
      reasons.push(
        `समान आवेदक विवरण पर पूर्व आवेदन (ID: ${priorDuplicate.id}) पहले से दर्ज है, भौतिक सत्यापन आवश्यक है।`
      );
    }
  } else if (options.checkDbDuplicates && app.id) {
    try {
      const dobDate = new Date(app.dob);
      const startOfDay = new Date(dobDate.getFullYear(), dobDate.getMonth(), dobDate.getDate(), 0, 0, 0, 0);
      const endOfDay = new Date(dobDate.getFullYear(), dobDate.getMonth(), dobDate.getDate(), 23, 59, 59, 999);

      // Only search for applications submitted strictly BEFORE this one
      const candidates = await prisma.application.findMany({
        where: {
          id: { not: app.id },
          dob: {
            gte: startOfDay,
            lte: endOfDay,
          },
          submittedAt: {
            lt: app.submittedAt,
          },
        },
        select: { id: true, applicantName: true, village: true, dob: true, submittedAt: true },
      });

      const priorDuplicate = candidates.find((cand) =>
        isDuplicateApplication(app, cand)
      );

      if (priorDuplicate) {
        inconsistencies.push({
          fieldOrDoc: "आवेदक पहचान / पूर्व रिकॉर्ड",
          issue: `संभावित डुप्लीकेट: समान नाम, गाँव व जन्म तिथि पर पूर्व आवेदन (ID: ${priorDuplicate.id}, दिनांक: ${priorDuplicate.submittedAt.toLocaleDateString("hi-IN")}) पहले से दर्ज है।`,
          severity: "CRITICAL",
        });
        reasons.push(
          `समान आवेदक विवरण पर पूर्व आवेदन (ID: ${priorDuplicate.id}) पहले से दर्ज है, भौतिक सत्यापन आवश्यक है।`
        );
      }
    } catch {
      // In offline/test environments without DB connection, skip DB duplicate check
    }
  }

  // 8. System flag note: strictly INFO ("system note"), NEVER affects suggestedDecision or severity above INFO
  if (app.flagNote) {
    const alreadyListed = inconsistencies.some((i) => i.issue === app.flagNote);
    if (!alreadyListed) {
      inconsistencies.push({
        fieldOrDoc: "प्रणाली फ्लैग नोट",
        issue: app.flagNote,
        severity: "INFO",
      });
    }
  }

  // 9. Determine suggested decision
  let suggestedDecision: SuggestedDecision = "APPROVE";

  if (isUnderage || isOverIncome) {
    // Definitive ineligibility -> REJECT
    suggestedDecision = "REJECT";
  } else if (
    missingDocs.length > 0 ||
    inconsistencies.some((i) => i.severity === "CRITICAL")
  ) {
    // Missing documents or critical discrepancies -> RETURN
    suggestedDecision = "RETURN";
    if (missingDocs.length > 0) {
      reasons.push(
        `अनिवार्य दस्तावेज़ (${missingDocs.join(", ")}) संलग्न करने हेतु आवेदन वापस लौटाया जाए।`
      );
    }
  } else {
    // Fully eligible -> APPROVE
    // List ONLY checks actually performed (age, income, 6 docs, bank name match).
    // NO false claim of "आधार मिलान सफल रहा" (no Aadhaar biometric match exists).
    suggestedDecision = "APPROVE";
    reasons.push(
      `आवेदक की आयु (${age} वर्ष) एवं वार्षिक आय (₹${app.annualIncome.toLocaleString("hi-IN")}) पात्रता मानकों के अनुरूप हैं।`
    );
    reasons.push("सभी आवश्यक 6 अनिवार्य दस्तावेज़ संलग्न पाए गए।");
    reasons.push(
      `बैंक खाता धारक नाम ('${app.bankAccountHolder}') आवेदक नाम के अनुरूप सत्यापित पाया गया।`
    );

    // Mention WARNINGs if any exist
    const warnings = inconsistencies.filter((i) => i.severity === "WARNING");
    if (warnings.length > 0) {
      for (const w of warnings) {
        reasons.push(`ध्यान दें (चेतावनी): ${w.issue}`);
      }
    }
  }

  // REJECT/RETURN must always have at least one reason: build reasons from every CRITICAL inconsistency
  if (suggestedDecision === "RETURN" || suggestedDecision === "REJECT") {
    for (const inc of inconsistencies) {
      if (inc.severity === "CRITICAL") {
        if (!reasons.includes(inc.issue)) {
          reasons.push(inc.issue);
        }
      }
    }
    // Safety fallback: guaranteed at least one reason
    if (reasons.length === 0) {
      reasons.push(
        suggestedDecision === "REJECT"
          ? "आवेदन वृद्धा पेंशन पात्रता शर्तों को पूरा नहीं करता है।"
          : "आवेदन में अनिवार्य दस्तावेज़ या विवरण अपूर्ण हैं, संशोधन अपेक्षित है।"
      );
    }
  }

  // 10. Summary in Hindi
  let summary = `आवेदक ${app.applicantName} (आयु ${age} वर्ष, निवासी गाँव ${app.village}, तहसील ${app.tehsil}) का वृद्धा पेंशन आवेदन। `;
  if (suggestedDecision === "APPROVE") {
    const warnings = inconsistencies.filter((i) => i.severity === "WARNING");
    if (warnings.length > 0) {
      summary += `पात्रता शर्तें एवं 6 अनिवार्य दस्तावेज़ पूर्ण हैं। यद्यपि ${warnings.length} चेतावनी पाई गई है (${warnings.map((w) => w.fieldOrDoc).join(", ")}), जिसे संज्ञान में लेकर अग्रिम कार्यवाही करें।`;
    } else {
      summary += `सभी आवश्यक पात्रता शर्तें पूर्ण हैं एवं समस्त 6 अनिवार्य दस्तावेज़ संलग्न हैं। कोई विसंगति नहीं पाई गई।`;
    }
  } else if (suggestedDecision === "REJECT") {
    summary += `आवेदन पात्रता मानकों पर खरा नहीं उतरता है। मुख्य कारण: ${reasons.slice(0, 2).join("; ")}।`;
  } else {
    summary += `आवेदन में कमियाँ/दस्तावेज़ी विसंगतियाँ पाई गई हैं। आवश्यक सुधार एवं दस्तावेज़ संलग्न करने हेतु आवेदन वापस लौटाया जाना अनुशंसित है।`;
  }

  return {
    summary,
    missingDocuments: missingDocs,
    inconsistencies,
    suggestedDecision,
    reasons,
    confidence: "HIGH",
    source: "RULE_ENGINE",
  };
}

// ─── Gemini AI + Rule Engine Merger ─────────────────────────────────────────

export async function analyzeApplication(
  app: Application,
  options?: RuleEngineOptions
): Promise<AIAnalysisResult> {
  // 1. ALWAYS run the deterministic rule engine first
  const ruleResult = await analyzeWithRules(app, options);

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === "YOUR_GEMINI_API_KEY_HERE") {
    return {
      ...ruleResult,
      source: "RULE_ENGINE",
      fallbackMessage:
        "एआई सेवा उपलब्ध नहीं है (API कुंजी अनुपलब्ध)। स्थानीय नियम-आधारित सत्यापन प्रदर्शित है।",
    };
  }

  try {
    const ai = new GoogleGenAI({ apiKey });
    const now = options?.now || new Date();
    const age = calculateAge(app.dob, now);
    const daysPending = calculateDaysPending(app.submittedAt, now);
    const modelName = process.env.AI_MODEL || "gemini-2.5-flash";

    const prompt = `
आप हरियाणा सरकार के समाज कल्याण विभाग में ब्लॉक/तहसील स्तर के वृद्धा पेंशन समीक्षा विशेषज्ञ AI हैं।
कृपया निम्नलिखित आवेदन की निष्पक्ष, गहन एवं सटीक समीक्षा करें।
सम्पूर्ण उत्तर केवल शुद्ध देवनागरी हिन्दी (Hindi) में और दिए गए JSON प्रारूप में ही दें।

पात्रता नियम:
1. न्यूनतम आयु: ${MIN_AGE_YEARS} वर्ष (वर्तमान आयु: ${age} वर्ष)
2. अधिकतम वार्षिक आय: ₹${MAX_ANNUAL_INCOME_INR.toLocaleString("en-IN")} (दर्ज आय: ₹${app.annualIncome.toLocaleString("en-IN")})
3. अनिवार्य दस्तावेज़: ${REQUIRED_DOCUMENTS.join(", ")}
4. बैंक खाता धारक का नाम आवेदक के नाम से अक्षरशः मेल खाना चाहिए।
5. SLA सीमा: ${SLA_BREACH_DAYS} दिन (वर्तमान प्रतीक्षा: ${daysPending} दिन)

नियम इंजन द्वारा पहले ही पहचानी गई विसंगतियाँ:
${JSON.stringify(ruleResult.inconsistencies, null, 2)}
नियम इंजन द्वारा पाए गए लापता दस्तावेज़:
${JSON.stringify(ruleResult.missingDocuments)}

आवेदन विवरण:
- आवेदक का नाम: ${app.applicantName}
- पिता/पति का नाम: ${app.fatherHusbandName}
- जन्म तिथि: ${new Date(app.dob).toISOString().split("T")[0]} (आयु: ${age} वर्ष)
- गाँव/तहसील/जिला: ${app.village}, ${app.tehsil}, ${app.district}
- वार्षिक आय: ₹${app.annualIncome}
- आधार सं. (मास्क्ड): ${app.aadhaarMasked}
- बैंक खाता धारक: ${app.bankAccountHolder}
- बैंक IFSC: ${app.bankIFSC}
- बैंक खाता सं. (मास्क्ड): ${app.bankAccountMasked}
- जमा किए गए दस्तावेज़: ${JSON.stringify(app.documentsSubmitted)}
- आवेदन तिथि: ${new Date(app.submittedAt).toISOString().split("T")[0]} (${daysPending} दिन पूर्व)
- फ्लैग नोट: ${app.flagNote || "कोई नहीं"}

महत्वपूर्ण निर्देश:
- प्रत्येक विसंगति के साथ संबंधित फ़ील्ड या दस्तावेज़ का स्पष्ट उल्लेख करें।
- यदि आयु 60 से कम है या आय ₹2,00,000 से अधिक है, तो निर्णय कदापि "APPROVE" नहीं हो सकता।
- उत्तर केवल मान्य JSON में दें:
{
  "summary": "2-3 पंक्तियों में आवेदक व स्थिति का स्पष्ट सारांश",
  "missingDocuments": ["लापता दस्तावेज़"],
  "inconsistencies": [
    {
      "fieldOrDoc": "संबंधित फ़ील्ड/दस्तावेज़",
      "issue": "विसंगति का विवरण",
      "severity": "CRITICAL" | "WARNING" | "INFO"
    }
  ],
  "suggestedDecision": "APPROVE" | "REJECT" | "RETURN",
  "reasons": ["कारण 1", "कारण 2"],
  "confidence": "HIGH" | "MEDIUM" | "LOW"
}
`;

    const response = await ai.models.generateContent({
      model: modelName,
      contents: prompt,
      config: {
        responseMimeType: "application/json",
      },
    });

    const text = response.text?.trim();
    if (!text) {
      return {
        ...ruleResult,
        source: "RULE_ENGINE",
        fallbackMessage:
          "एआई से कोई प्रत्युत्तर प्राप्त नहीं हुआ। स्थानीय नियम-आधारित सत्यापन प्रदर्शित है।",
      };
    }

    // 2. Validate Gemini JSON output with Zod at runtime
    const parsedJson = JSON.parse(text);
    const validated = geminiOutputSchema.safeParse(parsedJson);

    if (!validated.success) {
      console.warn("Gemini output failed zod validation:", validated.error);
      return {
        ...ruleResult,
        source: "RULE_ENGINE",
        fallbackMessage:
          "एआई प्रत्युत्तर सत्यापन में विफल रहा। स्थानीय नियम-आधारित सत्यापन प्रदर्शित है।",
      };
    }

    const aiData = validated.data;

    // 3. MERGE & HARD RULE ENFORCEMENT:
    // If a hard rule failed in the rule engine (underage or over-income),
    // the final decision MUST NEVER be APPROVE, regardless of Gemini's suggestion.
    const isHardRuleFailed =
      calculateAge(app.dob, now) < MIN_AGE_YEARS ||
      app.annualIncome > MAX_ANNUAL_INCOME_INR;

    const hasMissingOrCritical =
      ruleResult.missingDocuments.length > 0 ||
      ruleResult.inconsistencies.some((i) => i.severity === "CRITICAL");

    let finalDecision: SuggestedDecision = aiData.suggestedDecision;
    let finalReasons: string[];
    let finalSummary = aiData.summary || ruleResult.summary;

    if (isHardRuleFailed) {
      finalDecision = "REJECT";
      // Discard contradictory Gemini approval reasons; strictly use statutory rule-based reasons
      finalReasons = [...ruleResult.reasons];
      finalSummary = ruleResult.summary;
    } else if (finalDecision === "REJECT") {
      // Item 9: If Gemini suggested REJECT but no hard statutory rule failed (age >= 60 and income <= ₹2L),
      // downgrade to RETURN because discrepancies/missing docs are remediable by the applicant.
      finalDecision = "RETURN";
      finalReasons = Array.from(
        new Set([...ruleResult.reasons, ...aiData.reasons])
      );
      if (finalReasons.length === 0) {
        finalReasons.push("आवेदन में पाई गई विसंगतियों के संशोधन हेतु वापस लौटाया जाना अनुशंसित है।");
      }
    } else if (hasMissingOrCritical && finalDecision === "APPROVE") {
      finalDecision = "RETURN";
      // Discard contradictory Gemini approval reasons; strictly use statutory rule-based return reasons
      finalReasons = [...ruleResult.reasons];
      finalSummary = ruleResult.summary;
    } else {
      finalReasons = Array.from(
        new Set([...ruleResult.reasons, ...aiData.reasons])
      );
    }

    // Merge inconsistencies (avoiding duplicates)
    const mergedInconsistencies = [...ruleResult.inconsistencies];
    for (const item of aiData.inconsistencies) {
      const exists = mergedInconsistencies.some(
        (existing) =>
          existing.fieldOrDoc.toLowerCase() === item.fieldOrDoc.toLowerCase()
      );
      if (!exists) {
        mergedInconsistencies.push({
          fieldOrDoc: item.fieldOrDoc,
          issue: item.issue,
          severity: item.severity as InconsistencySeverity,
        });
      }
    }

    // Never include false claim "आधार मिलान सफल रहा" in reasons
    finalReasons = finalReasons.filter((r) => !r.includes("आधार मिलान सफल रहा"));

    // If APPROVE, ensure any WARNINGs are mentioned
    if (finalDecision === "APPROVE") {
      const warnings = mergedInconsistencies.filter((i) => i.severity === "WARNING");
      for (const w of warnings) {
        const warningText = `ध्यान दें (चेतावनी): ${w.issue}`;
        if (!finalReasons.includes(warningText)) {
          finalReasons.push(warningText);
        }
      }
    }

    // Ensure REJECT or RETURN always has at least one reason
    if (finalDecision === "REJECT" || finalDecision === "RETURN") {
      if (finalReasons.length === 0) {
        finalReasons.push(
          finalDecision === "REJECT"
            ? "आवेदन पात्रता शर्तों को पूरा नहीं करता है।"
            : "आवेदन में अनिवार्य दस्तावेज़ या विवरण अपूर्ण हैं, संशोधन अपेक्षित है।"
        );
      }
    }

    return {
      summary: finalSummary,
      missingDocuments: Array.from(
        new Set([...ruleResult.missingDocuments, ...aiData.missingDocuments])
      ),
      inconsistencies: mergedInconsistencies,
      suggestedDecision: finalDecision,
      reasons: finalReasons,
      confidence: aiData.confidence,
      source: "GEMINI_AI",
    };
  } catch (error) {
    console.error("Gemini AI API error, falling back to rule engine:", error);
    return {
      ...ruleResult,
      source: "RULE_ENGINE",
      fallbackMessage:
        "एआई सेवा अस्थायी रूप से अनुपलब्ध है। स्थानीय नियम-आधारित सत्यापन प्रदर्शित है।",
    };
  }
}

// ─── Caching Layer in Database ──────────────────────────────────────────────

/**
 * Reads cached AI analysis from Application.aiAnalysis.
 * Computes and writes to DB only when GEMINI_AI succeeds.
 * If source is RULE_ENGINE due to AI downtime, results are not permanently cached
 * so that the system immediately retries Gemini once the key or service is available.
 */
export async function getOrComputeAnalysis(
  applicationId: string,
  forceRefresh = false
): Promise<AIAnalysisResult> {
  const app = await prisma.application.findUnique({
    where: { id: applicationId },
  });

  if (!app) {
    throw new Error("Application not found");
  }

  // Return cached result if available and not forcing a refresh, UNLESS
  // the cached result was an AI failure fallback (RULE_ENGINE) and a valid key is now present.
  if (app.aiAnalysis && !forceRefresh) {
    const cached = app.aiAnalysis as unknown as AIAnalysisResult;
    const apiKey = process.env.GEMINI_API_KEY;
    const hasValidKey = Boolean(apiKey && apiKey !== "YOUR_GEMINI_API_KEY_HERE");
    if (cached.source === "RULE_ENGINE" && hasValidKey) {
      // Recompute with Gemini!
    } else {
      return cached;
    }
  }

  // Compute fresh analysis
  const freshAnalysis = await analyzeApplication(app);

  // Cache in database ONLY if successfully generated by GEMINI_AI
  if (freshAnalysis.source === "GEMINI_AI") {
    try {
      await prisma.application.update({
        where: { id: applicationId },
        data: {
          aiAnalysis: freshAnalysis as never,
          analyzedAt: new Date(),
        },
      });
    } catch (err) {
      console.error("Failed to cache AI analysis in database:", err);
    }
  }

  return freshAnalysis;
}
