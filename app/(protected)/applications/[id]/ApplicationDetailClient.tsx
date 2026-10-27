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

const PRESET_REASONS: Record<DecisionType, string[]> = {
  APPROVE: [
    "सभी 6 अनिवार्य दस्तावेज़ संलग्न एवं आयु (60+ वर्ष) व वार्षिक आय वैधानिक मानकों के अनुरूप सत्यापित हैं।",
    "बैंक खाता आवेदक के नाम पर सत्यापित पाया गया। डीबीटी अंतरण हेतु पेंशन स्वीकृति प्रदान की जाती है।",
  ],
  REJECT: [
    "आवेदक की आयु 60 वर्ष से कम होने के कारण हरियाणा वृद्धावस्था सम्मान भत्ता नियम 1991 के तहत अपात्र।",
    "वार्षिक आय ₹2,00,000 की वैधानिक सीमा से अधिक होने के कारण आवेदन निरस्त किया जाता है।",
  ],
  RETURN: [
    "अनिवार्य दस्तावेज़ (आय प्रमाण पत्र / बैंक पासबुक) संलग्न करने हेतु आवेदन वापस लौटाया जाता है।",
    "बैंक खाता धारक का नाम आवेदक के नाम से भिन्न है, सही खाता विवरण संलग्न करने हेतु वापस लौटाएं।",
  ],
};

const AVATAR_GRADIENTS = [
  "linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)",
  "linear-gradient(135deg, #f59e0b 0%, #d97706 100%)",
  "linear-gradient(135deg, #10b981 0%, #059669 100%)",
  "linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)",
  "linear-gradient(135deg, #ec4899 0%, #be185d 100%)",
  "linear-gradient(135deg, #8b5cf6 0%, #6d28d9 100%)",
];

