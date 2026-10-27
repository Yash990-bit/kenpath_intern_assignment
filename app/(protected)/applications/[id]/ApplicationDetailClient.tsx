"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { Application, AuditLog } from "@prisma/client";
import { AIAnalysisResult, calculateAge, calculateDaysPending } from "@/lib/ai";
import {
  MIN_AGE_YEARS,
  MAX_ANNUAL_INCOME_INR,
  REQUIRED_DOCUMENTS,
  isSlaBreached,
} from "@/lib/eligibility";
import { submitDecision, DecisionType } from "@/app/actions/application";

interface AuditLogWithOfficer extends AuditLog {
  officer: {
    name: string;
    designation: string;
  };
}

interface ApplicationWithAudit extends Application {
  auditLogs: AuditLogWithOfficer[];
}

export default function ApplicationDetailClient({
  application: initialApp,
  initialAnalysis,
  officerName,
}: {
  application: ApplicationWithAudit;
  initialAnalysis: AIAnalysisResult;
  officerName: string;
}) {
  const [app, setApp] = useState<ApplicationWithAudit>(initialApp);
  const [analysis, setAnalysis] = useState<AIAnalysisResult>(initialAnalysis);
  const [isRefreshingAi, setIsRefreshingAi] = useState(false);

  // Officer decision form state
  const [selectedDecision, setSelectedDecision] = useState<DecisionType | null>(
    null
  );
  const [reason, setReason] = useState("");
  const [formError, setFormError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [isPending, startTransition] = useTransition();

  const age = calculateAge(app.dob);
  const daysPending = calculateDaysPending(app.submittedAt);
  const isSlaBreach = isSlaBreached(app.submittedAt, app.status);
  const isUnderage = age < MIN_AGE_YEARS;
  const isIncomeHigh = app.annualIncome > MAX_ANNUAL_INCOME_INR;
  const isBankHolderMismatch =
    app.applicantName.trim() !== app.bankAccountHolder.trim();

  // Refresh AI Analysis via API with ?force=true
  const handleRefreshAi = async () => {
    setIsRefreshingAi(true);
    try {
      const res = await fetch(`/api/applications/${app.id}/ai-analysis?force=true`);
      if (res.ok) {
        const data = await res.json();
        setAnalysis(data);
      }
    } catch (err) {
      console.error("AI refresh failed:", err);
    } finally {
      setIsRefreshingAi(false);
    }
  };

  // Prefill AI suggested reason into the officer's reason box
  const handlePrefillAiReason = () => {
    const aiReasonText = analysis.reasons.join(" ");
    setReason(aiReasonText);
    if (!selectedDecision) {
      setSelectedDecision(analysis.suggestedDecision);
    }
    setFormError(null);
  };

  // Pre-validate before showing confirmation dialog
  const handleOpenConfirm = () => {
    setFormError(null);
    setSuccessMsg(null);

    if (app.status !== "PENDING") {
      setFormError("इस आवेदन पर पहले ही निर्णय लिया जा चुका है। दोहरा निर्णय दर्ज नहीं किया जा सकता।");
      return;
    }

    if (!selectedDecision) {
      setFormError("कृपया पहले निर्णय (स्वीकृत / अस्वीकृत / वापस) का चयन करें।");
      return;
    }

    if (!reason.trim() || reason.trim().length < 10) {
      setFormError("निर्णय हेतु कारण दर्ज करना अनिवार्य है (कम से कम 10 अक्षर आवश्यक हैं)।");
      return;
    }

    setShowConfirmModal(true);
  };

  // Execute actual submission after user confirms in modal
  const handleConfirmDecision = () => {
    if (!selectedDecision) return;
    setShowConfirmModal(false);

    startTransition(async () => {
      const res = await submitDecision({
        applicationId: app.id,
        decision: selectedDecision,
        reason: reason.trim(),
        aiSuggested: analysis.suggestedDecision,
      });

      if (!res.success) {
        setFormError(res.error || "निर्णय सहेजने में विफल।");
      } else {
        const actionLabels: Record<DecisionType, string> = {
          APPROVE: "स्वीकृत",
          REJECT: "अस्वीकृत",
          RETURN: "वापस",
        };
        const statusMap = {
          APPROVE: "APPROVED",
          REJECT: "REJECTED",
          RETURN: "RETURNED",
        } as const;

        const isOverridden = analysis.suggestedDecision !== selectedDecision;

        // Update local state immediately
        setApp((prev) => ({
          ...prev,
          status: statusMap[selectedDecision],
          auditLogs: [
            {
              id: "temp-" + Date.now(),
              applicationId: prev.id,
              officerId: "current",
              action: actionLabels[selectedDecision],
              aiSuggested: analysis.suggestedDecision,
              finalDecision: selectedDecision,
              overridden: isOverridden,
              reason: reason.trim(),
              createdAt: new Date(),
              officer: {
                name: officerName,
                designation: "तहसीलदार",
              },
            },
            ...prev.auditLogs,
          ],
        }));

        setSuccessMsg(
          `निर्णय सफलतापूर्वक दर्ज किया गया: आवेदन ${actionLabels[selectedDecision]} कर दिया गया है।`
        );
        setReason("");
        setSelectedDecision(null);
      }
    });
  };

  const statusBadges: Record<
    string,
    { label: string; bg: string; text: string; border: string }
  > = {
    PENDING: { label: "लंबित", bg: "#fff3e6", text: "#cc5500", border: "#ffcc99" },
    APPROVED: { label: "स्वीकृत", bg: "#e8f5ee", text: "#1a6b3a", border: "#a8d5bb" },
    REJECTED: { label: "अस्वीकृत", bg: "#fdecea", text: "#a93226", border: "#f5c6c2" },
    RETURNED: { label: "वापस", bg: "#fef3c7", text: "#92400e", border: "#fcd34d" },
  };

  const statusStyle = statusBadges[app.status] || statusBadges.PENDING;

  return (
    <div style={{ fontFamily: "var(--font-devanagari)", paddingBottom: "3rem" }}>
      {/* Top Nav & Breadcrumb */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "1.25rem",
          flexWrap: "wrap",
          gap: "0.75rem",
        }}
      >
        <Link
          href="/dashboard"
          style={{
            color: "var(--clr-navy)",
            textDecoration: "none",
            fontSize: "0.9rem",
            display: "inline-flex",
            alignItems: "center",
            gap: "0.4rem",
            fontWeight: 600,
            background: "white",
            padding: "0.45rem 0.9rem",
            borderRadius: "6px",
            border: "1px solid var(--clr-border)",
            boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
          }}
        >
          ← डैशबोर्ड पर वापस जाएँ
        </Link>

        <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
          <span
            style={{
              fontSize: "0.78rem",
              background: "white",
              padding: "0.35rem 0.75rem",
              borderRadius: "6px",
              border: "1px solid var(--clr-border)",
              color: "var(--clr-text-secondary)",
            }}
          >
            आवेदन ID: <code>{app.id}</code>
          </span>
          <span
            style={{
              background: statusStyle.bg,
              color: statusStyle.text,
              border: `1px solid ${statusStyle.border}`,
              borderRadius: "999px",
              padding: "0.3rem 0.9rem",
              fontSize: "0.82rem",
              fontWeight: 700,
            }}
          >
            ● {statusStyle.label}
          </span>
          {app.priority === "HIGH" && (
            <span
              style={{
                background: "#fef3c7",
                color: "#92400e",
                border: "1px solid #fcd34d",
                borderRadius: "999px",
                padding: "0.3rem 0.8rem",
                fontSize: "0.8rem",
                fontWeight: 600,
              }}
            >
              ⚠️ उच्च प्राथमिकता
            </span>
          )}
        </div>
      </div>

      {/* Flag or SLA Alert Banner */}
      {(isSlaBreach || app.flagNote) && (
        <div
          style={{
            marginBottom: "1.25rem",
            background: isSlaBreach ? "#fff5f5" : "#fffbeb",
            borderLeft: `4px solid ${isSlaBreach ? "var(--clr-red)" : "var(--clr-amber)"}`,
            borderRadius: "8px",
            padding: "0.85rem 1.25rem",
            boxShadow: "0 1px 4px rgba(0,0,0,0.04)",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: "0.5rem",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
            <span style={{ fontSize: "1.2rem" }}>
              {isSlaBreach ? "🚨" : "⚠️"}
            </span>
            <div>
              <strong
                style={{
                  color: isSlaBreach ? "var(--clr-red)" : "#92400e",
                  fontSize: "0.92rem",
                }}
              >
                {isSlaBreach
                  ? `SLA समय-सीमा उल्लंघन (${daysPending} दिन लंबित)`
                  : "विशेष ध्यान आकर्षित सूचना"}
              </strong>
              {app.flagNote && (
                <div style={{ fontSize: "0.84rem", color: "var(--clr-text)" }}>
                  {app.flagNote}
                </div>
              )}
            </div>
          </div>
          <span style={{ fontSize: "0.8rem", color: "var(--clr-text-secondary)" }}>
            आवेदन तिथि:{" "}
            {new Date(app.submittedAt).toLocaleDateString("hi-IN", {
              day: "2-digit",
              month: "short",
              year: "numeric",
            })}
          </span>
        </div>
      )}

      {/* Main Grid: Left = Details, Right = AI & Action */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(360px, 1fr))",
          gap: "1.5rem",
          alignItems: "start",
        }}
      >
        {/* LEFT COLUMN: Applicant Details & Documents */}
        <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
          {/* Card 1: Applicant Details */}
          <div
            style={{
              background: "white",
              borderRadius: "12px",
              border: "1px solid var(--clr-border)",
              padding: "1.5rem",
              boxShadow: "0 2px 10px rgba(15,46,94,0.05)",
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                borderBottom: "2px solid var(--clr-border)",
                paddingBottom: "0.75rem",
                marginBottom: "1.25rem",
              }}
            >
              <h2
                style={{
                  fontSize: "1.25rem",
                  fontWeight: 700,
                  color: "var(--clr-navy)",
                  display: "flex",
                  alignItems: "center",
                  gap: "0.5rem",
                }}
              >
                <span>👤</span> आवेदक विवरण
              </h2>
              <span
                style={{
                  fontSize: "0.8rem",
                  color: "var(--clr-text-secondary)",
                }}
              >
                गाँव: {app.village}
              </span>
            </div>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: "1rem",
              }}
            >
              <Field label="आवेदक का पूरा नाम" value={app.applicantName} />
              <Field label="पिता / पति का नाम" value={app.fatherHusbandName} />

              <Field
                label="जन्म तिथि एवं आयु"
                value={`${new Date(app.dob).toLocaleDateString("hi-IN")} (${age} वर्ष)`}
                highlight={isUnderage ? "red" : undefined}
                note={isUnderage ? "⚠️ न्यूनतम 60 वर्ष आवश्यक" : undefined}
              />

              <Field
                label="वार्षिक आय"
                value={`₹${app.annualIncome.toLocaleString("hi-IN")}`}
                highlight={isIncomeHigh ? "red" : undefined}
                note={isIncomeHigh ? "⚠️ ₹2,00,000 सीमा से अधिक" : undefined}
              />

              <Field label="गाँव" value={app.village} />
              <Field label="तहसील व जिला" value={`${app.tehsil}, ${app.district}`} />

              <Field label="आधार संख्या (मास्क्ड)" value={app.aadhaarMasked} />
              <Field
                label="बैंक खाता धारक का नाम"
                value={app.bankAccountHolder}
                highlight={isBankHolderMismatch ? "red" : undefined}
                note={
                  isBankHolderMismatch
                    ? `⚠️ आवेदक नाम (${app.applicantName}) से भिन्न`
                    : undefined
                }
              />

              <Field label="बैंक खाता सं. (मास्क्ड)" value={app.bankAccountMasked} />
              <Field label="बैंक IFSC कोड" value={app.bankIFSC} />

              <Field
                label="आवेदन जमा करने की तिथि"
                value={`${new Date(app.submittedAt).toLocaleDateString("hi-IN", {
                  day: "2-digit",
                  month: "long",
                  year: "numeric",
                })} (${daysPending} दिन पूर्व)`}
              />
              <Field
                label="वर्तमान आवेदन स्थिति"
                value={statusStyle.label}
              />
            </div>
          </div>

          {/* Card 2: Document Verification Checklist */}
          <div
            style={{
              background: "white",
              borderRadius: "12px",
              border: "1px solid var(--clr-border)",
              padding: "1.5rem",
              boxShadow: "0 2px 10px rgba(15,46,94,0.05)",
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                borderBottom: "2px solid var(--clr-border)",
                paddingBottom: "0.75rem",
                marginBottom: "1rem",
              }}
            >
              <h3
                style={{
                  fontSize: "1.1rem",
                  fontWeight: 700,
                  color: "var(--clr-navy)",
                  display: "flex",
                  alignItems: "center",
                  gap: "0.5rem",
                }}
              >
                <span>📂</span> अनिवार्य दस्तावेज़ सत्यापन
              </h3>
              <span
                style={{
                  fontSize: "0.8rem",
                  fontWeight: 600,
                  color:
                    analysis.missingDocuments.length === 0
                      ? "var(--clr-green)"
                      : "var(--clr-red)",
                }}
              >
                {6 - analysis.missingDocuments.length} / 6 पूर्ण
              </span>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "0.6rem" }}>
              {REQUIRED_DOCUMENTS.map((reqDoc) => {
                const submitted = (app.documentsSubmitted || []).find((d) =>
                  d.toLowerCase().includes(reqDoc.toLowerCase())
                );
                const isExpired =
                  submitted &&
                  (submitted.includes("समाप्त") ||
                    submitted.toLowerCase().includes("expired"));
                const isPresent = Boolean(submitted) && !isExpired;
                const isMissing = !submitted;

                return (
                  <div
                    key={reqDoc}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      padding: "0.6rem 0.85rem",
                      borderRadius: "8px",
                      background: isMissing
                        ? "var(--clr-red-light)"
                        : isExpired
                        ? "var(--clr-amber-light)"
                        : "#f8fafc",
                      border: `1px solid ${
                        isMissing
                          ? "#fca5a5"
                          : isExpired
                          ? "#fcd34d"
                          : "var(--clr-border)"
                      }`,
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                      <span style={{ fontSize: "1rem" }}>
                        {isMissing ? "❌" : isExpired ? "⚠️" : "✅"}
                      </span>
                      <span
                        style={{
                          fontWeight: isMissing ? 700 : 500,
                          color: isMissing ? "var(--clr-red)" : "var(--clr-text)",
                          fontSize: "0.88rem",
                        }}
                      >
                        {reqDoc}
                      </span>
                    </div>

                    <div>
                      {isMissing && (
                        <span
                          style={{
                            fontSize: "0.75rem",
                            color: "var(--clr-red)",
                            fontWeight: 700,
                            background: "white",
                            padding: "0.2rem 0.5rem",
                            borderRadius: "4px",
                            border: "1px solid #fca5a5",
                          }}
                        >
                          लापता (Missing)
                        </span>
                      )}
                      {isExpired && (
                        <span
                          style={{
                            fontSize: "0.75rem",
                            color: "#92400e",
                            fontWeight: 700,
                            background: "white",
                            padding: "0.2rem 0.5rem",
                            borderRadius: "4px",
                            border: "1px solid #fcd34d",
                          }}
                        >
                          वैधता समाप्त
                        </span>
                      )}
                      {isPresent && (
                        <span
                          style={{
                            fontSize: "0.75rem",
                            color: "var(--clr-green)",
                            fontWeight: 600,
                            background: "white",
                            padding: "0.2rem 0.5rem",
                            borderRadius: "4px",
                            border: "1px solid #a8d5bb",
                          }}
                        >
                          संलग्न ✓
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: AI Assistance & Officer Decision Panel */}
        <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
          {/* Card 3: AI Assistance Panel */}
          <div
            style={{
              background: "white",
              borderRadius: "12px",
              border: "2px solid #3b82f6",
              boxShadow: "0 4px 20px rgba(59,130,246,0.12)",
              overflow: "hidden",
            }}
          >
            {/* AI Panel Header */}
            <div
              style={{
                background: "linear-gradient(90deg, #1e3a8a 0%, #2563eb 100%)",
                color: "white",
                padding: "0.9rem 1.25rem",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
                <span style={{ fontSize: "1.4rem" }}>🤖</span>
                <div>
                  <div style={{ fontWeight: 700, fontSize: "1.05rem" }}>
                    एआई समीक्षा सहायक (AI Assistance)
                  </div>
                  <div style={{ fontSize: "0.72rem", opacity: 0.85 }}>
                    स्रोत:{" "}
                    {analysis.source === "GEMINI_AI"
                      ? "Google Gemini 2.5 Flash"
                      : "नियम-आधारित सत्यापन इंजन (Rule Engine)"}
                  </div>
                </div>
              </div>

              <button
                onClick={handleRefreshAi}
                disabled={isRefreshingAi}
                style={{
                  background: "rgba(255,255,255,0.18)",
                  border: "1px solid rgba(255,255,255,0.35)",
                  borderRadius: "6px",
                  color: "white",
                  padding: "0.35rem 0.75rem",
                  fontSize: "0.78rem",
                  cursor: isRefreshingAi ? "not-allowed" : "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: "0.35rem",
                  fontFamily: "var(--font-devanagari)",
                }}
              >
                {isRefreshingAi ? "🔄 विश्लेषण जारी..." : "🔄 दोबारा विश्लेषण करें"}
              </button>
            </div>

            {/* Clear note near AI panel */}
            <div
              style={{
                background: "#f8fafc",
                padding: "0.6rem 1.25rem",
                fontSize: "0.82rem",
                borderBottom: "1px solid var(--clr-border)",
                color: "var(--clr-navy)",
                fontWeight: 600,
                display: "flex",
                alignItems: "center",
                gap: "0.4rem",
              }}
            >
              <span>ℹ️</span>
              <span>AI केवल सुझाव देता है, अंतिम निर्णय अधिकारी का है।</span>
            </div>

            <div style={{ padding: "1.25rem", display: "flex", flexDirection: "column", gap: "1.2rem" }}>
              {/* Fallback Message when AI is unavailable */}
              {analysis.source === "RULE_ENGINE" && (
                <div
                  style={{
                    background: "var(--clr-amber-light)",
                    border: "1px solid #fcd34d",
                    borderRadius: "8px",
                    padding: "0.65rem 0.9rem",
                    fontSize: "0.82rem",
                    color: "#92400e",
                    fontWeight: 600,
                    lineHeight: 1.4,
                  }}
                >
                  ⚠️{" "}
                  {analysis.fallbackMessage ||
                    "एआई सेवा अनुपलब्ध होने के कारण स्थानीय नियम-आधारित विश्लेषण प्रदर्शित है।"}
                </div>
              )}

              {/* AI Summary */}
              <div>
                <div
                  style={{
                    fontSize: "0.82rem",
                    fontWeight: 700,
                    color: "var(--clr-navy)",
                    marginBottom: "0.35rem",
                    textTransform: "uppercase",
                    letterSpacing: "0.03em",
                  }}
                >
                  📝 आवेदन का सारांश (Summary)
                </div>
                <div
                  style={{
                    background: "var(--clr-surface)",
                    border: "1px solid var(--clr-border)",
                    borderRadius: "8px",
                    padding: "0.85rem",
                    fontSize: "0.9rem",
                    lineHeight: 1.5,
                    color: "var(--clr-text)",
                  }}
                >
                  {analysis.summary}
                </div>
              </div>

              {/* Missing Documents list */}
              {analysis.missingDocuments.length > 0 && (
                <div>
                  <div
                    style={{
                      fontSize: "0.82rem",
                      fontWeight: 700,
                      color: "var(--clr-red)",
                      marginBottom: "0.4rem",
                    }}
                  >
                    🚫 लापता दस्तावेज़ ({analysis.missingDocuments.length})
                  </div>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: "0.4rem" }}>
                    {analysis.missingDocuments.map((doc) => (
                      <span
                        key={doc}
                        style={{
                          background: "var(--clr-red-light)",
                          color: "var(--clr-red)",
                          border: "1px solid #f87171",
                          borderRadius: "6px",
                          padding: "0.25rem 0.65rem",
                          fontSize: "0.82rem",
                          fontWeight: 600,
                        }}
                      >
                        ✗ {doc}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Inconsistencies with exact field/document citation */}
              <div>
                <div
                  style={{
                    fontSize: "0.82rem",
                    fontWeight: 700,
                    color: "var(--clr-navy)",
                    marginBottom: "0.4rem",
                    display: "flex",
                    justifyContent: "space-between",
                  }}
                >
                  <span>⚠️ पहचानी गई विसंगतियाँ (Citing Source Field/Document)</span>
                  <span style={{ fontSize: "0.75rem", color: "var(--clr-text-secondary)" }}>
                    कुल: {analysis.inconsistencies.length}
                  </span>
                </div>

                {analysis.inconsistencies.length === 0 ? (
                  <div
                    style={{
                      background: "var(--clr-green-light)",
                      border: "1px solid #a8d5bb",
                      borderRadius: "8px",
                      padding: "0.75rem",
                      fontSize: "0.86rem",
                      color: "var(--clr-green)",
                      fontWeight: 600,
                    }}
                  >
                    ✓ कोई विसंगति नहीं पाई गई। आवेदन के सभी फ़ील्ड व दस्तावेज़ पूर्ण हैं।
                  </div>
                ) : (
                  <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                    {analysis.inconsistencies.map((item, idx) => {
                      const isCrit = item.severity === "CRITICAL";
                      const isWarn = item.severity === "WARNING";
                      const borderCol = isCrit ? "#fca5a5" : isWarn ? "#fcd34d" : "var(--clr-border)";
                      const bgCol = isCrit ? "#fff5f5" : isWarn ? "#fffbeb" : "#f8fafc";
                      const badgeText = isCrit ? "गंभीर" : isWarn ? "चेतावनी" : "सूचना";
                      const badgeColor = isCrit ? "var(--clr-red)" : isWarn ? "#92400e" : "var(--clr-navy)";

                      return (
                        <div
                          key={idx}
                          style={{
                            border: `1px solid ${borderCol}`,
                            background: bgCol,
                            borderRadius: "8px",
                            padding: "0.65rem 0.85rem",
                            fontSize: "0.86rem",
                          }}
                        >
                          <div
                            style={{
                              display: "flex",
                              justifyContent: "space-between",
                              alignItems: "center",
                              marginBottom: "0.25rem",
                            }}
                          >
                            <span
                              style={{
                                fontWeight: 700,
                                color: "var(--clr-navy)",
                                fontSize: "0.82rem",
                              }}
                            >
                              📌 स्रोत फ़ील्ड / दस्तावेज़: {item.fieldOrDoc}
                            </span>
                            <span
                              style={{
                                fontSize: "0.7rem",
                                fontWeight: 700,
                                color: badgeColor,
                                background: "white",
                                border: `1px solid ${borderCol}`,
                                borderRadius: "4px",
                                padding: "0.1rem 0.4rem",
                              }}
                            >
                              {badgeText}
                            </span>
                          </div>
                          <div style={{ color: "var(--clr-text)", lineHeight: 1.4 }}>
                            {item.issue}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* AI Suggested Decision Banner */}
              <div
                style={{
                  border: `2px solid ${
                    analysis.suggestedDecision === "APPROVE"
                      ? "var(--clr-green)"
                      : analysis.suggestedDecision === "REJECT"
                      ? "var(--clr-red)"
                      : "#d97706"
                  }`,
                  background:
                    analysis.suggestedDecision === "APPROVE"
                      ? "var(--clr-green-light)"
                      : analysis.suggestedDecision === "REJECT"
                      ? "var(--clr-red-light)"
                      : "var(--clr-amber-light)",
                  borderRadius: "10px",
                  padding: "1rem",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    marginBottom: "0.6rem",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: "0.45rem" }}>
                    <span style={{ fontSize: "1.3rem" }}>
                      {analysis.suggestedDecision === "APPROVE"
                        ? "✅"
                        : analysis.suggestedDecision === "REJECT"
                        ? "❌"
                        : "↩️"}
                    </span>
                    <span
                      style={{
                        fontWeight: 700,
                        fontSize: "1rem",
                        color:
                          analysis.suggestedDecision === "APPROVE"
                            ? "var(--clr-green)"
                            : analysis.suggestedDecision === "REJECT"
                            ? "var(--clr-red)"
                            : "#92400e",
                      }}
                    >
                      AI सुझाई गई कार्यवाही:{" "}
                      {analysis.suggestedDecision === "APPROVE"
                        ? "स्वीकृत करें (Approve)"
                        : analysis.suggestedDecision === "REJECT"
                        ? "अस्वीकृत करें (Reject)"
                        : "दस्तावेज़ हेतु वापस लौटाएं (Return)"}
                    </span>
                  </div>

                  {app.status === "PENDING" && (
                    <button
                      onClick={handlePrefillAiReason}
                      type="button"
                      style={{
                        background: "white",
                        border: "1px solid var(--clr-border)",
                        borderRadius: "6px",
                        padding: "0.3rem 0.65rem",
                        fontSize: "0.75rem",
                        fontWeight: 600,
                        color: "var(--clr-navy)",
                        cursor: "pointer",
                        boxShadow: "0 1px 3px rgba(0,0,0,0.06)",
                      }}
                    >
                      📋 AI कारण कॉपी करें
                    </button>
                  )}
                </div>

                {/* AI Reasons bullets */}
                <div style={{ paddingLeft: "1.2rem", fontSize: "0.85rem", color: "var(--clr-text)" }}>
                  <ul style={{ margin: 0, padding: 0 }}>
                    {analysis.reasons.map((r, i) => (
                      <li key={i} style={{ marginBottom: "0.25rem", lineHeight: 1.4 }}>
                        {r}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          </div>

          {/* Card 4: Officer Action & Mandatory Reason Panel */}
          <div
            style={{
              background: "white",
              borderRadius: "12px",
              border: "1px solid var(--clr-border)",
              padding: "1.5rem",
              boxShadow: "0 2px 10px rgba(15,46,94,0.05)",
            }}
          >
            <div
              style={{
                borderBottom: "2px solid var(--clr-border)",
                paddingBottom: "0.75rem",
                marginBottom: "1.25rem",
              }}
            >
              <h3
                style={{
                  fontSize: "1.2rem",
                  fontWeight: 700,
                  color: "var(--clr-navy)",
                  display: "flex",
                  alignItems: "center",
                  gap: "0.5rem",
                }}
              >
                <span>🖋️</span> अधिकारी का निर्णय एवं कार्यवाही
              </h3>
              <p style={{ fontSize: "0.8rem", color: "var(--clr-text-secondary)", marginTop: "0.2rem" }}>
                अधिकारी के रूप में अपना अंतिम निर्णय चुनें एवं अनिवार्य कारण दर्ज करें।
              </p>
            </div>

            {/* Success message */}
            {successMsg && (
              <div
                style={{
                  background: "var(--clr-green-light)",
                  border: "1px solid #a8d5bb",
                  borderRadius: "8px",
                  padding: "0.85rem 1rem",
                  color: "var(--clr-green)",
                  fontSize: "0.88rem",
                  fontWeight: 600,
                  marginBottom: "1rem",
                }}
              >
                ✅ {successMsg}
              </div>
            )}

            {/* Error message */}
            {formError && (
              <div
                style={{
                  background: "var(--clr-red-light)",
                  border: "1px solid #fca5a5",
                  borderRadius: "8px",
                  padding: "0.85rem 1rem",
                  color: "var(--clr-red)",
                  fontSize: "0.88rem",
                  fontWeight: 600,
                  marginBottom: "1rem",
                }}
              >
                ⚠️ {formError}
              </div>
            )}

            {/* If Application is NOT PENDING, render READ-ONLY VIEW */}
            {app.status !== "PENDING" ? (
              <div
                style={{
                  background: "#f8fafc",
                  border: "1.5px solid var(--clr-border)",
                  borderRadius: "10px",
                  padding: "1.25rem",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "0.6rem", marginBottom: "0.75rem" }}>
                  <span style={{ fontSize: "1.2rem" }}>🔒</span>
                  <span style={{ fontWeight: 700, fontSize: "0.95rem", color: "var(--clr-navy)" }}>
                    इस आवेदन पर अंतिम निर्णय दर्ज हो चुका है (Read-only):
                  </span>
                  <span
                    style={{
                      background: statusStyle.bg,
                      color: statusStyle.text,
                      border: `1px solid ${statusStyle.border}`,
                      borderRadius: "999px",
                      padding: "0.25rem 0.8rem",
                      fontSize: "0.82rem",
                      fontWeight: 700,
                    }}
                  >
                    {statusStyle.label}
                  </span>
                </div>
                <p style={{ fontSize: "0.82rem", color: "var(--clr-text-secondary)", lineHeight: 1.5 }}>
                  इस आवेदन पर कार्यवाही पूर्ण हो चुकी है। ऑडिट ट्रेल एवं पारदर्शिता नियमों के अंतर्गत दोहरा निर्णय दर्ज नहीं किया जा सकता।
                </p>
              </div>
            ) : (
              <>
                {/* Decision selector buttons */}
                <div style={{ marginBottom: "1.25rem" }}>
                  <div
                    style={{
                      fontSize: "0.85rem",
                      fontWeight: 600,
                      color: "var(--clr-text-secondary)",
                      marginBottom: "0.5rem",
                    }}
                  >
                    निर्णय चुनें (आवश्यक):
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "0.75rem" }}>
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedDecision("APPROVE");
                        setFormError(null);
                      }}
                      style={{
                        padding: "0.75rem 0.5rem",
                        borderRadius: "8px",
                        border: `2px solid ${
                          selectedDecision === "APPROVE" ? "var(--clr-green)" : "var(--clr-border)"
                        }`,
                        background:
                          selectedDecision === "APPROVE" ? "var(--clr-green-light)" : "white",
                        color:
                          selectedDecision === "APPROVE" ? "var(--clr-green)" : "var(--clr-text)",
                        fontWeight: 700,
                        fontSize: "0.9rem",
                        cursor: "pointer",
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        gap: "0.25rem",
                        transition: "all 0.15s",
                        fontFamily: "var(--font-devanagari)",
                      }}
                    >
                      <span style={{ fontSize: "1.2rem" }}>✓</span>
                      <span>स्वीकृत करें</span>
                      <span style={{ fontSize: "0.68rem", opacity: 0.7 }}>Approve</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setSelectedDecision("REJECT");
                        setFormError(null);
                      }}
                      style={{
                        padding: "0.75rem 0.5rem",
                        borderRadius: "8px",
                        border: `2px solid ${
                          selectedDecision === "REJECT" ? "var(--clr-red)" : "var(--clr-border)"
                        }`,
                        background:
                          selectedDecision === "REJECT" ? "var(--clr-red-light)" : "white",
                        color:
                          selectedDecision === "REJECT" ? "var(--clr-red)" : "var(--clr-text)",
                        fontWeight: 700,
                        fontSize: "0.9rem",
                        cursor: "pointer",
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        gap: "0.25rem",
                        transition: "all 0.15s",
                        fontFamily: "var(--font-devanagari)",
                      }}
                    >
                      <span style={{ fontSize: "1.2rem" }}>✗</span>
                      <span>अस्वीकृत करें</span>
                      <span style={{ fontSize: "0.68rem", opacity: 0.7 }}>Reject</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setSelectedDecision("RETURN");
                        setFormError(null);
                      }}
                      style={{
                        padding: "0.75rem 0.5rem",
                        borderRadius: "8px",
                        border: `2px solid ${
                          selectedDecision === "RETURN" ? "#d97706" : "var(--clr-border)"
                        }`,
                        background:
                          selectedDecision === "RETURN" ? "var(--clr-amber-light)" : "white",
                        color:
                          selectedDecision === "RETURN" ? "#92400e" : "var(--clr-text)",
                        fontWeight: 700,
                        fontSize: "0.9rem",
                        cursor: "pointer",
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        gap: "0.25rem",
                        transition: "all 0.15s",
                        fontFamily: "var(--font-devanagari)",
                      }}
                    >
                      <span style={{ fontSize: "1.2rem" }}>↩</span>
                      <span>वापस लौटाएं</span>
                      <span style={{ fontSize: "0.68rem", opacity: 0.7 }}>Return</span>
                    </button>
                  </div>
                </div>

                {/* Mandatory Reason Textarea */}
                <div style={{ marginBottom: "1.25rem" }}>
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      marginBottom: "0.35rem",
                    }}
                  >
                    <label
                      htmlFor="reasonInput"
                      style={{
                        fontSize: "0.85rem",
                        fontWeight: 600,
                        color: "var(--clr-text)",
                      }}
                    >
                      निर्णय का कारण (अनिवार्य, न्यूनतम 10 अक्षर) <span style={{ color: "var(--clr-red)" }}>*</span>
                    </label>
                    <button
                      type="button"
                      onClick={handlePrefillAiReason}
                      style={{
                        fontSize: "0.75rem",
                        color: "var(--clr-navy-mid)",
                        background: "none",
                        border: "none",
                        cursor: "pointer",
                        textDecoration: "underline",
                      }}
                    >
                      AI का सुझाव यहाँ भरें
                    </button>
                  </div>

                  <textarea
                    id="reasonInput"
                    value={reason}
                    onChange={(e) => {
                      setReason(e.target.value);
                      if (formError) setFormError(null);
                    }}
                    rows={3}
                    placeholder="यहाँ निर्णय का स्पष्ट व ठोस कारण लिखें (उदा. सभी दस्तावेज़ पूर्ण व पात्र पाए गए, अथवा आयु पात्रता से कम है)..."
                    style={{
                      width: "100%",
                      padding: "0.75rem",
                      borderRadius: "8px",
                      border: `1.5px solid ${formError && reason.trim().length < 10 ? "var(--clr-red)" : "var(--clr-border)"}`,
                      fontSize: "0.9rem",
                      fontFamily: "var(--font-devanagari)",
                      lineHeight: 1.4,
                      outline: "none",
                    }}
                  />
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      fontSize: "0.75rem",
                      color: reason.trim().length < 10 ? "var(--clr-red)" : "var(--clr-text-secondary)",
                      marginTop: "0.25rem",
                    }}
                  >
                    <span>कम से कम 10 अक्षर आवश्यक हैं।</span>
                    <span>{reason.trim().length} / 10 अक्षर</span>
                  </div>
                </div>

                {/* Submit Action Button */}
                <button
                  type="button"
                  onClick={handleOpenConfirm}
                  disabled={isPending}
                  style={{
                    width: "100%",
                    padding: "0.85rem",
                    borderRadius: "8px",
                    background: "linear-gradient(135deg, #0f2e5e, #1a3f7a)",
                    color: "white",
                    border: "none",
                    fontSize: "0.95rem",
                    fontWeight: 700,
                    cursor: isPending ? "not-allowed" : "pointer",
                    boxShadow: "0 2px 8px rgba(15,46,94,0.25)",
                    transition: "opacity 0.15s",
                    opacity: isPending ? 0.7 : 1,
                    fontFamily: "var(--font-devanagari)",
                  }}
                >
                  {isPending ? "निर्णय दर्ज किया जा रहा है..." : "✓ निर्णय सुरक्षित करें"}
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Confirmation Modal */}
      {showConfirmModal && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: "rgba(15, 46, 94, 0.6)",
            backdropFilter: "blur(4px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 9999,
            padding: "1rem",
          }}
        >
          <div
            style={{
              background: "white",
              borderRadius: "12px",
              padding: "1.75rem",
              maxWidth: "500px",
              width: "100%",
              boxShadow: "0 10px 30px rgba(0,0,0,0.2)",
              border: "1px solid var(--clr-border)",
            }}
          >
            <h4
              style={{
                fontSize: "1.2rem",
                fontWeight: 700,
                color: "var(--clr-navy)",
                marginBottom: "0.75rem",
              }}
            >
              ⚠️ क्या आप वाकई यह निर्णय दर्ज करना चाहते हैं?
            </h4>
            <p style={{ fontSize: "0.88rem", color: "var(--clr-text-secondary)", marginBottom: "1rem", lineHeight: 1.5 }}>
              एक बार दर्ज होने के बाद यह निर्णय स्थायी रूप से सुरक्षित हो जाएगा तथा ऑडिट ट्रेल में प्रविष्ट किया जाएगा।
            </p>

            <div
              style={{
                background: "#f8fafc",
                padding: "0.85rem",
                borderRadius: "8px",
                border: "1px solid var(--clr-border)",
                marginBottom: "1.25rem",
                fontSize: "0.86rem",
              }}
            >
              <div>
                <strong>चयनित निर्णय:</strong>{" "}
                <span style={{ fontWeight: 700, color: "var(--clr-navy)" }}>
                  {selectedDecision === "APPROVE"
                    ? "स्वीकृत करें (Approve)"
                    : selectedDecision === "REJECT"
                    ? "अस्वीकृत करें (Reject)"
                    : "वापस लौटाएं (Return)"}
                </span>
              </div>
              <div style={{ marginTop: "0.35rem" }}>
                <strong>दर्ज कारण:</strong> {reason}
              </div>
            </div>

            <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.75rem" }}>
              <button
                type="button"
                onClick={() => setShowConfirmModal(false)}
                style={{
                  padding: "0.5rem 1rem",
                  borderRadius: "6px",
                  border: "1px solid var(--clr-border)",
                  background: "white",
                  color: "var(--clr-text-secondary)",
                  cursor: "pointer",
                  fontSize: "0.88rem",
                  fontWeight: 600,
                }}
              >
                रद्द करें
              </button>
              <button
                type="button"
                onClick={handleConfirmDecision}
                disabled={isPending}
                style={{
                  padding: "0.5rem 1.25rem",
                  borderRadius: "6px",
                  border: "none",
                  background: "var(--clr-navy)",
                  color: "white",
                  cursor: isPending ? "not-allowed" : "pointer",
                  fontSize: "0.88rem",
                  fontWeight: 700,
                }}
              >
                हाँ, निर्णय दर्ज करें
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Card 5: Audit Log History */}
      <div
        style={{
          marginTop: "2rem",
          background: "white",
          borderRadius: "12px",
          border: "1px solid var(--clr-border)",
          padding: "1.5rem",
          boxShadow: "0 2px 10px rgba(15,46,94,0.05)",
        }}
      >
        <div
          style={{
            borderBottom: "2px solid var(--clr-border)",
            paddingBottom: "0.75rem",
            marginBottom: "1rem",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <h3
            style={{
              fontSize: "1.1rem",
              fontWeight: 700,
              color: "var(--clr-navy)",
              display: "flex",
              alignItems: "center",
              gap: "0.5rem",
            }}
          >
            <span>📜</span> ऑडिट ट्रेल एवं इतिहास (Audit Log)
          </h3>
          <span style={{ fontSize: "0.8rem", color: "var(--clr-text-secondary)" }}>
            कुल प्रविष्टियाँ: {app.auditLogs.length}
          </span>
        </div>

        {app.auditLogs.length === 0 ? (
          <div
            style={{
              padding: "1.5rem",
              textAlign: "center",
              color: "var(--clr-text-secondary)",
              fontSize: "0.88rem",
            }}
          >
            इस आवेदन पर अभी तक कोई पूर्व कार्यवाही दर्ज नहीं हुई है।
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
            {app.auditLogs.map((log) => {
              const isApproved = log.action === "स्वीकृत";
              const isRejected = log.action === "अस्वीकृत";
              const borderCol = isApproved
                ? "var(--clr-green)"
                : isRejected
                ? "var(--clr-red)"
                : "var(--clr-amber)";

              return (
                <div
                  key={log.id}
                  style={{
                    borderLeft: `4px solid ${borderCol}`,
                    background: "#f8fafc",
                    borderRadius: "0 8px 8px 0",
                    padding: "0.75rem 1rem",
                    border: "1px solid var(--clr-border)",
                    borderLeftWidth: "4px",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      marginBottom: "0.25rem",
                      flexWrap: "wrap",
                      gap: "0.5rem",
                    }}
                  >
                    <div>
                      <strong style={{ color: "var(--clr-navy)", fontSize: "0.9rem" }}>
                        {log.officer.name}
                      </strong>
                      <span
                        style={{
                          fontSize: "0.78rem",
                          color: "var(--clr-text-secondary)",
                          marginLeft: "0.4rem",
                        }}
                      >
                        ({log.officer.designation || "तहसीलदार"})
                      </span>
                    </div>

                    <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
                      {log.overridden && (
                        <span
                          style={{
                            background: "#fef3c7",
                            color: "#92400e",
                            border: "1px solid #fcd34d",
                            fontSize: "0.72rem",
                            fontWeight: 700,
                            padding: "0.15rem 0.5rem",
                            borderRadius: "4px",
                          }}
                        >
                          ⚠️ AI सुझाव से भिन्न निर्णय
                        </span>
                      )}

                      <span
                        style={{
                          background: isApproved
                            ? "var(--clr-green-light)"
                            : isRejected
                            ? "var(--clr-red-light)"
                            : "var(--clr-amber-light)",
                          color: isApproved
                            ? "var(--clr-green)"
                            : isRejected
                            ? "var(--clr-red)"
                            : "#92400e",
                          fontWeight: 700,
                          fontSize: "0.78rem",
                          padding: "0.15rem 0.5rem",
                          borderRadius: "4px",
                        }}
                      >
                        {log.action}
                      </span>
                      <span style={{ fontSize: "0.75rem", color: "var(--clr-text-secondary)" }}>
                        {new Date(log.createdAt).toLocaleString("hi-IN", {
                          day: "2-digit",
                          month: "short",
                          year: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                    </div>
                  </div>

                  {log.reason && (
                    <div
                      style={{
                        fontSize: "0.86rem",
                        color: "var(--clr-text)",
                        marginTop: "0.35rem",
                        lineHeight: 1.4,
                      }}
                    >
                      <strong>कारण:</strong> {log.reason}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

function Field({
  label,
  value,
  highlight,
  note,
}: {
  label: string;
  value: string;
  highlight?: "red";
  note?: string;
}) {
  return (
    <div>
      <div
        style={{
          fontSize: "0.76rem",
          color: "var(--clr-text-secondary)",
          marginBottom: "0.2rem",
          fontWeight: 500,
        }}
      >
        {label}
      </div>
      <div
        style={{
          fontWeight: 600,
          color: highlight === "red" ? "var(--clr-red)" : "var(--clr-text)",
          fontSize: "0.92rem",
        }}
      >
        {value}
      </div>
      {note && (
        <div style={{ fontSize: "0.72rem", color: "var(--clr-red)", marginTop: "0.15rem" }}>
          {note}
        </div>
      )}
    </div>
  );
}
