"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createApplication } from "@/app/actions/application";
import { calculateAge } from "@/lib/ai";
import {
  MAX_ANNUAL_INCOME_INR,
  MIN_AGE_YEARS,
  REQUIRED_DOCUMENTS,
} from "@/lib/eligibility";
import { getIntakeFieldErrors, IntakeField, IntakeInput } from "@/lib/intake";
import { useLanguage } from "@/lib/i18n/LanguageContext";
import Icon, { type IconName } from "@/components/Icon";

const EMPTY_FORM: IntakeInput = {
  applicantName: "",
  fatherHusbandName: "",
  dob: "",
  village: "",
  tehsil: "अंबाला",
  district: "अंबाला",
  aadhaarLast4: "",
  bankAccountHolder: "",
  bankIFSC: "",
  bankAccountLast4: "",
  annualIncome: "",
  documentsSubmitted: [],
  priority: "NORMAL",
  flagNote: "",
};

type CheckState = "pass" | "fail" | "pending";

const CHECK_COLORS: Record<CheckState, { bg: string; text: string; border: string; icon: IconName | null }> = {
  pass: { bg: "var(--clr-green-light)", text: "var(--clr-green-hover)", border: "var(--clr-green-border)", icon: "check" },
  fail: { bg: "var(--clr-red-light)", text: "var(--clr-red-hover)", border: "var(--clr-red-border)", icon: "x" },
  pending: { bg: "var(--clr-surface-muted)", text: "var(--clr-text-muted)", border: "var(--clr-border)", icon: null },
};