function getAvatarGradient(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash += name.charCodeAt(i);
  return AVATAR_GRADIENTS[hash % AVATAR_GRADIENTS.length];
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
  const [copiedId, setCopiedId] = useState(false);

  // Officer decision form state
  const [selectedDecision, setSelectedDecision] = useState<DecisionType | null>(null);
  const [reason, setReason] = useState("");
  const [formError, setFormError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [isPending, startTransition] = useTransition();

  const age = calculateAge(new Date(app.dob));
  const daysPending = calculateDaysPending(new Date(app.submittedAt));
  const isSlaBreach = isSlaBreached(new Date(app.submittedAt), app.status);
  const isUnderage = age < MIN_AGE_YEARS;
  const isIncomeHigh = app.annualIncome > MAX_ANNUAL_INCOME_INR;
  const isBankHolderMismatch =
    app.applicantName.trim().toLowerCase() !== app.bankAccountHolder.trim().toLowerCase();

  // Copy ID helper
  const handleCopyId = () => {
    navigator.clipboard.writeText(app.id);
    setCopiedId(true);
    setTimeout(() => setCopiedId(false), 2000);
  };

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
    setSelectedDecision(analysis.suggestedDecision);
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
      setFormError("निर्णय हेतु स्पष्ट कारण दर्ज करना अनिवार्य है (कम से कम 10 अक्षर आवश्यक हैं)।");
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
    { label: string; bg: string; text: string; border: string; dot: string }
  > = {
    PENDING: { label: "लंबित", bg: "#fff7ed", text: "#c2410c", border: "#fed7aa", dot: "#f97316" },
    APPROVED: { label: "स्वीकृत", bg: "#ecfdf5", text: "#047857", border: "#a7f3d0", dot: "#10b981" },
    REJECTED: { label: "अस्वीकृत", bg: "#fef2f2", text: "#b91c1c", border: "#fecaca", dot: "#ef4444" },
    RETURNED: { label: "वापस", bg: "#fffbeb", text: "#b45309", border: "#fde68a", dot: "#f59e0b" },
  };

  const statusStyle = statusBadges[app.status] || statusBadges.PENDING;
  const isOverriddenChoice = selectedDecision && selectedDecision !== analysis.suggestedDecision;

  return (
    <div style={{ fontFamily: "var(--font-devanagari)", paddingBottom: "4rem" }}>
      {/* ─── Top Sticky Command Bar ────────────────────────────────────────── */}
      <div className="command-bar executive-card glass-panel">
        <div className="command-left">
          <Link href="/dashboard" className="btn-back">
            <span className="btn-back-arrow">←</span>
            <span>डैशबोर्ड</span>
          </Link>

          <button
            type="button"
            onClick={handleCopyId}
            className="applicant-id-pill"
            title="आवेदन आईडी कॉपी करें"
          >
            <span className="id-label">आवेदन सं:</span>
            <code className="id-code">{app.id}</code>
            <span className="copy-icon">{copiedId ? "✓ कॉपी हुआ" : "📋"}</span>
          </button>

          <span
            className="status-pill"
            style={{
              background: statusStyle.bg,
              color: statusStyle.text,
              border: `1.5px solid ${statusStyle.border}`,
            }}
          >
            <span className="dot" style={{ background: statusStyle.dot }}></span>
            {statusStyle.label}
          </span>

          {app.priority === "HIGH" && (
            <span className="badge-high-priority">
              ⚠️ उच्च प्राथमिकता
            </span>
          )}

          {isSlaBreach && (
            <span className="badge-sla-breached">
              <span className="sla-dot pulse-dot"></span>
              🚨 SLA अतिदेय ({daysPending} दिन)
            </span>
          )}
        </div>

        <div className="command-right">
          <span className="sub-date">
            📅 आवेदन तिथि:{" "}
            <strong>
              {new Date(app.submittedAt).toLocaleDateString("hi-IN", {
                day: "2-digit",
                month: "short",
                year: "numeric",
              })}
            </strong>{" "}
            ({daysPending} दिन पूर्व)
          </span>
        </div>
      </div>

      {/* ─── Citizen Dossier Hero Card ─────────────────────────────────────── */}
      <div className="applicant-hero-card executive-card">
        <div
          className="hero-avatar"
          style={{ background: getAvatarGradient(app.applicantName) }}
        >
          {app.applicantName[0]}
        </div>
        <div className="hero-info">
          <div className="hero-title-row">
            <h1 className="hero-applicant-name">
              {app.applicantName}
              <span className="verified-badge" title="पंजीकृत आवेदक">✓</span>
            </h1>
            <span className="hero-sub-relation">
              आत्मज/पत्नी: <strong>{app.fatherHusbandName}</strong>
            </span>
          </div>

          <div className="hero-tags-row">
            <span className="tag-item">📍 {app.village}, तहसील {app.tehsil}, जिला {app.district}</span>
            <span className="tag-item">🆔 आधार: {app.aadhaarMasked}</span>
            <span className="tag-item">⏱️ प्रतीक्षा काल: {daysPending} दिन</span>
          </div>

          {/* Quick Eligibility Snapshot Pills */}
          <div className="hero-snapshot-row">
            <span className={`snapshot-pill ${age >= 60 ? "snap-pass" : "snap-fail"}`}>
              {age >= 60 ? "✓ आयु पात्र" : "✕ आयु अपात्र"} ({age} वर्ष)
            </span>
            <span className={`snapshot-pill ${app.annualIncome <= 200000 ? "snap-pass" : "snap-fail"}`}>
              {app.annualIncome <= 200000 ? "✓ आय सीमा के अंतर्गत" : "✕ आय सीमा से अधिक"} (₹{app.annualIncome.toLocaleString("hi-IN")})
            </span>
            <span className={`snapshot-pill ${!isBankHolderMismatch ? "snap-pass" : "snap-warn"}`}>
              {!isBankHolderMismatch ? "✓ बैंक खाता सत्यापित" : "⚠️ बैंक खाता नाम भिन्न"}
            </span>
            <span className="snapshot-pill snap-info">
              📂 {6 - analysis.missingDocuments.length}/6 दस्तावेज़ संलग्न
            </span>
          </div>
        </div>
      </div>

      {/* ─── Two-Column Bento Layout ───────────────────────────────────────── */}
      <div className="review-grid">
        {/* LEFT COLUMN: Dossier, Bank, Documents */}
        <div className="column-left">
          {/* Card 1: Personal & Eligibility Dossier */}
          <div className="executive-card detail-card">
            <div className="card-header-styled">
              <div className="card-title-flex">
                <span className="card-header-icon">👤</span>
                <div>
                  <h2 className="card-header-title">व्यक्तिगत एवं पात्रता विवरण</h2>
                  <p className="card-header-sub">हरियाणा वृद्धावस्था पेंशन पात्रता नियम 1991</p>
                </div>
              </div>
            </div>

            <div className="fields-grid">
              <InfoField
                label="आवेदक का पूरा नाम"
                value={app.applicantName}
              />
              <InfoField
                label="पिता / पति का नाम"
                value={app.fatherHusbandName}
              />

              <InfoField
                label="जन्म तिथि एवं आयु"
                value={`${new Date(app.dob).toLocaleDateString("hi-IN")} (${age} वर्ष)`}
                highlight={isUnderage ? "red" : "green"}
                badge={isUnderage ? "अपात्र (<60 वर्ष)" : "पात्र (60+ वर्ष)"}
                note={isUnderage ? "नियम: आवेदक की आयु कम से कम 60 वर्ष पूर्ण होनी चाहिए" : "वैधानिक न्यूनतम आयु 60 वर्ष पूरी है"}
              />

              <InfoField
                label="सत्यापित वार्षिक आय"
                value={`₹${app.annualIncome.toLocaleString("hi-IN")} / वर्ष`}
                highlight={isIncomeHigh ? "red" : "green"}
                badge={isIncomeHigh ? "सीमा से अधिक" : "सीमा के अंतर्गत"}
                note={isIncomeHigh ? "नियम: कुल वार्षिक आय ₹2,00,000 से अधिक न हो" : "वैधानिक सीमा ₹2,00,000 के भीतर"}
              />

              <InfoField
                label="निवास स्थान (गाँव)"
                value={app.village}
              />
              <InfoField
                label="तहसील एवं ज़िला"
                value={`${app.tehsil}, ${app.district}`}
              />

              <InfoField
                label="आधार संख्या (मास्क्ड)"
                value={app.aadhaarMasked}
              />
              <InfoField
                label="आवेदन जमा करने की तिथि"
                value={`${new Date(app.submittedAt).toLocaleDateString("hi-IN", {
                  day: "2-digit",
                  month: "long",
                  year: "numeric",
                })} (${daysPending} दिन पूर्व)`}
              />
            </div>
          </div>

          {/* Card 2: Bank & Financial Verification */}
          <div className="executive-card detail-card">
            <div className="card-header-styled">
              <div className="card-title-flex">
                <span className="card-header-icon">🏦</span>
                <div>
                  <h2 className="card-header-title">बैंक खाता एवं वित्तीय सत्यापन</h2>
                  <p className="card-header-sub">डीबीटी (DBT) पेंशन अंतरण हेतु खाता मिलान</p>
                </div>
              </div>
            </div>

            {/* Bank Name Match Status Banner */}
            <div
              className={`bank-match-banner ${
                isBankHolderMismatch ? "match-banner-mismatch" : "match-banner-success"
              }`}
            >
              <div className="match-icon">
                {isBankHolderMismatch ? "⚠️" : "✓"}
              </div>
              <div>
                <div className="match-title">
                  {isBankHolderMismatch
                    ? "खाता धारक के नाम में भिन्नता (Name Mismatch Detected)"
                    : "खाता धारक का नाम पूर्णतः मेल खाता है"}
                </div>
                <div className="match-desc">
                  आवेदक नाम: <strong>{app.applicantName}</strong> ⟷ बैंक पासबुक:{" "}
                  <strong>{app.bankAccountHolder}</strong>
                </div>
              </div>
            </div>

            <div className="fields-grid" style={{ marginTop: "1rem" }}>
              <InfoField
                label="बैंक खाता धारक का नाम"
                value={app.bankAccountHolder}
                highlight={isBankHolderMismatch ? "red" : undefined}
              />
              <InfoField
                label="खाता संख्या (मास्क्ड)"
                value={app.bankAccountMasked}
              />
              <InfoField
                label="बैंक IFSC कोड"
                value={app.bankIFSC}
              />
              <InfoField
                label="डीबीटी (DBT) अंतरण पात्रता"
                value={isBankHolderMismatch ? "सत्यापन अपेक्षित" : "सक्रिय एवं मान्य"}
                highlight={isBankHolderMismatch ? "red" : "green"}
              />
            </div>
          </div>

          {/* Card 3: Submitted Documents Dossier */}
          <div className="executive-card detail-card">
            <div className="card-header-styled">
              <div className="card-title-flex">
                <span className="card-header-icon">📂</span>
                <div>
                  <h2 className="card-header-title">अनिवार्य दस्तावेज़ सत्यापन पोर्टफोलियो</h2>
                  <p className="card-header-sub">हरियाणा समाज कल्याण नियम अनुसार आवश्यक 6 प्रमाण</p>
                </div>
              </div>
              <span className="doc-count-tag">
                {6 - analysis.missingDocuments.length} / 6 उपलब्ध
              </span>
            </div>

            <div className="docs-list">
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
                    className={`doc-item ${
                      isMissing
                        ? "doc-missing"
                        : isExpired
                        ? "doc-expired"
                        : "doc-valid"
                    }`}
                  >
                    <div className="doc-left">
                      <span className="doc-status-icon">
                        {isMissing ? "❌" : isExpired ? "⚠️" : "✅"}
                      </span>
                      <div>
                        <div className="doc-name">{reqDoc}</div>
                        <div className="doc-status-sub">
                          {isMissing
                            ? "दस्तावेज़ संलग्न नहीं है"
                            : isExpired
                            ? "दस्तावेज़ की समयावधि समाप्त हो चुकी है"
                            : "प्रमाणित व मान्य संलग्नक"}
                        </div>
                      </div>
                    </div>

                    <div className="doc-right">
                      {isMissing && (
                        <span className="doc-pill pill-red">लापता</span>
                      )}
                      {isExpired && (
                        <span className="doc-pill pill-amber">वैधता समाप्त</span>
                      )}
                      {isPresent && (
                        <span className="doc-pill pill-green">संलग्न ✓</span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: AI Copilot & Decision Terminal */}
        <div className="column-right">
          {/* Card 4: Google Gemini AI Copilot Station */}
          <div className="ai-station-card executive-card">
            <div className="ai-station-header">
              <div className="ai-header-left">
                <div className="ai-sparkle-icon">✨</div>
                <div>
                  <div className="ai-header-title">Google Gemini AI समीक्षा सह-पायलट</div>
                  <div className="ai-header-sub">
                    इंजन: {analysis.source === "GEMINI_AI" ? "Gemini 2.5 Flash / Pro" : "स्थानीय नियम इंजन (Rule Engine)"}
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={handleRefreshAi}
                disabled={isRefreshingAi}
                className="btn-refresh-ai"
              >
                {isRefreshingAi ? "विश्लेषण हो रहा है…" : "🔄 पुनः विश्लेषण"}
              </button>
            </div>

            <div className="ai-disclaimer-strip">
              <span>ℹ️</span>
              <span>
                AI केवल नीतिगत सहायता व सिफारिश प्रदान करता है। अंतिम विधिक निर्णय अधिकारी का होगा।
              </span>
            </div>

            <div className="ai-content-body">
              {/* AI Recommendation Banner */}
              <div
                className={`ai-rec-banner rec-${analysis.suggestedDecision.toLowerCase()}`}
              >
                <div className="rec-top">
                  <div className="rec-decision-pill">
                    <span className="rec-icon">
                      {analysis.suggestedDecision === "APPROVE"
                        ? "✅"
                        : analysis.suggestedDecision === "REJECT"
                        ? "❌"
                        : "↩️"}
                    </span>
                    <span className="rec-text">
                      AI सुझाई गई कार्यवाही:{" "}
                      {analysis.suggestedDecision === "APPROVE"
                        ? "स्वीकृत करें (APPROVE)"
                        : analysis.suggestedDecision === "REJECT"
                        ? "अस्वीकृत करें (REJECT)"
                        : "दस्तावेज़ हेतु वापस लौटाएं (RETURN)"}
                    </span>
                  </div>

                  {app.status === "PENDING" && (
                    <button
                      type="button"
                      onClick={handlePrefillAiReason}
                      className="btn-apply-ai"
                    >
                      ⚡ AI सिफ़ारिश लागू करें
                    </button>
                  )}
                </div>

                <p className="rec-summary-text">{analysis.summary}</p>
              </div>

              {/* Actionable Discrepancies (Inconsistencies) with Severity Tags */}
              {analysis.inconsistencies && analysis.inconsistencies.length > 0 && (
                <div className="inconsistencies-section">
                  <div className="section-subtitle">
                    ⚠️ पहचानी गई विसंगतियाँ ({analysis.inconsistencies.length})
                  </div>
                  <div className="inconsistencies-list">
                    {analysis.inconsistencies.map((item, idx) => (
                      <div key={idx} className={`inconsistency-card inc-${item.severity.toLowerCase()}`}>
                        <div className="inc-header">
                          <span className={`inc-severity-tag tag-${item.severity.toLowerCase()}`}>
                            {item.severity === "CRITICAL"
                              ? "🚨 गंभीर (Critical)"
                              : item.severity === "WARNING"
                              ? "⚠️ चेतावनी (Warning)"
                              : "ℹ️ सूचना (Info)"}
                          </span>
                          <span className="inc-field">{item.fieldOrDoc}</span>
                        </div>
                        <p className="inc-issue">{item.issue}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Actionable Findings / Reasons List */}
              <div className="findings-section">
                <div className="findings-header">
                  <span>विस्तृत जाँच निष्कर्ष ({analysis.reasons.length})</span>
                </div>
                <div className="findings-list">
                  {analysis.reasons.map((r, i) => (
                    <div key={i} className="finding-row">
                      <span className="finding-bullet">•</span>
                      <span className="finding-text">{r}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Card 5: Officer Decision Station */}
          <div className="executive-card decision-station-card">
            <div className="card-header-styled">
              <div className="card-title-flex">
                <span className="card-header-icon">🖋️</span>
                <div>
                  <h2 className="card-header-title">कार्यपालक निर्णय केंद्र (Officer Decision)</h2>
                  <p className="card-header-sub">अधिकारी के रूप में अंतिम निर्णय व अनिवार्य टिप्पणी दर्ज करें</p>
                </div>
              </div>
            </div>

            {/* Success Alert */}
            {successMsg && (
              <div className="alert-box alert-success">
                <span>✅</span>
                <span>{successMsg}</span>
              </div>
            )}

            {/* Error Alert */}
            {formError && (
              <div className="alert-box alert-error">
                <span>⚠️</span>
                <span>{formError}</span>
              </div>
            )}

            {/* Read-only view if already decided */}
            {app.status !== "PENDING" ? (
              <div className="already-decided-box">
                <div className="decided-badge-row">
                  <span className="lock-icon">🔒</span>
                  <span className="decided-title">यह आवेदन पूर्व में ही निस्तारित किया जा चुका है:</span>
                  <span
                    className="status-pill"
                    style={{
                      background: statusStyle.bg,
                      color: statusStyle.text,
                      border: `1px solid ${statusStyle.border}`,
                    }}
                  >
                    {statusStyle.label}
                  </span>
                </div>
                <p className="decided-sub">
                  हरियाणा लोक सेवा अधिकार अधिनियम व डिजिटल ऑडिट ट्रेल नियमों के तहत अंतिम रूप से स्वीकृत अथवा अस्वीकृत आवेदनों पर दोहरा निर्णय प्रतिबन्धित है।
                </p>
              </div>
            ) : (
              <div className="decision-form">
                {/* 3 Interactive Decision Option Cards */}
                <div className="decision-cards-group">
                  <label className="section-field-label">अंतिम निर्णय चुनें (अनिवार्य):</label>
                  <div className="decision-options-grid">
                    {/* APPROVE */}
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedDecision("APPROVE");
                        setFormError(null);
                      }}
                      className={`decision-btn opt-approve ${
                        selectedDecision === "APPROVE" ? "opt-active" : ""
                      }`}
                    >
                      <span className="decision-btn-icon">✓</span>
                      <span className="decision-btn-label">स्वीकृत करें</span>
                      <span className="decision-btn-sub">Approve</span>
                    </button>

                    {/* REJECT */}
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedDecision("REJECT");
                        setFormError(null);
                      }}
                      className={`decision-btn opt-reject ${
                        selectedDecision === "REJECT" ? "opt-active" : ""
                      }`}
                    >
                      <span className="decision-btn-icon">✕</span>
                      <span className="decision-btn-label">अस्वीकृत करें</span>
                      <span className="decision-btn-sub">Reject</span>
                    </button>

                    {/* RETURN */}
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedDecision("RETURN");
                        setFormError(null);
                      }}
                      className={`decision-btn opt-return ${
                        selectedDecision === "RETURN" ? "opt-active" : ""
                      }`}
                    >
                      <span className="decision-btn-icon">↩</span>
                      <span className="decision-btn-label">वापस लौटाएं</span>
                      <span className="decision-btn-sub">Return</span>
                    </button>
                  </div>
                </div>

                {/* Quick Presets for Selected Decision */}
                {selectedDecision && PRESET_REASONS[selectedDecision] && (
                  <div className="preset-reasons-wrap">
                    <span className="preset-label">त्वरित कारण चुनें:</span>
                    <div className="preset-buttons">
                      {PRESET_REASONS[selectedDecision].map((p, i) => (
                        <button
                          key={i}
                          type="button"
                          onClick={() => {
                            setReason(p);
                            if (formError) setFormError(null);
                          }}
                          className="preset-btn"
                        >
                          + {p.slice(0, 45)}…
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Override Alert Warning */}
                {isOverriddenChoice && (
                  <div className="override-warning-box">
                    <div className="override-icon">⚠️</div>
                    <div>
                      <div className="override-title">AI सिफ़ारिश से भिन्न निर्णय (Override Alert)</div>
                      <div className="override-desc">
                        आप AI द्वारा सुझाई गई कार्यवाही (
                        <strong>{analysis.suggestedDecision}</strong>) के विपरीत निर्णय ले रहे हैं।
                        ऑडिट ट्रेल में यह प्रविष्टि विशेष रूप से दर्ज की जाएगी। कृपया नीचे ठोस कारण लिखें।
                      </div>
                    </div>
                  </div>
                )}

                {/* Reason Textarea */}
                <div className="reason-input-group">
                  <div className="reason-header-row">
                    <label htmlFor="reasonInput" className="section-field-label">
                      निर्णय का विधिक व तथ्यात्मक कारण <span className="req-star">*</span>
                    </label>
                    <button
                      type="button"
                      onClick={handlePrefillAiReason}
                      className="btn-quick-fill"
                    >
                      📋 AI का सुझाव भरें
                    </button>
                  </div>

                  <textarea
                    id="reasonInput"
                    value={reason}
                    onChange={(e) => {
                      setReason(e.target.value);
                      if (formError) setFormError(null);
                    }}
                    rows={4}
                    placeholder="यहाँ निर्णय का स्पष्ट व आधिकारिक कारण लिखें (उदा. सभी दस्तावेज़ पूर्ण व आयु 60+ सत्यापित होने पर पेंशन स्वीकृत की गई)..."
                    className="reason-textarea"
                  />

                  <div className="reason-footer-row">
                    <span className="char-req">न्यूनतम 10 अक्षर अनिवार्य हैं।</span>
                    <span className={`char-count ${reason.trim().length < 10 ? "char-invalid" : "char-valid"}`}>
                      {reason.trim().length} / 10 अक्षर
                    </span>
                  </div>
                </div>

                {/* Submit Decision Button */}
                <button
                  type="button"
                  onClick={handleOpenConfirm}
                  disabled={isPending}
                  className="btn-submit-decision"
                >
                  {isPending ? "प्रक्रियाधीन…" : "✓ अंतिम निर्णय सुरक्षित करें"}
                </button>
              </div>
            )}
          </div>

          {/* Card 6: Audit Trail Timeline */}
          <div className="executive-card audit-trail-card">
            <div className="card-header-styled">
              <div className="card-title-flex">
                <span className="card-header-icon">📜</span>
                <div>
                  <h2 className="card-header-title">अपरिवर्तनीय डिजिटल ऑडिट ट्रेल</h2>
                  <p className="card-header-sub">अधिकारियों द्वारा की गई सभी कार्यवाहियों का स्थायी रिकॉर्ड</p>
                </div>
              </div>
              <span className="audit-count-badge">
                {app.auditLogs.length} प्रविष्टियाँ
              </span>
            </div>

            {app.auditLogs.length === 0 ? (
              <div className="empty-audit-box">
                <span className="empty-audit-icon">🛡️</span>
                <p>इस आवेदन पर पूर्व में कोई कार्यवाही दर्ज नहीं हुई है। आपका निर्णय पहला ऑडिट रिकॉर्ड बनेगा।</p>
              </div>
            ) : (
              <div className="audit-timeline">
                {app.auditLogs.map((log) => {
                  const isApproved = log.action === "स्वीकृत";
                  const isRejected = log.action === "अस्वीकृत";

                  return (
                    <div
                      key={log.id}
                      className={`timeline-entry ${
                        isApproved
                          ? "entry-approved"
                          : isRejected
                          ? "entry-rejected"
                          : "entry-returned"
                      }`}
                    >
                      <div className="entry-header">
                        <div className="officer-meta">
                          <span className="officer-name">{log.officer.name}</span>
                          <span className="officer-desig">({log.officer.designation || "तहसीलदार"})</span>
                        </div>

                        <div className="entry-badges">
                          {log.overridden && (
                            <span className="badge-override">
                              ⚠️ AI सुझाव से भिन्न निर्णय
                            </span>
                          )}
                          <span className="badge-action">{log.action}</span>
                          <span className="entry-time">
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
                        <div className="entry-reason">
                          <strong>दर्ज कारण:</strong> {log.reason}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ─── Confirmation Modal ────────────────────────────────────────────── */}
      {showConfirmModal && (
        <div className="modal-backdrop">
          <div className="modal-card executive-card">
            <div className="modal-header">
              <div className="modal-icon-wrap">⚠️</div>
              <div>
                <h3 className="modal-title">क्या आप वाकई यह निर्णय दर्ज करना चाहते हैं?</h3>
                <p className="modal-sub">यह निर्णय स्थायी रूप से डेटाबेस व ऑडिट ट्रेल में दर्ज हो जाएगा।</p>
              </div>
            </div>

            <div className="modal-summary-box">
              <div className="summary-line">
                <span className="sum-label">आवेदक:</span>
                <span className="sum-val">{app.applicantName}</span>
              </div>
              <div className="summary-line">
                <span className="sum-label">चयनित निर्णय:</span>
                <span className="sum-val font-bold">
                  {selectedDecision === "APPROVE"
                    ? "स्वीकृत करें (APPROVE)"
                    : selectedDecision === "REJECT"
                    ? "अस्वीकृत करें (REJECT)"
                    : "वापस लौटाएं (RETURN)"}
                </span>
              </div>
              <div className="summary-line">
                <span className="sum-label">दर्ज कारण:</span>
                <span className="sum-val">{reason}</span>
              </div>
            </div>

            <div className="modal-actions">
              <button
                type="button"
                onClick={() => setShowConfirmModal(false)}
                className="btn-modal-cancel"
              >
                रद्द करें
              </button>
              <button
                type="button"
                onClick={handleConfirmDecision}
                className="btn-modal-confirm"
              >
                हाँ, निर्णय पुष्टि करें
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── Scoped Stylesheet for Application Detail ──────────────────────── */}
      <style jsx>{`
        .command-bar {
          padding: 1rem 1.5rem;
          margin-bottom: 1.5rem;
          display: flex;
          align-items: center;
          justify-content: space-between;
          flex-wrap: wrap;
          gap: 1.25rem;
          border-radius: 16px;
        }

        .command-left {
          display: flex;
          align-items: center;
          gap: 0.85rem;
          flex-wrap: wrap;
        }

        .btn-back {
          text-decoration: none;
          background: #ffffff;
          border: 1.5px solid #cbd5e1;
          color: #0b1f3a;
          padding: 0.45rem 0.95rem;
          border-radius: 10px;
          font-size: 0.85rem;
          font-weight: 700;
          display: inline-flex;
          align-items: center;
          gap: 0.5rem;
          transition: all 0.18s ease;
          box-shadow: var(--shadow-xs);
        }

        .btn-back:hover {
          background: #f1f5f9;
          transform: translateX(-3px);
          border-color: #94a3b8;
        }

        .btn-back-arrow {
          font-size: 1.05rem;
          transition: transform 0.18s ease;
        }

        .applicant-id-pill {
          background: #f8fafc;
          border: 1.5px solid #e2e8f0;
          border-radius: 10px;
          padding: 0.4rem 0.85rem;
          font-size: 0.8rem;
          display: inline-flex;
          align-items: center;
          gap: 0.45rem;
          cursor: pointer;
          transition: all 0.15s ease;
        }

        .applicant-id-pill:hover {
          background: #f1f5f9;
          border-color: #cbd5e1;
        }

        .id-label {
          color: #64748b;
          font-weight: 600;
        }

        .id-code {
          color: #0b1f3a;
          font-weight: 700;
          font-family: var(--font-sans);
        }

        .copy-icon {
          font-size: 0.8rem;
          color: #3b82f6;
        }

        .status-pill {
          display: inline-flex;
          align-items: center;
          gap: 0.45rem;
          padding: 0.35rem 0.95rem;
          border-radius: 999px;
          font-size: 0.82rem;
          font-weight: 700;
        }

        .dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
        }

        .badge-high-priority {
          background: #fffbeb;
          color: #b45309;
          border: 1.5px solid #fde68a;
          border-radius: 999px;
          padding: 0.35rem 0.85rem;
          font-size: 0.8rem;
          font-weight: 700;
        }

        .badge-sla-breached {
          background: #fef2f2;
          color: #b91c1c;
          border: 1.5px solid #fecaca;
          border-radius: 999px;
          padding: 0.35rem 0.85rem;
          font-size: 0.8rem;
          font-weight: 700;
          display: inline-flex;
          align-items: center;
          gap: 0.45rem;
        }

        .sla-dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background: #ef4444;
        }

        .command-right {
          font-size: 0.85rem;
          color: #64748b;
        }

        /* Applicant Hero Card */
        .applicant-hero-card {
          padding: 1.75rem 2rem;
          margin-bottom: 2rem;
          display: flex;
          align-items: center;
          gap: 1.5rem;
          background: linear-gradient(135deg, #ffffff 0%, #f8fafc 100%);
          border-radius: 20px;
          position: relative;
        }

        .hero-avatar {
          width: 68px;
          height: 68px;
          border-radius: 20px;
          color: #ffffff;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 2rem;
          font-weight: 800;
          flex-shrink: 0;
          box-shadow: 0 8px 20px rgba(0, 0, 0, 0.15);
        }

        .hero-info {
          display: flex;
          flex-direction: column;
          gap: 0.45rem;
          flex: 1;
        }

        .hero-title-row {
          display: flex;
          align-items: center;
          gap: 1rem;
          flex-wrap: wrap;
        }

        .hero-applicant-name {
          font-size: 1.75rem;
          font-weight: 800;
          color: #0f172a;
          display: inline-flex;
          align-items: center;
          gap: 0.5rem;
        }

        .verified-badge {
          width: 24px;
          height: 24px;
          border-radius: 50%;
          background: #10b981;
          color: white;
          font-size: 0.8rem;
          display: inline-flex;
          align-items: center;
          justify-content: center;
        }

        .hero-sub-relation {
          font-size: 0.95rem;
          color: #64748b;
        }

        .hero-tags-row {
          display: flex;
          gap: 0.75rem;
          flex-wrap: wrap;
        }

        .tag-item {
          font-size: 0.84rem;
          color: #475569;
          background: #f1f5f9;
          border: 1px solid #e2e8f0;
          padding: 0.25rem 0.75rem;
          border-radius: 8px;
        }

        .hero-snapshot-row {
          display: flex;
          gap: 0.65rem;
          flex-wrap: wrap;
          margin-top: 0.35rem;
        }

        .snapshot-pill {
          font-size: 0.78rem;
          font-weight: 700;
          padding: 0.2rem 0.65rem;
          border-radius: 6px;
        }

        .snap-pass {
          background: #ecfdf5;
          color: #047857;
          border: 1px solid #a7f3d0;
        }

        .snap-fail {
          background: #fef2f2;
          color: #b91c1c;
          border: 1px solid #fecaca;
        }

        .snap-warn {
          background: #fffbeb;
          color: #b45309;
          border: 1px solid #fde68a;
        }

        .snap-info {
          background: #eff6ff;
          color: #1d4ed8;
          border: 1px solid #bfdbfe;
        }

        /* 2-Column Review Grid */
        .review-grid {
          display: grid;
          grid-template-columns: 1.15fr 0.95fr;
          gap: 1.75rem;
        }

        .column-left,
        .column-right {
          display: flex;
          flex-direction: column;
          gap: 1.75rem;
        }

        /* Detail Cards */
        .detail-card {
          padding: 1.5rem 1.75rem;
        }

        .card-header-styled {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding-bottom: 1.15rem;
          border-bottom: 1px solid #f1f5f9;
          margin-bottom: 1.25rem;
        }

        .card-title-flex {
          display: flex;
          align-items: center;
          gap: 0.85rem;
        }

        .card-header-icon {
          font-size: 1.5rem;
          width: 44px;
          height: 44px;
          border-radius: 12px;
          background: #f1f5fa;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .card-header-title {
          font-size: 1.15rem;
          font-weight: 800;
          color: #0b1f3a;
        }

        .card-header-sub {
          font-size: 0.78rem;
          color: #64748b;
          margin-top: 0.15rem;
        }

        .doc-count-tag {
          background: #f1f5f9;
          border: 1px solid #cbd5e1;
          color: #0b1f3a;
          padding: 0.25rem 0.75rem;
          border-radius: 999px;
          font-size: 0.78rem;
          font-weight: 700;
        }

        .fields-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 1.25rem 1.15rem;
        }

        /* Bank Match Banner */
        .bank-match-banner {
          border-radius: 12px;
          padding: 1rem 1.25rem;
          display: flex;
          align-items: center;
          gap: 1rem;
        }

        .match-banner-success {
          background: #ecfdf5;
          border: 1.5px solid #a7f3d0;
          color: #047857;
        }

        .match-banner-mismatch {
          background: #fef2f2;
          border: 1.5px solid #fecaca;
          color: #b91c1c;
        }

        .match-icon {
          font-size: 1.6rem;
        }

        .match-title {
          font-weight: 800;
          font-size: 0.95rem;
        }

        .match-desc {
          font-size: 0.84rem;
          opacity: 0.95;
          margin-top: 0.2rem;
        }

        /* Docs List */
        .docs-list {
          display: flex;
          flex-direction: column;
          gap: 0.85rem;
        }

        .doc-item {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 1rem 1.15rem;
          border-radius: 12px;
          transition: background 0.15s ease;
        }

        .doc-valid {
          background: #f8fafc;
          border: 1.5px solid #e2e8f0;
        }

        .doc-missing {
          background: #fef2f2;
          border: 1.5px solid #fecaca;
        }

        .doc-expired {
          background: #fffbeb;
          border: 1.5px solid #fde68a;
        }

        .doc-left {
          display: flex;
          align-items: center;
          gap: 0.85rem;
        }

        .doc-status-icon {
          font-size: 1.25rem;
        }

        .doc-name {
          font-weight: 700;
          font-size: 0.92rem;
          color: #0b1f3a;
        }

        .doc-status-sub {
          font-size: 0.76rem;
          color: #64748b;
          margin-top: 0.15rem;
        }

        .doc-pill {
          padding: 0.25rem 0.75rem;
          border-radius: 6px;
          font-size: 0.78rem;
          font-weight: 700;
        }

        .pill-green {
          background: #ecfdf5;
          color: #047857;
          border: 1px solid #a7f3d0;
        }

        .pill-red {
          background: #fee2e2;
          color: #b91c1c;
          border: 1px solid #fca5a5;
        }

        .pill-amber {
          background: #fef3c7;
          color: #b45309;
          border: 1px solid #fcd34d;
        }

        /* AI Copilot Station */
        .ai-station-card {
          border: 2px solid #818cf8;
          box-shadow: 0 0 24px -2px rgba(99, 102, 241, 0.25);
          overflow: hidden;
          border-radius: 20px;
        }

        .ai-station-header {
          background: linear-gradient(135deg, #1e1b4b 0%, #312e81 40%, #4338ca 100%);
          color: white;
          padding: 1.25rem 1.5rem;
          display: flex;
          align-items: center;
          justify-content: space-between;
        }

        .ai-header-left {
          display: flex;
          align-items: center;
          gap: 0.85rem;
        }

        .ai-sparkle-icon {
          font-size: 1.6rem;
          animation: pulse-subtle 2s infinite ease-in-out;
        }

        .ai-header-title {
          font-weight: 800;
          font-size: 1.15rem;
          color: #ffffff;
        }

        .ai-header-sub {
          font-size: 0.76rem;
          color: #c7d2fe;
          margin-top: 0.15rem;
        }

        .btn-refresh-ai {
          background: rgba(255, 255, 255, 0.15);
          border: 1px solid rgba(255, 255, 255, 0.35);
          border-radius: 10px;
          color: white;
          padding: 0.45rem 0.95rem;
          font-size: 0.82rem;
          font-weight: 700;
          cursor: pointer;
          transition: all 0.18s ease;
          font-family: var(--font-devanagari);
        }

        .btn-refresh-ai:hover {
          background: rgba(255, 255, 255, 0.3);
          transform: translateY(-1px);
        }

        .ai-disclaimer-strip {
          background: #f8fafc;
          border-bottom: 1px solid #e2e8f0;
          padding: 0.65rem 1.35rem;
          font-size: 0.78rem;
          color: #475569;
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }

        .ai-content-body {
          padding: 1.5rem;
          display: flex;
          flex-direction: column;
          gap: 1.35rem;
        }

        .ai-rec-banner {
          border-radius: 14px;
          padding: 1.25rem;
          display: flex;
          flex-direction: column;
          gap: 0.85rem;
        }

        .rec-approve {
          background: linear-gradient(135deg, #ecfdf5 0%, #d1fae5 100%);
          border: 1.5px solid #6ee7b7;
        }

        .rec-reject {
          background: linear-gradient(135deg, #fef2f2 0%, #fee2e2 100%);
          border: 1.5px solid #fca5a5;
        }

        .rec-return {
          background: linear-gradient(135deg, #fffbeb 0%, #fef3c7 100%);
          border: 1.5px solid #fcd34d;
        }

        .rec-top {
          display: flex;
          align-items: center;
          justify-content: space-between;
          flex-wrap: wrap;
          gap: 0.85rem;
        }

        .rec-decision-pill {
          display: flex;
          align-items: center;
          gap: 0.6rem;
        }

        .rec-text {
          font-weight: 800;
          font-size: 1rem;
          color: #0b1f3a;
        }

        .btn-apply-ai {
          background: #0b1f3a;
          color: #ffffff;
          border: none;
          border-radius: 8px;
          padding: 0.5rem 1rem;
          font-size: 0.82rem;
          font-weight: 700;
          cursor: pointer;
          transition: all 0.18s ease;
          box-shadow: 0 4px 12px rgba(11, 31, 58, 0.25);
        }

        .btn-apply-ai:hover {
          background: #1e3a8a;
          transform: translateY(-1px);
        }

        .rec-summary-text {
          font-size: 0.9rem;
          line-height: 1.6;
          color: #1e293b;
        }

        /* Inconsistencies section */
        .inconsistencies-section {
          display: flex;
          flex-direction: column;
          gap: 0.65rem;
        }

        .section-subtitle {
          font-size: 0.86rem;
          font-weight: 800;
          color: #0f172a;
        }

        .inconsistencies-list {
          display: flex;
          flex-direction: column;
          gap: 0.65rem;
        }

        .inconsistency-card {
          border-radius: 10px;
          padding: 0.85rem 1rem;
          display: flex;
          flex-direction: column;
          gap: 0.35rem;
        }

        .inc-critical {
          background: #fef2f2;
          border: 1.5px solid #fecaca;
        }

        .inc-warning {
          background: #fffbeb;
          border: 1.5px solid #fde68a;
        }

        .inc-info {
          background: #eff6ff;
          border: 1.5px solid #bfdbfe;
        }

        .inc-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 0.5rem;
        }

        .inc-severity-tag {
          font-size: 0.72rem;
          font-weight: 800;
          padding: 0.15rem 0.5rem;
          border-radius: 6px;
        }

        .tag-critical {
          background: #dc2626;
          color: white;
        }

        .tag-warning {
          background: #d97706;
          color: white;
        }

        .tag-info {
          background: #2563eb;
          color: white;
        }

        .inc-field {
          font-size: 0.78rem;
          color: #475569;
          font-weight: 600;
        }

        .inc-issue {
          font-size: 0.84rem;
          color: #1e293b;
          line-height: 1.45;
        }

        .findings-section {
          background: #f8fafc;
          border: 1px solid #e2e8f0;
          border-radius: 12px;
          padding: 1.15rem;
        }

        .findings-header {
          font-size: 0.88rem;
          font-weight: 800;
          color: #1e293b;
          margin-bottom: 0.75rem;
        }

        .findings-list {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }

        .finding-row {
          display: flex;
          align-items: flex-start;
          gap: 0.6rem;
          font-size: 0.86rem;
          color: #334155;
          line-height: 1.5;
        }

        .finding-bullet {
          color: #6366f1;
          font-weight: 800;
        }

        /* Decision Station */
        .decision-station-card {
          padding: 1.75rem;
          border-radius: 20px;
        }

        .decision-form {
          display: flex;
          flex-direction: column;
          gap: 1.5rem;
        }

        .section-field-label {
          font-size: 0.92rem;
          font-weight: 800;
          color: #0f172a;
          margin-bottom: 0.65rem;
          display: block;
        }

        .req-star {
          color: #dc2626;
        }

        .decision-options-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 0.95rem;
        }

        .decision-btn {
          border-radius: 14px;
          padding: 1.15rem 0.65rem;
          border: 2px solid #e2e8f0;
          background: #ffffff;
          cursor: pointer;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 0.35rem;
          transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
          font-family: var(--font-devanagari);
        }

        .decision-btn-icon {
          font-size: 1.5rem;
        }

        .decision-btn-label {
          font-size: 0.95rem;
          font-weight: 800;
        }

        .decision-btn-sub {
          font-size: 0.74rem;
          opacity: 0.7;
          font-family: var(--font-sans);
        }

        .opt-approve:hover,
        .opt-approve.opt-active {
          border-color: #059669;
          background: #ecfdf5;
          color: #047857;
        }

        .opt-reject:hover,
        .opt-reject.opt-active {
          border-color: #dc2626;
          background: #fef2f2;
          color: #b91c1c;
        }

        .opt-return:hover,
        .opt-return.opt-active {
          border-color: #d97706;
          background: #fffbeb;
          color: #b45309;
        }

        .opt-active {
          box-shadow: 0 6px 18px rgba(0, 0, 0, 0.1);
          transform: translateY(-2px);
        }

        /* Preset Reasons */
        .preset-reasons-wrap {
          display: flex;
          flex-direction: column;
          gap: 0.45rem;
          background: #f8fafc;
          border: 1px solid #e2e8f0;
          border-radius: 10px;
          padding: 0.75rem 0.95rem;
        }

        .preset-label {
          font-size: 0.74rem;
          color: #64748b;
          font-weight: 700;
        }

        .preset-buttons {
          display: flex;
          flex-direction: column;
          gap: 0.4rem;
        }

        .preset-btn {
          background: white;
          border: 1px solid #cbd5e1;
          border-radius: 6px;
          padding: 0.4rem 0.65rem;
          font-size: 0.78rem;
          color: #1e293b;
          text-align: left;
          cursor: pointer;
          font-family: var(--font-devanagari);
          transition: background 0.15s ease;
        }

        .preset-btn:hover {
          background: #eff6ff;
          border-color: #93c5fd;
          color: #1d4ed8;
        }

        .override-warning-box {
          background: #fffbeb;
          border: 1.5px solid #fde68a;
          border-radius: 12px;
          padding: 1rem 1.15rem;
          display: flex;
          align-items: flex-start;
          gap: 0.85rem;
        }

        .override-icon {
          font-size: 1.4rem;
        }

        .override-title {
          font-weight: 800;
          font-size: 0.9rem;
          color: #b45309;
        }

        .override-desc {
          font-size: 0.82rem;
          color: #92400e;
          line-height: 1.45;
          margin-top: 0.25rem;
        }

        .reason-input-group {
          display: flex;
          flex-direction: column;
          gap: 0.45rem;
        }

        .reason-header-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
        }

        .btn-quick-fill {
          background: none;
          border: none;
          color: #2563eb;
          font-size: 0.82rem;
          font-weight: 700;
          cursor: pointer;
          text-decoration: underline;
        }

        .reason-textarea {
          width: 100%;
          border: 1.5px solid #cbd5e1;
          border-radius: 12px;
          padding: 0.95rem 1.15rem;
          font-family: var(--font-devanagari);
          font-size: 0.95rem;
          color: #0f172a;
          background: #f8fafc;
          transition: all 0.2s ease;
          outline: none;
          resize: vertical;
        }

        .reason-textarea:focus {
          border-color: #2563eb;
          background: #ffffff;
          box-shadow: 0 0 0 4px rgba(37, 99, 235, 0.12);
        }

        .reason-footer-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          font-size: 0.78rem;
        }

        .char-req {
          color: #64748b;
        }

        .char-count {
          font-weight: 700;
          font-family: var(--font-sans);
        }

        .char-invalid {
          color: #dc2626;
        }

        .char-valid {
          color: #059669;
        }

        .btn-submit-decision {
          background: linear-gradient(135deg, #0b1f3a 0%, #1e3a8a 100%);
          color: #ffffff;
          border: 1px solid rgba(255, 255, 255, 0.2);
          border-radius: 12px;
          padding: 0.95rem 1.5rem;
          font-size: 1rem;
          font-weight: 800;
          cursor: pointer;
          transition: all 0.2s ease;
          box-shadow: 0 4px 16px rgba(11, 31, 58, 0.25);
          font-family: var(--font-devanagari);
        }

        .btn-submit-decision:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 24px rgba(11, 31, 58, 0.35);
          background: linear-gradient(135deg, #1e3a8a 0%, #2563eb 100%);
        }

        /* Audit Trail Card */
        .audit-trail-card {
          padding: 1.75rem;
          border-radius: 20px;
        }

        .audit-count-badge {
          background: #f1f5f9;
          border: 1px solid #cbd5e1;
          color: #0b1f3a;
          padding: 0.25rem 0.75rem;
          border-radius: 999px;
          font-size: 0.78rem;
          font-weight: 700;
        }

        .empty-audit-box {
          text-align: center;
          padding: 2.5rem 1.5rem;
          color: #64748b;
          font-size: 0.88rem;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 0.65rem;
        }

        .empty-audit-icon {
          font-size: 2.2rem;
          opacity: 0.6;
        }

        .audit-timeline {
          display: flex;
          flex-direction: column;
          gap: 1.15rem;
        }

        .timeline-entry {
          border-radius: 12px;
          padding: 1.15rem;
          border: 1.5px solid #e2e8f0;
          background: #f8fafc;
        }

        .entry-approved {
          border-left: 4px solid #10b981;
          background: #f0fdf4;
        }

        .entry-rejected {
          border-left: 4px solid #ef4444;
          background: #fef2f2;
        }

        .entry-returned {
          border-left: 4px solid #f59e0b;
          background: #fffbeb;
        }

        .entry-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          flex-wrap: wrap;
          gap: 0.65rem;
          margin-bottom: 0.65rem;
        }

        .officer-meta {
          display: flex;
          align-items: center;
          gap: 0.45rem;
        }

        .officer-name {
          font-weight: 800;
          font-size: 0.95rem;
          color: #0b1f3a;
        }

        .officer-desig {
          font-size: 0.78rem;
          color: #64748b;
        }

        .entry-badges {
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }

        .badge-override {
          background: #fef3c7;
          color: #b45309;
          border: 1px solid #fde68a;
          border-radius: 6px;
          padding: 0.15rem 0.5rem;
          font-size: 0.72rem;
          font-weight: 700;
        }

        .badge-action {
          background: #0b1f3a;
          color: white;
          padding: 0.2rem 0.65rem;
          border-radius: 6px;
          font-size: 0.76rem;
          font-weight: 700;
        }

        .entry-time {
          font-size: 0.74rem;
          color: #64748b;
          font-family: var(--font-sans);
        }

        .entry-reason {
          font-size: 0.86rem;
          color: #334155;
          line-height: 1.5;
        }

        /* Modal Backdrop */
        .modal-backdrop {
          position: fixed;
          inset: 0;
          background: rgba(7, 21, 43, 0.6);
          backdrop-filter: blur(8px);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
          padding: 1rem;
        }

        .modal-card {
          width: 100%;
          max-width: 520px;
          background: white;
          border-radius: 20px;
          padding: 2rem;
          box-shadow: var(--shadow-modal);
          display: flex;
          flex-direction: column;
          gap: 1.5rem;
        }

        .modal-header {
          display: flex;
          align-items: flex-start;
          gap: 1rem;
        }

        .modal-icon-wrap {
          font-size: 1.8rem;
          width: 48px;
          height: 48px;
          border-radius: 12px;
          background: #fef3c7;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }

        .modal-title {
          font-size: 1.15rem;
          font-weight: 800;
          color: #0b1f3a;
        }

        .modal-sub {
          font-size: 0.82rem;
          color: #64748b;
          margin-top: 0.25rem;
        }

        .modal-summary-box {
          background: #f8fafc;
          border: 1px solid #e2e8f0;
          border-radius: 12px;
          padding: 1.15rem;
          display: flex;
          flex-direction: column;
          gap: 0.65rem;
        }

        .summary-line {
          display: flex;
          align-items: flex-start;
          gap: 0.75rem;
          font-size: 0.88rem;
        }

        .sum-label {
          color: #64748b;
          font-weight: 600;
          min-width: 90px;
        }

        .sum-val {
          color: #0f172a;
          font-weight: 600;
        }

        .modal-actions {
          display: flex;
          gap: 1rem;
          justify-content: flex-end;
        }

        .btn-modal-cancel {
          background: #f1f5f9;
          border: 1px solid #cbd5e1;
          color: #475569;
          padding: 0.65rem 1.25rem;
          border-radius: 10px;
          font-size: 0.88rem;
          font-weight: 700;
          cursor: pointer;
        }

        .btn-modal-confirm {
          background: #0b1f3a;
          color: white;
          border: none;
          padding: 0.65rem 1.35rem;
          border-radius: 10px;
          font-size: 0.88rem;
          font-weight: 700;
          cursor: pointer;
        }

        .alert-box {
          border-radius: 10px;
          padding: 0.95rem 1.15rem;
          font-size: 0.88rem;
          font-weight: 600;
          display: flex;
          align-items: center;
          gap: 0.65rem;
        }

        .alert-success {
          background: #ecfdf5;
          color: #047857;
          border: 1px solid #a7f3d0;
        }

        .alert-error {
          background: #fef2f2;
          color: #b91c1c;
          border: 1px solid #fecaca;
        }

        .already-decided-box {
          background: #f8fafc;
          border: 1.5px solid #e2e8f0;
          border-radius: 14px;
          padding: 1.35rem;
        }

        .decided-badge-row {
          display: flex;
          align-items: center;
          gap: 0.65rem;
          margin-bottom: 0.65rem;
        }

        .decided-title {
          font-weight: 800;
          font-size: 0.95rem;
          color: #0b1f3a;
        }

        .decided-sub {
          font-size: 0.84rem;
          color: #64748b;
          line-height: 1.5;
        }

        @media (max-width: 960px) {
          .review-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  );
}

function InfoField({
  label,
  value,
  highlight,
  badge,
  note,
}: {
  label: string;
  value: string;
  highlight?: "red" | "green";
  badge?: string;
  note?: string;
}) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}>
      <div style={{ fontSize: "0.78rem", color: "#64748b", fontWeight: 600 }}>
        {label}
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", flexWrap: "wrap" }}>
        <span
          style={{
            fontWeight: 800,
            fontSize: "0.98rem",
            color:
              highlight === "red"
                ? "#dc2626"
                : highlight === "green"
                ? "#059669"
                : "#0f172a",
          }}
        >
          {value}
        </span>
        {badge && (
          <span
            style={{
              fontSize: "0.72rem",
              fontWeight: 700,
              padding: "0.15rem 0.55rem",
              borderRadius: "6px",
              background: highlight === "red" ? "#fee2e2" : "#ecfdf5",
              color: highlight === "red" ? "#b91c1c" : "#047857",
              border: `1px solid ${highlight === "red" ? "#fca5a5" : "#a7f3d0"}`,
            }}
          >
            {badge}
          </span>
        )}
      </div>
      {note && (
        <div
          style={{
            fontSize: "0.74rem",
            color: highlight === "red" ? "#b91c1c" : "#64748b",
            lineHeight: 1.35,
          }}
        >
          {note}
        </div>
      )}
    </div>
  );
}
