import test from "node:test";
import assert from "node:assert/strict";
import { Application } from "@prisma/client";
import { analyzeWithRules, calculateAge, isDuplicateApplication } from "../lib/ai";
import { isSlaBreached } from "../lib/eligibility";
import { calculateUrgencyScore } from "../lib/urgency";

// Helper to create mock applications
function createMockApp(overrides: Partial<Application> = {}): Application {
  const now = Date.now();
  return {
    id: "test-app-1",
    applicantName: "सुरेश लाल",
    fatherHusbandName: "राम लाल",
    dob: new Date(now - 68 * 365.25 * 86_400_000), // 68 years old
    village: "बाबेल",
    tehsil: "अंबाला",
    district: "अंबाला",
    aadhaarMasked: "XXXX-XXXX-XXXX-1001",
    bankAccountHolder: "सुरेश लाल",
    bankIFSC: "PUNB0001200",
    bankAccountMasked: "XXXX1001",
    annualIncome: 48000,
    documentsSubmitted: [
      "आयु प्रमाण पत्र",
      "आय प्रमाण पत्र",
      "आधार कार्ड",
      "बैंक पासबुक",
      "निवास प्रमाण पत्र",
      "पासपोर्ट साइज फोटो",
    ],
    submittedAt: new Date(now - 5 * 86_400_000), // 5 days ago
    status: "PENDING",
    priority: "NORMAL",
    flagNote: null,
    aiAnalysis: null,
    analyzedAt: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
}

test("1. Clean Application -> Suggested Decision must be APPROVE", async () => {
  const app = createMockApp();
  const res = await analyzeWithRules(app, { checkDbDuplicates: false });

  assert.equal(res.suggestedDecision, "APPROVE");
  assert.equal(res.missingDocuments.length, 0);
  assert.equal(res.inconsistencies.length, 0);
  assert.match(res.summary, /सुरेश लाल/);
  // Ensure no false claim of Aadhaar matching exists
  for (const reason of res.reasons) {
    assert.doesNotMatch(reason, /आधार मिलान सफल रहा/);
  }
});

test("2. Underage Applicant (< 60 yrs) -> Suggested Decision must be REJECT", async () => {
  const now = Date.now();
  const app = createMockApp({
    dob: new Date(now - 52 * 365.25 * 86_400_000), // 52 years old
  });
  const res = await analyzeWithRules(app, { checkDbDuplicates: false });

  assert.equal(res.suggestedDecision, "REJECT");
  const ageInconsistency = res.inconsistencies.find((i) =>
    i.fieldOrDoc.includes("आयु प्रमाण पत्र")
  );
  assert.ok(ageInconsistency, "Should cite age document");
  assert.equal(ageInconsistency?.severity, "CRITICAL");
});

test("3. Income Above Ceiling (> ₹2,00,000) -> Suggested Decision must be REJECT", async () => {
  const app = createMockApp({
    annualIncome: 380000, // ₹3,80,000 > ₹2,00,000
  });
  const res = await analyzeWithRules(app, { checkDbDuplicates: false });

  assert.equal(res.suggestedDecision, "REJECT");
  const incomeInconsistency = res.inconsistencies.find((i) =>
    i.fieldOrDoc.includes("आय प्रमाण पत्र")
  );
  assert.ok(incomeInconsistency, "Should cite income document");
  assert.equal(incomeInconsistency?.severity, "CRITICAL");
});

test("4. Missing Required Document -> Suggested Decision must be RETURN", async () => {
  const app = createMockApp({
    documentsSubmitted: [
      "आयु प्रमाण पत्र",
      // "आय प्रमाण पत्र" is missing
      "आधार कार्ड",
      "बैंक पासबुक",
      "निवास प्रमाण पत्र",
      "पासपोर्ट साइज फोटो",
    ],
  });
  const res = await analyzeWithRules(app, { checkDbDuplicates: false });

  assert.equal(res.suggestedDecision, "RETURN");
  assert.ok(
    res.missingDocuments.includes("आय प्रमाण पत्र"),
    "Missing docs must include income proof"
  );
});

test("5. Major Bank Account Name Mismatch -> CRITICAL and RETURN", async () => {
  const app = createMockApp({
    applicantName: "गीता बाई",
    bankAccountHolder: "सुमित्रा देवी", // Completely different person
  });
  const res = await analyzeWithRules(app, { checkDbDuplicates: false });

  assert.equal(res.suggestedDecision, "RETURN");
  const mismatch = res.inconsistencies.find((i) =>
    i.fieldOrDoc.includes("बैंक पासबुक")
  );
  assert.ok(mismatch);
  assert.equal(mismatch?.severity, "CRITICAL");
});

test("6. Minor Spelling Difference in Bank Account -> WARNING", async () => {
  const app = createMockApp({
    applicantName: "सुरेश लाल",
    bankAccountHolder: "सुरेश लाला", // Minor spelling variation
  });
  const res = await analyzeWithRules(app, { checkDbDuplicates: false });

  const mismatch = res.inconsistencies.find((i) =>
    i.fieldOrDoc.includes("बैंक पासबुक")
  );
  assert.ok(mismatch);
  assert.equal(mismatch?.severity, "WARNING");
});

test("7. SLA Breach (>= 30 days pending) -> Detected and Prioritized", () => {
  const now = Date.now();
  const submittedAt = new Date(now - 45 * 86_400_000); // 45 days ago

  assert.equal(isSlaBreached(submittedAt, "PENDING"), true);
  assert.equal(isSlaBreached(submittedAt, "APPROVED"), false);

  const slaScore = calculateUrgencyScore(submittedAt, "HIGH", "PENDING", now);
  const normalScore = calculateUrgencyScore(
    new Date(now - 5 * 86_400_000),
    "NORMAL",
    "PENDING",
    now
  );

  assert.ok(
    slaScore > 10000,
    "SLA breach must score above 10,000 for top prioritization"
  );
  assert.ok(
    slaScore > normalScore,
    "SLA score must exceed normal pending score"
  );
});

test("8. Calendar Age: Turning 60 Today vs Turning 60 Tomorrow", async () => {
  const refDate = new Date("2026-10-27T10:00:00Z");

  // Person A: Born 1966-10-27 (turns exactly 60 today)
  const dobToday = new Date("1966-10-27T00:00:00Z");
  const ageToday = calculateAge(dobToday, refDate);
  assert.equal(ageToday, 60, "Must be exactly 60 on birthday");

  const appToday = createMockApp({ dob: dobToday });
  const resToday = await analyzeWithRules(appToday, {
    now: refDate,
    checkDbDuplicates: false,
  });
  assert.equal(resToday.suggestedDecision, "APPROVE");

  // Person B: Born 1966-10-28 (turns 60 tomorrow)
  const dobTomorrow = new Date("1966-10-28T00:00:00Z");
  const ageTomorrow = calculateAge(dobTomorrow, refDate);
  assert.equal(ageTomorrow, 59, "Must be 59 the day before 60th birthday");

  const appTomorrow = createMockApp({ dob: dobTomorrow });
  const resTomorrow = await analyzeWithRules(appTomorrow, {
    now: refDate,
    checkDbDuplicates: false,
  });
  assert.equal(resTomorrow.suggestedDecision, "REJECT");
  assert.ok(
    resTomorrow.inconsistencies.some((i) => i.fieldOrDoc.includes("आयु प्रमाण पत्र")),
    "Must cite age certificate for turning 60 tomorrow"
  );
});

test("9. Duplicate Check: Whitespace Normalization & Calendar Date Matching", async () => {
  const sharedDob = new Date("1958-05-15T08:30:00Z");
  const differentTimeSameDay = new Date("1958-05-15T21:45:00Z");

  const origApp = createMockApp({
    id: "orig-app-1",
    applicantName: "सुरेश लाल",
    village: "बाबेल",
    dob: sharedDob,
    submittedAt: new Date(Date.now() - 5 * 86_400_000), // Submitted 5 days ago
  });

  const duplicateApp = createMockApp({
    id: "dup-app-2",
    applicantName: "  सुरेश   लाल  ", // Whitespace variations
    village: " बाबेल ",
    dob: differentTimeSameDay, // Different millisecond/time on same calendar date
    submittedAt: new Date(Date.now() - 2 * 86_400_000), // Submitted 2 days ago (LATER)
  });

  // Verify pure function
  assert.equal(
    isDuplicateApplication(origApp, duplicateApp),
    true,
    "Should detect duplicate despite extra spaces and different timestamp on same day"
  );

  // Verify in-memory rule engine injection (does not hit external DB)
  const res = await analyzeWithRules(duplicateApp, {
    existingApplications: [origApp],
  });

  assert.equal(res.suggestedDecision, "RETURN");
  const dupIssue = res.inconsistencies.find((i) =>
    i.fieldOrDoc.includes("आवेदक पहचान / पूर्व रिकॉर्ड")
  );
  assert.ok(dupIssue, "Must flag duplicate applicant");
  assert.equal(dupIssue?.severity, "CRITICAL");
  assert.match(dupIssue?.issue || "", /orig-app-1/);
});

test("10. Urgency Triage Scoring Order", () => {
  const now = Date.now();
  // SLA breach (45 days ago)
  const slaScore = calculateUrgencyScore(
    new Date(now - 45 * 86_400_000),
    "HIGH",
    "PENDING",
    now
  );
  // High priority not yet breached (15 days ago)
  const highPriorityScore = calculateUrgencyScore(
    new Date(now - 15 * 86_400_000),
    "HIGH",
    "PENDING",
    now
  );
  // Normal priority pending (15 days ago)
  const normalScore = calculateUrgencyScore(
    new Date(now - 15 * 86_400_000),
    "NORMAL",
    "PENDING",
    now
  );
  // Decided application (status APPROVED)
  const decidedScore = calculateUrgencyScore(
    new Date(now - 45 * 86_400_000),
    "HIGH",
    "APPROVED",
    now
  );

  assert.ok(slaScore > highPriorityScore, "SLA breach score > High priority score");
  assert.ok(highPriorityScore > normalScore, "High priority score > Normal score");
  assert.ok(normalScore > decidedScore, "Pending score > Decided score");
  assert.equal(decidedScore, -1, "Decided application score must be -1");
});

test("11. Hard Rule Lock: Reasons & Summary strictly match final REJECT decision", async () => {
  const now = Date.now();
  // Underage applicant (52 years old)
  const underageApp = createMockApp({
    dob: new Date(now - 52 * 365.25 * 86_400_000),
    annualIncome: 55000,
  });

  const res = await analyzeWithRules(underageApp, { checkDbDuplicates: false });

  assert.equal(res.suggestedDecision, "REJECT");
  // Ensure reasons do not contain false approval statements
  assert.ok(res.reasons.length > 0, "Must have reasons explaining rejection");
  for (const reason of res.reasons) {
    assert.doesNotMatch(reason, /सफल रहा|पात्रता मानकों के अनुरूप|स्वीकृत/);
  }
  // Must cite statutory age limit
  assert.ok(
    res.reasons.some((r) => r.includes("न्यूनतम आयु 60 वर्ष")),
    "Rejection reasons must cite 60-year statutory requirement"
  );
  // Summary must explain rejection
  assert.match(res.summary, /पात्रता मानकों पर खरा नहीं उतरता/);
});

test("12. Expired Document -> CRITICAL severity and forces RETURN", async () => {
  const app = createMockApp({
    documentsSubmitted: [
      "आयु प्रमाण पत्र (समाप्त)",
      "आय प्रमाण पत्र",
      "आधार कार्ड",
      "बैंक पासबुक",
      "निवास प्रमाण पत्र",
      "पासपोर्ट साइज फोटो",
    ],
  });
  const res = await analyzeWithRules(app, { checkDbDuplicates: false });

  assert.equal(res.suggestedDecision, "RETURN");
  const expiredInc = res.inconsistencies.find((i) => i.fieldOrDoc.includes("समाप्त"));
  assert.ok(expiredInc, "Must cite expired document");
  assert.equal(expiredInc?.severity, "CRITICAL", "Expired document must have CRITICAL severity");
  assert.ok(
    res.reasons.some((r) => r.includes("समाप्त")),
    "Reasons must explicitly mention expired document"
  );
});

test("13. System flagNote on otherwise clean application -> strictly INFO severity and stays APPROVE", async () => {
  const app = createMockApp({
    priority: "HIGH", // Even when priority is marked HIGH (e.g. from SLA breach or system triage)
    flagNote: "SLA समय-सीमा उल्लंघन (त्वरित समीक्षा अपेक्षित)",
  });
  const res = await analyzeWithRules(app, { checkDbDuplicates: false });

  assert.equal(
    res.suggestedDecision,
    "APPROVE",
    "System flagNote must never change suggested decision of eligible applicant"
  );
  const flagInc = res.inconsistencies.find((i) => i.fieldOrDoc === "प्रणाली फ्लैग नोट");
  assert.ok(flagInc, "Flag note must be listed as system note");
  assert.equal(flagInc?.severity, "INFO", "Flag note severity must strictly be INFO");
});

test("14. Duplicate Check: Only flags the application with the LATER submittedAt", async () => {
  const sharedDob = new Date("1958-05-15T08:30:00Z");

  const earlierApp = createMockApp({
    id: "earlier-app-1",
    applicantName: "सुरेश लाल",
    village: "बाबेल",
    dob: sharedDob,
    submittedAt: new Date("2026-10-20T10:00:00Z"), // Submitted 5 days earlier
  });

  const laterApp = createMockApp({
    id: "later-app-2",
    applicantName: "सुरेश लाल",
    village: "बाबेल",
    dob: sharedDob,
    submittedAt: new Date("2026-10-25T10:00:00Z"), // Submitted later
  });

  // Evaluate earlier application against existing applications containing later one
  const resEarlier = await analyzeWithRules(earlierApp, {
    existingApplications: [laterApp],
  });
  assert.equal(
    resEarlier.suggestedDecision,
    "APPROVE",
    "Earlier submitted clean application must NOT be flagged as duplicate"
  );
  assert.ok(
    !resEarlier.inconsistencies.some((i) => i.fieldOrDoc.includes("पूर्व रिकॉर्ड")),
    "Earlier application must not have duplicate inconsistency"
  );

  // Evaluate later application against existing applications containing earlier one
  const resLater = await analyzeWithRules(laterApp, {
    existingApplications: [earlierApp],
  });
  assert.equal(
    resLater.suggestedDecision,
    "RETURN",
    "Later duplicate application must be flagged and suggested RETURN"
  );
  assert.ok(
    resLater.inconsistencies.some((i) => i.fieldOrDoc.includes("पूर्व रिकॉर्ड")),
    "Later application must cite duplicate record"
  );
});

test("15. Empty Reasons Never Happens: REJECT and RETURN always have at least 1 reason", async () => {
  // Case A: Missing documents
  const missingDocApp = createMockApp({
    documentsSubmitted: ["आयु प्रमाण पत्र"],
  });
  const resMissing = await analyzeWithRules(missingDocApp, { checkDbDuplicates: false });
  assert.equal(resMissing.suggestedDecision, "RETURN");
  assert.ok(resMissing.reasons.length >= 1, "RETURN must have >= 1 reason");

  // Case B: Bank name mismatch
  const mismatchApp = createMockApp({
    applicantName: "कमला देवी",
    bankAccountHolder: "राजेश कुमार",
  });
  const resMismatch = await analyzeWithRules(mismatchApp, { checkDbDuplicates: false });
  assert.equal(resMismatch.suggestedDecision, "RETURN");
  assert.ok(resMismatch.reasons.length >= 1, "Bank mismatch RETURN must have >= 1 reason");

  // Case C: Underage
  const underageApp = createMockApp({
    dob: new Date("1980-01-01T00:00:00Z"),
  });
  const resUnderage = await analyzeWithRules(underageApp, { checkDbDuplicates: false });
  assert.equal(resUnderage.suggestedDecision, "REJECT");
  assert.ok(resUnderage.reasons.length >= 1, "Underage REJECT must have >= 1 reason");

  // Case D: Over income
  const overIncomeApp = createMockApp({
    annualIncome: 500000,
  });
  const resIncome = await analyzeWithRules(overIncomeApp, { checkDbDuplicates: false });
  assert.equal(resIncome.suggestedDecision, "REJECT");
  assert.ok(resIncome.reasons.length >= 1, "Over income REJECT must have >= 1 reason");
});