export default function NewApplicationClient() {
  const router = useRouter();
  const { language, t } = useLanguage();
  const [form, setForm] = useState<IntakeInput>(EMPTY_FORM);
  const [touched, setTouched] = useState<Partial<Record<IntakeField, true>>>({});
  const [submitAttempted, setSubmitAttempted] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const fieldErrors = getIntakeFieldErrors(form);
  const showError = (field: IntakeField) =>
    Boolean(fieldErrors[field] && (touched[field] || submitAttempted));

  const errorMessages: Partial<Record<IntakeField, string>> = {
    applicantName: t.intake.errorText,
    fatherHusbandName: t.intake.errorText,
    village: t.intake.errorText,
    tehsil: t.intake.errorText,
    district: t.intake.errorText,
    bankAccountHolder: t.intake.errorText,
    dob: t.intake.errorDob,
    aadhaarLast4: t.intake.errorDigits4,
    bankAccountLast4: t.intake.errorDigits4,
    bankIFSC: t.intake.errorIFSC,
    annualIncome: t.intake.errorIncome,
    flagNote: t.intake.errorFlagNote,
  };

  function update<K extends IntakeField>(field: K, value: IntakeInput[K]) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  function toggleDoc(doc: string) {
    setForm((prev) => ({
      ...prev,
      documentsSubmitted: prev.documentsSubmitted.includes(doc)
        ? prev.documentsSubmitted.filter((d) => d !== doc)
        : [...prev.documentsSubmitted, doc],
    }));
  }

  // ─── Live eligibility preview (same thresholds as the rule engine) ──────
  const dobValid = !fieldErrors.dob && form.dob !== "";
  const age = dobValid ? calculateAge(new Date(form.dob)) : null;
  const incomeValid = !fieldErrors.annualIncome && form.annualIncome !== "";
  const income = incomeValid ? Number(form.annualIncome) : null;
  const docCount = form.documentsSubmitted.length;

  const ageCheck: CheckState = age === null ? "pending" : age >= MIN_AGE_YEARS ? "pass" : "fail";
  const incomeCheck: CheckState =
    income === null ? "pending" : income <= MAX_ANNUAL_INCOME_INR ? "pass" : "fail";
  const docsCheck: CheckState = docCount === REQUIRED_DOCUMENTS.length ? "pass" : "fail";

  let verdict: { text: string; state: CheckState } = { text: t.intake.previewPending, state: "pending" };
  if (ageCheck === "fail" || incomeCheck === "fail") {
    verdict = { text: t.intake.previewLikelyReject, state: "fail" };
  } else if (ageCheck === "pass" && incomeCheck === "pass") {
    verdict =
      docsCheck === "pass"
        ? { text: t.intake.previewLikelyApprove, state: "pass" }
        : { text: t.intake.previewLikelyReturn, state: "fail" };
  }

  const locale = language === "hi" ? "hi-IN" : "en-IN";

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitAttempted(true);
    setServerError(null);
    if (Object.keys(fieldErrors).length > 0) {
      setServerError(t.intake.errorFixFields);
      return;
    }
    startTransition(async () => {
      const res = await createApplication(form);
      if (res.success && res.id) {
        router.push(`/applications/${res.id}`);
      } else {
        setServerError(res.error ?? t.intake.errorFixFields);
      }
    });
  }

  // ─── Small render helpers ───────────────────────────────────────────────
  const renderField = (
    field: IntakeField,
    label: string,
    input: React.ReactNode,
    hint?: string
  ) => (
    <label style={{ display: "flex", flexDirection: "column", gap: "0.35rem" }}>
      <span style={{ fontSize: "0.8rem", fontWeight: 600, color: "var(--clr-text-secondary)" }}>
        {label}
      </span>
      {input}
      {showError(field) ? (
        <span style={{ fontSize: "0.74rem", color: "var(--clr-red)", fontWeight: 500 }}>
          {errorMessages[field]}
        </span>
      ) : hint ? (
        <span style={{ fontSize: "0.72rem", color: "var(--clr-text-muted)" }}>{hint}</span>
      ) : null}
    </label>
  );

  const inputStyle = (field: IntakeField): React.CSSProperties => ({
    padding: "0.65rem 0.8rem",
    borderRadius: "8px",
    border: `1px solid ${showError(field) ? "var(--clr-red)" : "var(--clr-border)"}`,
    background: showError(field) ? "var(--clr-red-light)" : "var(--clr-surface-card)",
    fontSize: "0.9rem",
    fontFamily: "inherit",
    color: "var(--clr-text)",
    outline: "none",
    width: "100%",
  });

  const textInput = (
    field: IntakeField,
    opts: { type?: string; placeholder?: string; maxLength?: number; inputMode?: "numeric" } = {}
  ) => (
    <input
      type={opts.type ?? "text"}
      inputMode={opts.inputMode}
      placeholder={opts.placeholder}
      maxLength={opts.maxLength}
      value={String(form[field] ?? "")}
      onChange={(e) =>
        update(
          field,
          (opts.inputMode === "numeric" ? e.target.value.replace(/\D/g, "") : e.target.value) as never
        )
      }
      onBlur={() => setTouched((prev) => ({ ...prev, [field]: true }))}
      style={inputStyle(field)}
    />
  );

  const sectionCard = (title: React.ReactNode, children: React.ReactNode) => (
    <section className="executive-card" style={{ padding: "1.4rem 1.5rem", borderRadius: "14px" }}>
      <h2
        style={{
          fontSize: "0.95rem",
          fontWeight: 700,
          color: "var(--clr-navy)",
          marginBottom: "1.1rem",
          paddingBottom: "0.6rem",
          borderBottom: "1px solid var(--clr-border-subtle)",
        }}
      >
        {title}
      </h2>
      {children}
    </section>
  );

  const grid: React.CSSProperties = {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
    gap: "1rem",
  };

  const checkRow = (label: string, state: CheckState, value: string) => {
    const c = CHECK_COLORS[state];
    return (
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: "0.75rem",
          padding: "0.65rem 0.8rem",
          borderRadius: "10px",
          background: c.bg,
          border: `1px solid ${c.border}`,
        }}
      >
        <span style={{ display: "flex", alignItems: "center", gap: "0.55rem", fontWeight: 600, fontSize: "0.84rem", color: "var(--clr-text)" }}>
          <span
            style={{
              width: "22px",
              height: "22px",
              borderRadius: "50%",
              background: c.text,
              color: "#fff",
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "0.72rem",
              fontWeight: 700,
            }}
          >
            {c.icon ? <Icon name={c.icon} size={13} strokeWidth={3} /> : "…"}
          </span>
          {label}
        </span>
        <span style={{ fontSize: "0.8rem", fontWeight: 600, color: c.text }}>{value}</span>
      </div>
    );
  };

  return (
    <div style={{ fontFamily: language === "hi" ? "var(--font-devanagari)" : "var(--font-sans)" }}>
      {/* ─── Page Header ─────────────────────────────────────────────────── */}
      <div style={{ marginBottom: "1.75rem" }}>
        <Link
          href="/dashboard"
          style={{ fontSize: "0.82rem", color: "var(--clr-text-secondary)", textDecoration: "none", fontWeight: 600 }}
        >
          <Icon name="arrowLeft" size={14} /> {t.common.back}
        </Link>
        <div style={{ marginTop: "0.9rem" }}>
          <span
            style={{
              display: "inline-block",
              fontSize: "0.72rem",
              fontWeight: 700,
              color: "var(--clr-saffron-dark)",
              background: "var(--clr-saffron-light)",
              border: "1px solid #fed7aa",
              borderRadius: "999px",
              padding: "0.2rem 0.7rem",
              marginBottom: "0.6rem",
            }}
          >
            <Icon name="filePlus" size={13} /> {t.intake.pageBadge}
          </span>
          <h1 style={{ fontSize: "1.6rem", fontWeight: 800, color: "var(--clr-navy)", letterSpacing: "-0.01em" }}>
            {t.intake.pageTitle}
          </h1>
          <p style={{ marginTop: "0.4rem", color: "var(--clr-text-secondary)", fontSize: "0.9rem", maxWidth: "720px" }}>
            {t.intake.pageSub}
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} noValidate>
        <div className="intake-layout">
          {/* ─── Left: form sections ─────────────────────────────────────── */}
          <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem", minWidth: 0 }}>
            {sectionCard(
              <><Icon name="user" size={17} /> {t.intake.sectionApplicant}</>,
              <div style={grid}>
                {renderField("applicantName", t.intake.applicantName, textInput("applicantName"))}
                {renderField("fatherHusbandName", t.intake.fatherHusbandName, textInput("fatherHusbandName"))}
                {renderField("dob", t.intake.dob, textInput("dob", { type: "date" }))}
                {renderField(
                  "annualIncome",
                  t.intake.annualIncome,
                  textInput("annualIncome", { inputMode: "numeric", placeholder: "120000" })
                )}
                {renderField("village", t.intake.village, textInput("village"))}
                {renderField("tehsil", t.intake.tehsil, textInput("tehsil"))}
                {renderField("district", t.intake.district, textInput("district"))}
              </div>
            )}

            {sectionCard(
              <><Icon name="landmark" size={17} /> {t.intake.sectionBank}</>,
              <div style={grid}>
                {renderField(
                  "aadhaarLast4",
                  t.intake.aadhaarLast4,
                  textInput("aadhaarLast4", { inputMode: "numeric", maxLength: 4, placeholder: "4521" }),
                  t.intake.privacyNote
                )}
                {renderField("bankAccountHolder", t.intake.bankAccountHolder, textInput("bankAccountHolder"))}
                {renderField("bankIFSC", t.intake.bankIFSC, textInput("bankIFSC", { maxLength: 11, placeholder: "SBIN0001234" }))}
                {renderField(
                  "bankAccountLast4",
                  t.intake.bankAccountLast4,
                  textInput("bankAccountLast4", { inputMode: "numeric", maxLength: 4, placeholder: "7788" }),
                  t.intake.privacyNote
                )}
              </div>
            )}

            {sectionCard(
              <><Icon name="folder" size={17} /> {t.intake.sectionDocs}</>,
              <>
                <div style={{ display: "flex", gap: "0.5rem", marginBottom: "0.85rem" }}>
                  {[
                    { label: t.intake.docsSelectAll, value: [...REQUIRED_DOCUMENTS] },
                    { label: t.intake.docsClear, value: [] as string[] },
                  ].map((b) => (
                    <button
                      key={b.label}
                      type="button"
                      onClick={() => update("documentsSubmitted", b.value)}
                      style={{
                        fontSize: "0.76rem",
                        fontWeight: 600,
                        padding: "0.3rem 0.75rem",
                        borderRadius: "6px",
                        border: "1px solid var(--clr-border)",
                        background: "var(--clr-surface-muted)",
                        color: "var(--clr-text-secondary)",
                        cursor: "pointer",
                        fontFamily: "inherit",
                      }}
                    >
                      {b.label}
                    </button>
                  ))}
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "0.6rem" }}>
                  {REQUIRED_DOCUMENTS.map((doc) => {
                    const checked = form.documentsSubmitted.includes(doc);
                    return (
                      <label
                        key={doc}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "0.6rem",
                          padding: "0.65rem 0.8rem",
                          borderRadius: "10px",
                          cursor: "pointer",
                          border: `1px solid ${checked ? "var(--clr-green-border)" : "var(--clr-border)"}`,
                          background: checked ? "var(--clr-green-light)" : "var(--clr-surface-card)",
                          fontSize: "0.85rem",
                          fontWeight: 500,
                          transition: "all 0.15s ease",
                        }}
                      >
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() => toggleDoc(doc)}
                          style={{ width: "16px", height: "16px", accentColor: "var(--clr-green)" }}
                        />
                        {t.docs[doc] ?? doc}
                      </label>
                    );
                  })}
                </div>
              </>
            )}

            {sectionCard(
              <><Icon name="flag" size={17} /> {t.intake.sectionPriority}</>,
              <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                <div style={{ display: "flex", gap: "0.6rem", flexWrap: "wrap" }}>
                  {(["NORMAL", "HIGH"] as const).map((p) => {
                    const active = form.priority === p;
                    const isHigh = p === "HIGH";
                    return (
                      <button
                        key={p}
                        type="button"
                        onClick={() => update("priority", p)}
                        style={{
                          padding: "0.55rem 1.1rem",
                          borderRadius: "8px",
                          fontWeight: 600,
                          fontSize: "0.85rem",
                          cursor: "pointer",
                          fontFamily: "inherit",
                          border: `1px solid ${active ? (isHigh ? "var(--clr-red)" : "var(--clr-navy)") : "var(--clr-border)"}`,
                          background: active ? (isHigh ? "var(--clr-red-light)" : "var(--clr-navy-light)") : "var(--clr-surface-card)",
                          color: active ? (isHigh ? "var(--clr-red-hover)" : "var(--clr-navy)") : "var(--clr-text-secondary)",
                        }}
                      >
                        {isHigh ? <><Icon name="alertTriangle" size={14} /> {t.intake.priorityHigh}</> : t.intake.priorityNormal}
                      </button>
                    );
                  })}
                </div>
                {form.priority === "HIGH" &&
                  renderField(
                    "flagNote",
                    t.intake.flagNote,
                    textInput("flagNote", { placeholder: t.intake.flagNotePlaceholder, maxLength: 200 })
                  )}
              </div>
            )}
          </div>

          {/* ─── Right: sticky eligibility preview + submit ──────────────── */}
          <aside className="intake-aside">
            <div className="executive-card" style={{ padding: "1.4rem 1.5rem", borderRadius: "14px" }}>
              <h2 style={{ fontSize: "0.95rem", fontWeight: 700, color: "var(--clr-navy)" }}>
                <Icon name="scale" size={17} /> {t.intake.previewTitle}
              </h2>
              <p style={{ fontSize: "0.76rem", color: "var(--clr-text-muted)", marginBottom: "1rem" }}>
                {t.intake.previewSub}
              </p>
              <div style={{ display: "flex", flexDirection: "column", gap: "0.55rem" }}>
                {checkRow(
                  `${t.intake.previewAge} ≥ ${MIN_AGE_YEARS}`,
                  ageCheck,
                  age === null ? "—" : `${age} ${t.common.years}`
                )}
                {checkRow(
                  `${t.intake.previewIncome} ≤ ₹${MAX_ANNUAL_INCOME_INR.toLocaleString("en-IN")}`,
                  incomeCheck,
                  income === null ? "—" : `₹${income.toLocaleString(locale)}`
                )}
                {checkRow(t.intake.previewDocs, docsCheck, `${docCount} / ${REQUIRED_DOCUMENTS.length}`)}
              </div>
              <div
                style={{
                  marginTop: "1rem",
                  padding: "0.75rem 0.85rem",
                  borderRadius: "10px",
                  fontSize: "0.82rem",
                  fontWeight: 600,
                  background: CHECK_COLORS[verdict.state].bg,
                  color: CHECK_COLORS[verdict.state].text,
                  border: `1px dashed ${CHECK_COLORS[verdict.state].border}`,
                }}
              >
                {verdict.text}
              </div>
              <p style={{ marginTop: "0.75rem", fontSize: "0.72rem", color: "var(--clr-text-muted)", lineHeight: 1.5 }}>
                {t.intake.previewDisclaimer}
              </p>
            </div>

            {serverError && (
              <div
                role="alert"
                style={{
                  padding: "0.75rem 0.9rem",
                  borderRadius: "10px",
                  background: "var(--clr-red-light)",
                  border: "1px solid var(--clr-red-border)",
                  color: "var(--clr-red-hover)",
                  fontSize: "0.82rem",
                  fontWeight: 600,
                }}
              >
                <Icon name="alertTriangle" size={15} /> {serverError}
              </div>
            )}

            <button
              type="submit"
              disabled={isPending}
              style={{
                padding: "0.85rem 1rem",
                borderRadius: "10px",
                border: "none",
                background: isPending
                  ? "var(--clr-text-muted)"
                  : "linear-gradient(135deg, var(--clr-navy-mid) 0%, var(--clr-navy-hover) 100%)",
                color: "#fff",
                fontWeight: 700,
                fontSize: "0.95rem",
                cursor: isPending ? "wait" : "pointer",
                fontFamily: "inherit",
                boxShadow: "var(--shadow-elevated)",
              }}
            >
              {isPending ? t.intake.submitting : <><Icon name="check" size={17} strokeWidth={2.4} /> {t.intake.submitBtn}</>}
            </button>
            <Link
              href="/dashboard"
              style={{
                textAlign: "center",
                fontSize: "0.85rem",
                fontWeight: 600,
                color: "var(--clr-text-secondary)",
                textDecoration: "none",
              }}
            >
              {t.intake.cancelBtn}
            </Link>
          </aside>
        </div>
      </form>
    </div>
  );
}
