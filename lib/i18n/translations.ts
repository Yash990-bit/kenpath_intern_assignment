/**
 * translations.ts
 * ────────────────────────────────────────────────────────────────────────────
 * Centralized Bilingual Translation Dictionary (Hindi & English)
 * Natural, professional administrative terminology suitable for Haryana
 * Social Welfare Department officers (Tehsildar / Nodal Officer).
 * ────────────────────────────────────────────────────────────────────────────
 */

export type Language = "hi" | "en";

export interface Translations {
  common: {
    appName: string;
    appNameShort: string;
    deptName: string;
    stateTag: string;
    activeSession: string;
    dashboard: string;
    logout: string;
    logoutConfirm: string;
    officer: string;
    tehsildar: string;
    days: string;
    years: string;
    perYear: string;
    cancel: string;
    confirm: string;
    close: string;
    back: string;
    retry: string;
    loading: string;
    footerRule1: string;
    footerRule2: string;
    footerTech: string;
    statusPending: string;
    statusApproved: string;
    statusRejected: string;
    statusReturned: string;
    priorityHigh: string;
    priorityNormal: string;
    switchLang: string;
  };
  login: {
    deptBanner: string;
    stateTitle: string;
    heroMainTitle: string;
    heroTitleHighlight: string;
    heroSubtitle: string;
    featureAiTitle: string;
    featureAiDesc: string;
    featureSlaTitle: string;
    featureSlaDesc: string;
    featureAuditTitle: string;
    featureAuditDesc: string;
    liveCloudTag: string;
    missionTag: string;
    demoCalloutTitle: string;
    demoCalloutSub: string;
    demoAutofillBtn: string;
    demoAutofilledBtn: string;
    cardBadge: string;
    cardTitle: string;
    cardDesc: string;
    emailLabel: string;
    emailPlaceholder: string;
    passwordLabel: string;
    passwordPlaceholder: string;
    showPassword: string;
    hidePassword: string;
    loginBtn: string;
    authenticating: string;
    errorInvalid: string;
    securitySSL: string;
    securityJWT: string;
    securitySDC: string;
    legalNotice: string;
  };
  dashboard: {
    portalBadge: string;
    greetingMorning: string;
    greetingDay: string;
    briefingStats: string;
    slaAlertTitle: string;
    slaAlertDesc: string;
    slaReviewBtn: string;
    kpiTotalLabel: string;
    kpiTotalSub: string;
    kpiPendingLabel: string;
    kpiPendingSub: string;
    kpiSlaLabel: string;
    kpiSlaSub: string;
    kpiHighLabel: string;
    kpiHighSub: string;
    kpiApprovedLabel: string;
    kpiApprovedSub: string;
    kpiRejectedLabel: string;
    kpiRejectedSub: string;
    searchPlaceholder: string;
    searchClear: string;
    sortLabel: string;
    sortUrgency: string;
    sortWaiting: string;
    sortAge: string;
    sortDate: string;
    viewTable: string;
    viewCards: string;
    filterAll: string;
    filterSla: string;
    filterHigh: string;
    filterPending: string;
    filterApproved: string;
    filterRejected: string;
    resultsCount: string;
    filterTagPrefix: string;
    searchTagPrefix: string;
    emptyTitle: string;
    emptyDesc: string;
    resetFilters: string;
    thIndex: string;
    thApplicant: string;
    thLocation: string;
    thAge: string;
    thIncome: string;
    thWaiting: string;
    thStatus: string;
    thPriority: string;
    thAction: string;
    relationPrefix: string;
    ageEligible: string;
    ageIneligible: string;
    incomeWithin: string;
    incomeExceeds: string;
    slaOverdue: string;
    btnReview: string;
    btnReviewed: string;
    gridIdPrefix: string;
    gridSubmitted: string;
    daysPending: string;
  };
  detail: {
    backToDashboard: string;
    applicationId: string;
    copyId: string;
    copied: string;
    submissionDate: string;
    daysAgo: string;
    daysCount: string;
    verifiedApplicant: string;
    relation: string;
    locationDistrict: string;
    aadhaar: string;
    waitingTime: string;
    snapAgeEligible: string;
    snapAgeIneligible: string;
    snapIncomeWithin: string;
    snapIncomeExceeds: string;
    snapBankVerified: string;
    snapBankMismatch: string;
    snapDocsCount: string;
    sectionPersonal: string;
    subPersonal: string;
    labelFullName: string;
    labelFatherHusband: string;
    labelDobAge: string;
    noteAgePass: string;
    noteAgeFail: string;
    labelAnnualIncome: string;
    noteIncomePass: string;
    noteIncomeFail: string;
    labelResidence: string;
    labelTehsilDistrict: string;
    labelAadhaar: string;
    labelSubmittedAt: string;
    sectionBank: string;
    subBank: string;
    bankMatchTitle: string;
    bankMismatchTitle: string;
    bankMatchDesc: string;
    labelBankHolder: string;
    labelBankAccount: string;
    labelBankIfsc: string;
    labelDbtStatus: string;
    dbtValid: string;
    dbtPending: string;
    sectionDocs: string;
    subDocs: string;
    docsAvailableCount: string;
    docStatusMissing: string;
    docStatusExpired: string;
    docStatusValid: string;
    docPillMissing: string;
    docPillExpired: string;
    docPillAttached: string;
    aiSectionTitle: string;
    aiEngineGemini: string;
    aiEngineRule: string;
    aiBtnReanalyze: string;
    aiBtnAnalyzing: string;
    aiDisclaimer: string;
    aiActionHeading: string;
    aiActionApprove: string;
    aiActionReject: string;
    aiActionReturn: string;
    aiBtnApply: string;
    inconsistenciesTitle: string;
    severityCritical: string;
    severityWarning: string;
    severityInfo: string;
    findingsTitle: string;
    sectionDecision: string;
    subDecision: string;
    alreadyDecidedTitle: string;
    alreadyDecidedSub: string;
    chooseDecisionLabel: string;
    btnApprove: string;
    btnApproveSub: string;
    btnReject: string;
    btnRejectSub: string;
    btnReturn: string;
    btnReturnSub: string;
    quickPresetsLabel: string;
    overrideTitle: string;
    overrideDesc: string;
    reasonLabel: string;
    prefillAiBtn: string;
    reasonPlaceholder: string;
    charMinNotice: string;
    charCount: string;
    btnSaveDecision: string;
    btnSaving: string;
    sectionAudit: string;
    subAudit: string;
    auditEntries: string;
    emptyAudit: string;
    auditOverrideTag: string;
    auditRecordedReason: string;
    auditActionRegistered: string;
    modalConfirmTitle: string;
    modalConfirmSub: string;
    modalApplicant: string;
    modalDecision: string;
    modalReason: string;
    modalCancel: string;
    modalConfirmBtn: string;
    valAlreadyDecided: string;
    valSelectDecision: string;
    valMinChars: string;
    msgSuccess: string;
    msgFail: string;
    // Explicit key aliases for ApplicationDetailClient
    copyIdTooltip: string;
    appNoPrefix: string;
    copiedSuccess: string;
    slaOverdue: string;
    applicationDate: string;
    registeredApplicant: string;
    relationPrefix: string;
    locationFormat: string;
    aadhaarLabel: string;
    waitingPeriod: string;
    ageEligible: string;
    ageIneligible: string;
    yearsAge: string;
    incomeEligible: string;
    incomeIneligible: string;
    bankVerified: string;
    bankNameMismatch: string;
    documentsAttached: string;
    personalDossierTitle: string;
    personalDossierSub: string;
    applicantFullName: string;
    fatherHusbandName: string;
    dobAndAge: string;
    ineligibleAgeBadge: string;
    eligibleAgeBadge: string;
    ageRuleNoteFail: string;
    ageRuleNotePass: string;
    annualIncome: string;
    incomeAboveLimitBadge: string;
    incomeWithinLimitBadge: string;
    incomeRuleNoteFail: string;
    incomeRuleNotePass: string;
    village: string;
    tehsilAndDistrict: string;
    aadhaarNo: string;
    submittedOn: string;
    bankVerificationTitle: string;
    bankVerificationSub: string;
    bankMatchMismatchTitle: string;
    bankMatchSuccessTitle: string;
    applicantNameLabel: string;
    bankPassbookNameLabel: string;
    bankAccountHolder: string;
    bankAccountMasked: string;
    bankIfsc: string;
    dbtEligibility: string;
    dbtVerificationPending: string;
    dbtActiveValid: string;
    docPortfolioTitle: string;
    docPortfolioSub: string;
    docCountTag: string;
    docMissingSub: string;
    docExpiredSub: string;
    docValidSub: string;
    aiCopilotTitle: string;
    enginePrefix: string;
    ruleEngineName: string;
    aiFallbackBanner: string;
    aiAnalyzing: string;
    aiReanalyze: string;
    aiSuggestedAction: string;
    applyAiRecommendation: string;
    decisionApproveFull: string;
    decisionRejectFull: string;
    decisionReturnFull: string;
    discrepanciesTitle: string;
    decisionStationTitle: string;
    decisionStationSub: string;
    actionApprove: string;
    actionApproveSub: string;
    actionReject: string;
    actionRejectSub: string;
    actionReturn: string;
    actionReturnSub: string;
    presetReasonsLabel: string;
    overrideWarningTitle: string;
    overrideWarningDesc1: string;
    overrideWarningDesc2: string;
    reasonInputLabel: string;
    btnFillAiSuggestion: string;
    minCharsRequired: string;
    charCounter: string;
    submittingDecision: string;
    btnSubmitFinalDecision: string;
    auditTrailTitle: string;
    auditTrailSub: string;
    auditEntriesCount: string;
    emptyAuditText: string;
    auditOverriddenBadge: string;
    confirmModalTitle: string;
    confirmModalSub: string;
    confirmModalApplicant: string;
    confirmModalDecision: string;
    confirmModalReason: string;
    confirmModalCancel: string;
    confirmModalConfirm: string;
    errorAlreadyDecided: string;
    errorSelectDecisionFirst: string;
    errorReasonMinChars: string;
    saveDecisionFailed: string;
    successDecisionSaved: string;
  };
  intake: {
    navLabel: string;
    pageBadge: string;
    pageTitle: string;
    pageSub: string;
    sectionApplicant: string;
    sectionBank: string;
    sectionDocs: string;
    sectionPriority: string;
    applicantName: string;
    fatherHusbandName: string;
    dob: string;
    village: string;
    tehsil: string;
    district: string;
    annualIncome: string;
    aadhaarLast4: string;
    bankAccountHolder: string;
    bankIFSC: string;
    bankAccountLast4: string;
    privacyNote: string;
    docsSelectAll: string;
    docsClear: string;
    priorityNormal: string;
    priorityHigh: string;
    flagNote: string;
    flagNotePlaceholder: string;
    previewTitle: string;
    previewSub: string;
    previewAge: string;
    previewIncome: string;
    previewDocs: string;
    previewPending: string;
    previewLikelyApprove: string;
    previewLikelyReject: string;
    previewLikelyReturn: string;
    previewDisclaimer: string;
    submitBtn: string;
    submitting: string;
    cancelBtn: string;
    errorFixFields: string;
    errorText: string;
    errorDob: string;
    errorDigits4: string;
    errorIFSC: string;
    errorIncome: string;
    errorFlagNote: string;
  };
  reports: {
    navLabel: string;
    pageBadge: string;
    pageTitle: string;
    pageSub: string;
    exportCsv: string;
    kpiDecisions: string;
    kpiDecisionsSub: string;
    kpiAgreement: string;
    kpiAgreementSub: string;
    kpiAvgDays: string;
    kpiAvgDaysSub: string;
    kpiSla: string;
    kpiSlaSub: string;
    kpiNoData: string;
    outcomesTitle: string;
    outcomesSub: string;
    matrixTitle: string;
    matrixSub: string;
    matrixRowHeader: string;
    matrixCellTitle: string;
    activityTitle: string;
    activitySub: string;
    thTime: string;
    thApplicant: string;
    thOfficer: string;
    thAction: string;
    thAi: string;
    overriddenTag: string;
    emptyActivity: string;
    decisionApprove: string;
    decisionReject: string;
    decisionReturn: string;
    daysUnit: string;
  };
  docs: Record<string, string>;
  presets: Record<"APPROVE" | "REJECT" | "RETURN", string[]>;
}

export const translations: Record<Language, Translations> = {
  hi: {
    common: {
      appName: "वृद्धा पेंशन समीक्षा पोर्टल",
      appNameShort: "पेंशन समीक्षा पोर्टल",
      deptName: "हरियाणा सरकार • समाज कल्याण विभाग",
      stateTag: "हरियाणा सरकार",
      activeSession: "सक्रिय सत्र",
      dashboard: "डैशबोर्ड",
      logout: "लॉगआउट",
      logoutConfirm: "सुरक्षित लॉगआउट करें",
      officer: "अधिकारी",
      tehsildar: "तहसीलदार",
      days: "दिन",
      years: "वर्ष",
      perYear: "वर्ष",
      cancel: "रद्द करें",
      confirm: "पुष्टि करें",
      close: "बंद करें",
      back: "वापस",
      retry: "पुनः प्रयास करें",
      loading: "लोड हो रहा है...",
      footerRule1: "हरियाणा वृद्धावस्था सम्मान भत्ता नियम, 1991",
      footerRule2: "हरियाणा सेवा का अधिकार अधिनियम, 2014",
      footerTech: "NIC & State Data Centre, Haryana • Secured with Prisma & Neon DB",
      statusPending: "लंबित",
      statusApproved: "स्वीकृत",
      statusRejected: "अस्वीकृत",
      statusReturned: "वापस",
      priorityHigh: "उच्च प्राथमिकता",
      priorityNormal: "सामान्य",
      switchLang: "English",
    },
    login: {
      deptBanner: "हरियाणा सरकार • समाज कल्याण विभाग",
      stateTitle: "GOVERNMENT OF HARYANA",
      heroMainTitle: "वृद्धावस्था सम्मान भत्ता",
      heroTitleHighlight: " समीक्षा एवं निर्णय पोर्टल",
      heroSubtitle:
        "हरियाणा वृद्धा पेंशन योजना के अंतर्गत आवेदनों के त्वरित, पारदर्शी एवं AI-सहायक सत्यापन हेतु अधिकृत तहसील/ब्लॉक अधिकारी मंच।",
      featureAiTitle: "AI सह-पायलट (Groq / Gemini)",
      featureAiDesc:
        "पात्रता नियम, आयु (60+ वर्ष) व बैंक खाते के नाम की विसंगति का स्वतः विश्लेषण",
      featureSlaTitle: "SLA समय-सीमा ट्रैकिंग (30 दिन)",
      featureSlaDesc:
        "सेवा का अधिकार अधिनियम के अंतर्गत प्राथमिकता क्रमबद्ध कार्यप्रवाह",
      featureAuditTitle: "अपरिवर्तनीय डिजिटल ऑडिट ट्रेल",
      featureAuditDesc:
        "तहसीलदार व नोडल अधिकारी के प्रत्येक अनुमोदन व अस्वीकृति का समय-अंकित रिकॉर्ड",
      liveCloudTag: "Neon PostgreSQL Cloud • 20 लाइव आवेदन सुरक्षित",
      missionTag: "डिजिटल हरियाणा मिशन 2026",
      demoCalloutTitle: "मूल्यांकनकर्ता / समीक्षक हेतु त्वरित लॉगिन",
      demoCalloutSub: "अधिकारी क्रेडेंशियल्स:",
      demoAutofillBtn: "1-क्लिक ऑटोफिल (Auto-Fill Demo)",
      demoAutofilledBtn: "✓ क्रेडेंशियल्स भरे गए!",
      cardBadge: "अधिकारी अधिकृत प्रवेश",
      cardTitle: "पोर्टल में प्रवेश करें",
      cardDesc:
        "पेंशन समीक्षा प्रणाली तक पहुँचने के लिए अपनी शासकीय साख दर्ज करें",
      emailLabel: "शासकीय ईमेल पता",
      emailPlaceholder: "officer@demo.gov.in",
      passwordLabel: "पासवर्ड (Secret Key)",
      passwordPlaceholder: "••••••••",
      showPassword: "पासवर्ड दिखाएं",
      hidePassword: "पासवर्ड छिपाएं",
      loginBtn: "लॉगिन करें (सुरक्षित प्रवेश) →",
      authenticating: "प्रमाणीकरण हो रहा है…",
      errorInvalid: "ईमेल या पासवर्ड गलत है। कृपया पुनः प्रयास करें।",
      securitySSL: "256-Bit SSL एन्क्रिप्टेड",
      securityJWT: "JWT सेशन",
      securitySDC: "राज्य डेटा केंद्र (SDC)",
      legalNotice:
        "यह प्रणाली केवल अधिकृत सरकारी अधिकारियों के शासकीय उपयोग के लिए है।",
    },
    dashboard: {
      portalBadge: "हरियाणा समाज कल्याण पोर्टल",
      greetingMorning: "सुप्रभात",
      greetingDay: "नमस्कार",
      briefingStats:
        "आपके कार्यक्षेत्र में कुल {total} आवेदन पंजीकृत हैं — जिनमें से {pending} लंबित हैं एवं {slaBreached} आवेदनों की 30-दिवसीय SLA सीमा समाप्त हो चुकी है।",
      slaAlertTitle: "SLA अतिदेय चेतावनी (RTSA 2014)",
      slaAlertDesc:
        "{count} आवेदन सेवा अधिकार सीमा पार कर चुके हैं। तुरंत समीक्षा करें।",
      slaReviewBtn: "समीक्षा सूची ({count}) →",
      kpiTotalLabel: "कुल पंजीकृत",
      kpiTotalSub: "समस्त आवेदन",
      kpiPendingLabel: "लंबित समीक्षा",
      kpiPendingSub: "{percent}% अनिस्तारित",
      kpiSlaLabel: "SLA उल्लंघन",
      kpiSlaSub: "> 30 दिन लंबित",
      kpiHighLabel: "उच्च प्राथमिकता",
      kpiHighSub: "फ्लैग किए गए",
      kpiApprovedLabel: "स्वीकृत पेंशन",
      kpiApprovedSub: "सत्यापित व पात्र",
      kpiRejectedLabel: "अस्वीकृत / वापस",
      kpiRejectedSub: "{rejected} अस्वीकृत • {returned} वापस",
      searchPlaceholder:
        "आवेदक का नाम, पिता/पति का नाम, गाँव, तहसील या आधार संख्या से खोजें…",
      searchClear: "खोज साफ़ करें",
      sortLabel: "क्रम:",
      sortUrgency: "प्राथमिकता स्कोर (तत्कालता)",
      sortWaiting: "प्रतीक्षा काल (सर्वाधिक दिन)",
      sortAge: "आवेदक की आयु (वरिष्ठता)",
      sortDate: "आवेदन की नई तिथि",
      viewTable: "तालिका",
      viewCards: "कार्ड्स",
      filterAll: "सभी आवेदन",
      filterSla: "SLA उल्लंघन",
      filterHigh: "उच्च प्राथमिकता",
      filterPending: "लंबित समीक्षा",
      filterApproved: "स्वीकृत",
      filterRejected: "अस्वीकृत / वापस",
      resultsCount: "प्रदर्शित: {shown} / कुल {total} आवेदन",
      filterTagPrefix: "फ़िल्टर:",
      searchTagPrefix: "खोज:",
      emptyTitle: "कोई आवेदन नहीं मिला",
      emptyDesc:
        "आपके द्वारा चुने गए फ़िल्टर या खोज शब्द के अनुरूप कोई रिकॉर्ड उपलब्ध नहीं है।",
      resetFilters: "फ़िल्टर रीसेट करें",
      thIndex: "#",
      thApplicant: "आवेदक विवरण",
      thLocation: "गाँव / तहसील",
      thAge: "आयु (पात्रता)",
      thIncome: "वार्षिक आय",
      thWaiting: "प्रतीक्षा काल / SLA",
      thStatus: "स्थिति",
      thPriority: "प्राथमिकता",
      thAction: "कार्यवाही",
      relationPrefix: "आत्मज/पत्नी:",
      ageEligible: "पात्र (60+ वर्ष)",
      ageIneligible: "अपात्र (<60 वर्ष)",
      incomeWithin: "सीमा के भीतर",
      incomeExceeds: "सीमा से अधिक",
      slaOverdue: "SLA अतिदेय",
      btnReview: "समीक्षा करें",
      btnReviewed: "पूर्ण",
      gridIdPrefix: "ID:",
      gridSubmitted: "जमा तिथि:",
      daysPending: "{days} दिन लंबित",
    },
    detail: {
      backToDashboard: "डैशबोर्ड",
      applicationId: "आवेदन सं:",
      copyId: "आवेदन आईडी कॉपी करें",
      copied: "✓ कॉपी हुआ",
      submissionDate: "आवेदन तिथि:",
      daysAgo: "{days} दिन पूर्व",
      daysCount: "{days} दिन",
      verifiedApplicant: "पंजीकृत आवेदक",
      relation: "आत्मज/पत्नी:",
      locationDistrict: "{village}, तहसील {tehsil}, जिला {district}",
      aadhaar: "आधार: {masked}",
      waitingTime: "प्रतीक्षा काल: {days} दिन",
      snapAgeEligible: "✓ आयु पात्र",
      snapAgeIneligible: "✕ आयु अपात्र",
      snapIncomeWithin: "✓ आय सीमा के अंतर्गत",
      snapIncomeExceeds: "✕ आय सीमा से अधिक",
      snapBankVerified: "✓ बैंक खाता सत्यापित",
      snapBankMismatch: "बैंक खाता नाम भिन्न",
      snapDocsCount: "{count}/6 दस्तावेज़ संलग्न",
      sectionPersonal: "व्यक्तिगत एवं पात्रता विवरण",
      subPersonal: "हरियाणा वृद्धावस्था पेंशन पात्रता नियम 1991",
      labelFullName: "आवेदक का पूरा नाम",
      labelFatherHusband: "पिता / पति का नाम",
      labelDobAge: "जन्म तिथि एवं आयु",
      noteAgePass: "वैधानिक न्यूनतम आयु 60 वर्ष पूरी है",
      noteAgeFail: "नियम: आवेदक की आयु कम से कम 60 वर्ष पूर्ण होनी चाहिए",
      labelAnnualIncome: "सत्यापित वार्षिक आय",
      noteIncomePass: "वैधानिक सीमा ₹2,00,000 के भीतर",
      noteIncomeFail: "नियम: कुल वार्षिक आय ₹2,00,000 से अधिक न हो",
      labelResidence: "निवास स्थान (गाँव)",
      labelTehsilDistrict: "तहसील एवं ज़िला",
      labelAadhaar: "आधार संख्या (मास्क्ड)",
      labelSubmittedAt: "आवेदन जमा करने की तिथि",
      sectionBank: "बैंक खाता एवं वित्तीय सत्यापन",
      subBank: "डीबीटी (DBT) पेंशन अंतरण हेतु खाता मिलान",
      bankMatchTitle: "खाता धारक का नाम पूर्णतः मेल खाता है",
      bankMismatchTitle: "खाता धारक के नाम में भिन्नता (Name Mismatch Detected)",
      bankMatchDesc:
        "आवेदक नाम: {applicant} ⟷ बैंक पासबुक: {holder}",
      labelBankHolder: "बैंक खाता धारक का नाम",
      labelBankAccount: "खाता संख्या (मास्क्ड)",
      labelBankIfsc: "बैंक IFSC कोड",
      labelDbtStatus: "डीबीटी (DBT) अंतरण पात्रता",
      dbtValid: "सक्रिय एवं मान्य",
      dbtPending: "सत्यापन अपेक्षित",
      sectionDocs: "अनिवार्य दस्तावेज़ सत्यापन पोर्टफोलियो",
      subDocs: "हरियाणा समाज कल्याण नियम अनुसार आवश्यक 6 प्रमाण",
      docsAvailableCount: "{count} / 6 उपलब्ध",
      docStatusMissing: "दस्तावेज़ संलग्न नहीं है",
      docStatusExpired: "दस्तावेज़ की समयावधि समाप्त हो चुकी है",
      docStatusValid: "प्रमाणित व मान्य संलग्नक",
      docPillMissing: "लापता",
      docPillExpired: "वैधता समाप्त",
      docPillAttached: "संलग्न ✓",
      aiSectionTitle: "AI समीक्षा सह-पायलट",
      aiEngineGemini: "इंजन: Groq / Google Gemini",
      aiEngineRule: "इंजन: स्थानीय नियम इंजन (Rule Engine)",
      aiBtnReanalyze: "पुनः विश्लेषण",
      aiBtnAnalyzing: "विश्लेषण हो रहा है…",
      aiDisclaimer:
        "AI केवल नीतिगत सहायता व सिफारिश प्रदान करता है। अंतिम विधिक निर्णय अधिकारी का होगा।",
      aiActionHeading: "AI सुझाई गई कार्यवाही:",
      aiActionApprove: "स्वीकृत करें (APPROVE)",
      aiActionReject: "अस्वीकृत करें (REJECT)",
      aiActionReturn: "सुधार हेतु लौटाएँ (RETURN)",
      aiBtnApply: "AI सिफ़ारिश लागू करें",
      inconsistenciesTitle: "पहचानी गई विसंगतियाँ ({count})",
      severityCritical: "गंभीर (Critical)",
      severityWarning: "चेतावनी (Warning)",
      severityInfo: "सूचना (Info)",
      findingsTitle: "विस्तृत जाँच निष्कर्ष ({count})",
      sectionDecision: "कार्यपालक निर्णय केंद्र (Officer Decision)",
      subDecision:
        "अधिकारी के रूप में अंतिम निर्णय व अनिवार्य टिप्पणी दर्ज करें",
      alreadyDecidedTitle: "यह आवेदन पूर्व में ही निस्तारित किया जा चुका है:",
      alreadyDecidedSub:
        "हरियाणा लोक सेवा अधिकार अधिनियम व डिजिटल ऑडिट ट्रेल नियमों के तहत अंतिम रूप से स्वीकृत अथवा अस्वीकृत आवेदनों पर दोहरा निर्णय प्रतिबन्धित है।",
      chooseDecisionLabel: "अंतिम निर्णय चुनें (अनिवार्य):",
      btnApprove: "स्वीकृत करें",
      btnApproveSub: "Approve",
      btnReject: "अस्वीकृत करें",
      btnRejectSub: "Reject",
      btnReturn: "सुधार हेतु लौटाएँ",
      btnReturnSub: "Return for Correction",
      quickPresetsLabel: "त्वरित कारण चुनें:",
      overrideTitle: "AI सिफ़ारिश से भिन्न निर्णय (Override Alert)",
      overrideDesc:
        "आप AI द्वारा सुझाई गई कार्यवाही ({action}) के विपरीत निर्णय ले रहे हैं। ऑडिट ट्रेल में यह प्रविष्टि विशेष रूप से दर्ज की जाएगी। कृपया नीचे ठोस कारण लिखें।",
      reasonLabel: "निर्णय का विधिक व तथ्यात्मक कारण",
      prefillAiBtn: "AI का सुझाव भरें",
      reasonPlaceholder:
        "यहाँ निर्णय का स्पष्ट व आधिकारिक कारण लिखें (उदा. सभी दस्तावेज़ पूर्ण व आयु 60+ सत्यापित होने पर पेंशन स्वीकृत की गई)...",
      charMinNotice: "न्यूनतम 10 अक्षर अनिवार्य हैं।",
      charCount: "{count} / 10 अक्षर",
      btnSaveDecision: "✓ अंतिम निर्णय सुरक्षित करें",
      btnSaving: "प्रक्रियाधीन…",
      sectionAudit: "अपरिवर्तनीय डिजिटल ऑडिट ट्रेल",
      subAudit: "अधिकारियों द्वारा की गई सभी कार्यवाहियों का स्थायी रिकॉर्ड",
      auditEntries: "{count} प्रविष्टियाँ",
      emptyAudit:
        "इस आवेदन पर पूर्व में कोई कार्यवाही दर्ज नहीं हुई है। आपका निर्णय पहला ऑडिट रिकॉर्ड बनेगा।",
      auditOverrideTag: "AI सुझाव से भिन्न निर्णय",
      auditRecordedReason: "दर्ज कारण:",
      auditActionRegistered: "आवेदन पंजीकृत",
      modalConfirmTitle: "क्या आप वाकई यह निर्णय दर्ज करना चाहते हैं?",
      modalConfirmSub:
        "यह निर्णय स्थायी रूप से डेटाबेस व ऑडिट ट्रेल में दर्ज हो जाएगा।",
      modalApplicant: "आवेदक:",
      modalDecision: "चयनित निर्णय:",
      modalReason: "दर्ज कारण:",
      modalCancel: "रद्द करें",
      modalConfirmBtn: "हाँ, निर्णय पुष्टि करें",
      valAlreadyDecided:
        "इस आवेदन पर पहले ही निर्णय लिया जा चुका है। दोहरा निर्णय दर्ज नहीं किया जा सकता।",
      valSelectDecision:
        "कृपया पहले निर्णय (स्वीकृत / अस्वीकृत / सुधार हेतु लौटाएँ) का चयन करें।",
      valMinChars:
        "निर्णय हेतु स्पष्ट कारण दर्ज करना अनिवार्य है (कम से कम 10 अक्षर आवश्यक हैं)।",
      msgSuccess:
        "निर्णय सफलतापूर्वक दर्ज किया गया: आवेदन {action} कर दिया गया है।",
      msgFail: "निर्णय सहेजने में विफल।",
      // Explicit Aliases
      copyIdTooltip: "आवेदन आईडी कॉपी करें",
      appNoPrefix: "आवेदन सं:",
      copiedSuccess: "✓ कॉपी हुआ",
      slaOverdue: "SLA अतिदेय ({days} दिन)",
      applicationDate: "आवेदन तिथि",
      registeredApplicant: "पंजीकृत आवेदक",
      relationPrefix: "आत्मज/पत्नी",
      locationFormat: "{village}, तहसील {tehsil}, जिला {district}",
      aadhaarLabel: "आधार",
      waitingPeriod: "प्रतीक्षा काल",
      ageEligible: "✓ आयु पात्र",
      ageIneligible: "✕ आयु अपात्र",
      yearsAge: "{age} वर्ष",
      incomeEligible: "✓ आय सीमा के अंतर्गत",
      incomeIneligible: "✕ आय सीमा से अधिक",
      bankVerified: "✓ बैंक खाता सत्यापित",
      bankNameMismatch: "बैंक खाता नाम भिन्न",
      documentsAttached: "{count}/6 दस्तावेज़ संलग्न",
      personalDossierTitle: "व्यक्तिगत एवं पात्रता विवरण",
      personalDossierSub: "हरियाणा वृद्धावस्था पेंशन पात्रता नियम 1991",
      applicantFullName: "आवेदक का पूरा नाम",
      fatherHusbandName: "पिता / पति का नाम",
      dobAndAge: "जन्म तिथि एवं आयु",
      ineligibleAgeBadge: "अपात्र (<60 वर्ष)",
      eligibleAgeBadge: "पात्र (60+ वर्ष)",
      ageRuleNoteFail: "नियम: आवेदक की आयु कम से कम 60 वर्ष पूर्ण होनी चाहिए",
      ageRuleNotePass: "वैधानिक न्यूनतम आयु 60 वर्ष पूरी है",
      annualIncome: "सत्यापित वार्षिक आय",
      incomeAboveLimitBadge: "सीमा से अधिक",
      incomeWithinLimitBadge: "सीमा के अंतर्गत",
      incomeRuleNoteFail: "नियम: कुल वार्षिक आय ₹2,00,000 से अधिक न हो",
      incomeRuleNotePass: "वैधानिक सीमा ₹2,00,000 के भीतर",
      village: "निवास स्थान (गाँव)",
      tehsilAndDistrict: "तहसील एवं ज़िला",
      aadhaarNo: "आधार संख्या (मास्क्ड)",
      submittedOn: "आवेदन जमा करने की तिथि",
      bankVerificationTitle: "बैंक खाता एवं वित्तीय सत्यापन",
      bankVerificationSub: "डीबीटी (DBT) पेंशन अंतरण हेतु खाता मिलान",
      bankMatchMismatchTitle: "खाता धारक के नाम में भिन्नता (Name Mismatch Detected)",
      bankMatchSuccessTitle: "खाता धारक का नाम पूर्णतः मेल खाता है",
      applicantNameLabel: "आवेदक नाम",
      bankPassbookNameLabel: "बैंक पासबुक",
      bankAccountHolder: "बैंक खाता धारक का नाम",
      bankAccountMasked: "खाता संख्या (मास्क्ड)",
      bankIfsc: "बैंक IFSC कोड",
      dbtEligibility: "डीबीटी (DBT) अंतरण पात्रता",
      dbtVerificationPending: "सत्यापन अपेक्षित",
      dbtActiveValid: "सक्रिय एवं मान्य",
      docPortfolioTitle: "अनिवार्य दस्तावेज़ सत्यापन पोर्टफोलियो",
      docPortfolioSub: "हरियाणा समाज कल्याण नियम अनुसार आवश्यक 6 प्रमाण",
      docCountTag: "{count} / 6 उपलब्ध",
      docMissingSub: "दस्तावेज़ संलग्न नहीं है",
      docExpiredSub: "दस्तावेज़ की समयावधि समाप्त हो चुकी है",
      docValidSub: "प्रमाणित व मान्य संलग्नक",
      aiCopilotTitle: "AI समीक्षा सह-पायलट",
      enginePrefix: "इंजन",
      ruleEngineName: "स्थानीय नियम इंजन (Rule Engine)",
      aiFallbackBanner: "एआई सेवा अनुपलब्ध होने के कारण स्थानीय नियम-आधारित विश्लेषण प्रदर्शित है।",
      aiAnalyzing: "विश्लेषण हो रहा है…",
      aiReanalyze: "पुनः विश्लेषण",
      aiSuggestedAction: "AI सुझाई गई कार्यवाही",
      applyAiRecommendation: "AI सिफ़ारिश लागू करें",
      decisionApproveFull: "स्वीकृत करें (APPROVE)",
      decisionRejectFull: "अस्वीकृत करें (REJECT)",
      decisionReturnFull: "सुधार हेतु वापस लौटाएं (RETURN)",
      discrepanciesTitle: "पहचानी गई विसंगतियाँ ({count})",
      decisionStationTitle: "कार्यपालक निर्णय केंद्र (Officer Decision)",
      decisionStationSub: "अधिकारी के रूप में अंतिम निर्णय व अनिवार्य टिप्पणी दर्ज करें",
      actionApprove: "स्वीकृत करें",
      actionApproveSub: "Approve",
      actionReject: "अस्वीकृत करें",
      actionRejectSub: "Reject",
      actionReturn: "वापस लौटाएं",
      actionReturnSub: "Return",
      presetReasonsLabel: "त्वरित कारण चुनें:",
      overrideWarningTitle: "AI सिफ़ारिश से भिन्न निर्णय (Override Alert)",
      overrideWarningDesc1: "आप AI द्वारा सुझाई गई कार्यवाही",
      overrideWarningDesc2: "के विपरीत निर्णय ले रहे हैं। ऑडिट ट्रेल में यह प्रविष्टि विशेष रूप से दर्ज की जाएगी। कृपया नीचे ठोस कारण लिखें।",
      reasonInputLabel: "निर्णय का विधिक व तथ्यात्मक कारण",
      btnFillAiSuggestion: "AI का सुझाव भरें",
      minCharsRequired: "न्यूनतम 10 अक्षर अनिवार्य हैं।",
      charCounter: "{count} अक्षर (न्यूनतम 10)",
      submittingDecision: "प्रक्रियाधीन…",
      btnSubmitFinalDecision: "अंतिम निर्णय सुरक्षित करें",
      auditTrailTitle: "अपरिवर्तनीय डिजिटल ऑडिट ट्रेल",
      auditTrailSub: "अधिकारियों द्वारा की गई सभी कार्यवाहियों का स्थायी रिकॉर्ड",
      auditEntriesCount: "{count} प्रविष्टियाँ",
      emptyAuditText: "इस आवेदन पर पूर्व में कोई कार्यवाही दर्ज नहीं हुई है। आपका निर्णय पहला ऑडिट रिकॉर्ड बनेगा।",
      auditOverriddenBadge: "AI सुझाव से भिन्न निर्णय",
      confirmModalTitle: "क्या आप वाकई यह निर्णय दर्ज करना चाहते हैं?",
      confirmModalSub: "यह निर्णय स्थायी रूप से डेटाबेस व ऑडिट ट्रेल में दर्ज हो जाएगा।",
      confirmModalApplicant: "आवेदक",
      confirmModalDecision: "चयनित निर्णय",
      confirmModalReason: "दर्ज कारण",
      confirmModalCancel: "रद्द करें",
      confirmModalConfirm: "हाँ, निर्णय पुष्टि करें",
      errorAlreadyDecided: "इस आवेदन पर पहले ही निर्णय लिया जा चुका है। दोहरा निर्णय दर्ज नहीं किया जा सकता।",
      errorSelectDecisionFirst: "कृपया पहले निर्णय (स्वीकृत / अस्वीकृत / वापस) का चयन करें।",
      errorReasonMinChars: "निर्णय हेतु स्पष्ट कारण दर्ज करना अनिवार्य है (कम से कम 10 अक्षर आवश्यक हैं)।",
      saveDecisionFailed: "निर्णय सहेजने में विफल।",
      successDecisionSaved: "निर्णय सफलतापूर्वक दर्ज किया गया: आवेदन {action} कर दिया गया है।",
    },
    intake: {
      navLabel: "नया आवेदन",
      pageBadge: "आवेदन पंजीकरण",
      pageTitle: "नया वृद्धावस्था पेंशन आवेदन दर्ज करें",
      pageSub: "आवेदक का विवरण भरें। पंजीकरण के बाद आवेदन समीक्षा कतार में जुड़ जाएगा और नियम-आधारित व AI विश्लेषण स्वतः चलेगा।",
      sectionApplicant: "आवेदक विवरण",
      sectionBank: "पहचान एवं बैंक विवरण",
      sectionDocs: "संलग्न दस्तावेज़",
      sectionPriority: "प्राथमिकता",
      applicantName: "आवेदक का नाम",
      fatherHusbandName: "पिता / पति का नाम",
      dob: "जन्म तिथि",
      village: "गाँव / वार्ड",
      tehsil: "तहसील",
      district: "ज़िला",
      annualIncome: "वार्षिक पारिवारिक आय (₹)",
      aadhaarLast4: "आधार के अंतिम 4 अंक",
      bankAccountHolder: "खाता धारक का नाम",
      bankIFSC: "IFSC कोड",
      bankAccountLast4: "खाता संख्या के अंतिम 4 अंक",
      privacyNote: "गोपनीयता हेतु केवल अंतिम 4 अंक संग्रहित किए जाते हैं।",
      docsSelectAll: "सभी चुनें",
      docsClear: "साफ़ करें",
      priorityNormal: "सामान्य",
      priorityHigh: "उच्च प्राथमिकता",
      flagNote: "उच्च प्राथमिकता का कारण",
      flagNotePlaceholder: "जैसे: CM विंडो शिकायत, गंभीर बीमारी, अकेले रहने वाले वरिष्ठ नागरिक",
      previewTitle: "पात्रता पूर्वावलोकन",
      previewSub: "वैधानिक नियमों के अनुसार तत्काल जाँच",
      previewAge: "आयु",
      previewIncome: "आय",
      previewDocs: "दस्तावेज़",
      previewPending: "विवरण भरें",
      previewLikelyApprove: "सभी वैधानिक मानक पूरे — स्वीकृति योग्य प्रतीत होता है",
      previewLikelyReject: "वैधानिक मानक पूरे नहीं — अस्वीकृति संभावित",
      previewLikelyReturn: "दस्तावेज़ अधूरे — वापसी संभावित",
      previewDisclaimer: "यह केवल पूर्वावलोकन है। अंतिम निर्णय समीक्षा अधिकारी द्वारा लिया जाएगा।",
      submitBtn: "आवेदन पंजीकृत करें",
      submitting: "पंजीकृत किया जा रहा है...",
      cancelBtn: "रद्द करें",
      errorFixFields: "कृपया चिह्नित फ़ील्ड सुधारें।",
      errorText: "कम से कम 2 अक्षर आवश्यक हैं।",
      errorDob: "मान्य पिछली जन्म तिथि दर्ज करें।",
      errorDigits4: "ठीक 4 अंक दर्ज करें।",
      errorIFSC: "मान्य IFSC दर्ज करें (जैसे SBIN0001234)।",
      errorIncome: "मान्य आय राशि दर्ज करें।",
      errorFlagNote: "उच्च प्राथमिकता हेतु कारण (कम से कम 5 अक्षर) आवश्यक है।",
    },
    reports: {
      navLabel: "रिपोर्ट",
      pageBadge: "जवाबदेही एवं पारदर्शिता",
      pageTitle: "निर्णय रिपोर्ट एवं AI जवाबदेही",
      pageSub: "सभी आँकड़े अपरिवर्तनीय ऑडिट ट्रेल से सीधे गणना किए गए हैं। AI केवल सुझाव देता है — अंतिम निर्णय अधिकारी का होता है।",
      exportCsv: "CSV डाउनलोड करें",
      kpiDecisions: "कुल निर्णय",
      kpiDecisionsSub: "{pending} आवेदन अभी लंबित",
      kpiAgreement: "AI सुझाव से सहमति",
      kpiAgreementSub: "{count} निर्णयों में AI सुझाव से भिन्न",
      kpiAvgDays: "औसत निपटान समय",
      kpiAvgDaysSub: "आवेदन जमा से निर्णय तक",
      kpiSla: "SLA अनुपालन",
      kpiSlaSub: "{days} दिन के भीतर निपटाए गए",
      kpiNoData: "अभी कोई निर्णय नहीं",
      outcomesTitle: "निर्णय परिणाम",
      outcomesSub: "अधिकारियों द्वारा दर्ज अंतिम निर्णयों का वितरण",
      matrixTitle: "AI सुझाव बनाम अधिकारी निर्णय",
      matrixSub: "विकर्ण = सहमति। अन्य खाने = अधिकारी ने AI सुझाव बदला।",
      matrixRowHeader: "AI सुझाव ↓ / अधिकारी निर्णय →",
      matrixCellTitle: "AI: {ai} → अधिकारी: {officer} — {count} निर्णय",
      activityTitle: "हालिया गतिविधि",
      activitySub: "ऑडिट ट्रेल की नवीनतम प्रविष्टियाँ",
      thTime: "समय",
      thApplicant: "आवेदक",
      thOfficer: "अधिकारी",
      thAction: "कार्यवाही",
      thAi: "AI सुझाव",
      overriddenTag: "AI से भिन्न",
      emptyActivity: "अभी तक कोई गतिविधि दर्ज नहीं हुई है।",
      decisionApprove: "स्वीकृत",
      decisionReject: "अस्वीकृत",
      decisionReturn: "वापस",
      daysUnit: "दिन",
    },
    docs: {
      "आयु प्रमाण पत्र": "आयु प्रमाण पत्र",
      "आय प्रमाण पत्र": "आय प्रमाण पत्र",
      "आधार कार्ड": "आधार कार्ड",
      "बैंक पासबुक": "बैंक पासबुक",
      "निवास प्रमाण पत्र": "निवास प्रमाण पत्र",
      "पासपोर्ट साइज फोटो": "पासपोर्ट साइज फोटो",
    },
    presets: {
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
    },
  },
  en: {
    common: {
      appName: "Old Age Pension Review Portal",
      appNameShort: "Pension Review Portal",
      deptName: "Govt. of Haryana • Social Welfare Dept.",
      stateTag: "GOVERNMENT OF HARYANA",
      activeSession: "Active Session",
      dashboard: "Dashboard",
      logout: "Logout",
      logoutConfirm: "Logout securely",
      officer: "Officer",
      tehsildar: "Tehsildar",
      days: "days",
      years: "years",
      perYear: "year",
      cancel: "Cancel",
      confirm: "Confirm",
      close: "Close",
      back: "Back",
      retry: "Retry",
      loading: "Loading...",
      footerRule1: "Haryana Old Age Samman Allowance Rules, 1991",
      footerRule2: "Haryana Right to Service Act, 2014",
      footerTech: "NIC & State Data Centre, Haryana • Secured with Prisma & Neon DB",
      statusPending: "Pending",
      statusApproved: "Approved",
      statusRejected: "Rejected",
      statusReturned: "Returned",
      priorityHigh: "High Priority",
      priorityNormal: "Normal",
      switchLang: "हिंदी",
    },
    login: {
      deptBanner: "Government of Haryana • Social Welfare Department",
      stateTitle: "GOVERNMENT OF HARYANA",
      heroMainTitle: "Old Age Pension Review",
      heroTitleHighlight: " & Decision Portal",
      heroSubtitle:
        "Authorized portal for Tehsil and Block Officers to conduct fast, transparent, and AI-assisted verification of old-age pension applications under Haryana state guidelines.",
      featureAiTitle: "AI Co-Pilot (Groq / Gemini)",
      featureAiDesc:
        "Automated cross-check of age (60+ yrs), income ceiling, and bank account name discrepancy.",
      featureSlaTitle: "SLA Compliance Tracking (30 Days)",
      featureSlaDesc:
        "Priority-ordered workflow aligned with the Haryana Right to Service Act.",
      featureAuditTitle: "Immutable Digital Audit Trail",
      featureAuditDesc:
        "Permanent timestamped log of every approval, rejection, and return by reviewing officers.",
      liveCloudTag: "Neon PostgreSQL Cloud • 20 Live Applications Secured",
      missionTag: "Digital Haryana Mission 2026",
      demoCalloutTitle: "Quick Login for Evaluation / Review",
      demoCalloutSub: "Officer Credentials:",
      demoAutofillBtn: "1-Click Auto-Fill Demo Credentials",
      demoAutofilledBtn: "✓ Credentials Auto-Filled!",
      cardBadge: "Authorized Officer Access",
      cardTitle: "Sign in to Portal",
      cardDesc:
        "Enter your official credentials to access the pension review system",
      emailLabel: "Official Email Address",
      emailPlaceholder: "officer@demo.gov.in",
      passwordLabel: "Password (Secret Key)",
      passwordPlaceholder: "••••••••",
      showPassword: "Show password",
      hidePassword: "Hide password",
      loginBtn: "Sign In (Secure Access) →",
      authenticating: "Authenticating…",
      errorInvalid: "Invalid email or password. Please try again.",
      securitySSL: "256-Bit SSL Encrypted",
      securityJWT: "JWT Session",
      securitySDC: "State Data Centre (SDC)",
      legalNotice:
        "This system is strictly for authorized official government use only.",
    },
    dashboard: {
      portalBadge: "Haryana Social Welfare Portal",
      greetingMorning: "Good Morning",
      greetingDay: "Good Day",
      briefingStats:
        "There are {total} registered applications in your jurisdiction — {pending} pending review and {slaBreached} with 30-day SLA statutory deadline breached.",
      slaAlertTitle: "SLA Overdue Warning (RTSA 2014)",
      slaAlertDesc:
        "{count} applications have breached statutory time limits. Immediate review required.",
      slaReviewBtn: "Review Overdue List ({count}) →",
      kpiTotalLabel: "Total Registered",
      kpiTotalSub: "All Applications",
      kpiPendingLabel: "Pending Review",
      kpiPendingSub: "{percent}% Unprocessed",
      kpiSlaLabel: "SLA Breached",
      kpiSlaSub: "> 30 days pending",
      kpiHighLabel: "High Priority",
      kpiHighSub: "Flagged Cases",
      kpiApprovedLabel: "Sanctioned Pension",
      kpiApprovedSub: "Verified & Eligible",
      kpiRejectedLabel: "Rejected / Returned",
      kpiRejectedSub: "{rejected} Rejected • {returned} Returned",
      searchPlaceholder:
        "Search by applicant name, father/husband, village, tehsil, or Aadhaar…",
      searchClear: "Clear search",
      sortLabel: "Sort:",
      sortUrgency: "Urgency Priority Score",
      sortWaiting: "Waiting Time (Longest Pending)",
      sortAge: "Applicant Age (Seniority)",
      sortDate: "Submission Date (Newest)",
      viewTable: "Table",
      viewCards: "Cards",
      filterAll: "All Applications",
      filterSla: "SLA Breached",
      filterHigh: "High Priority",
      filterPending: "Pending Review",
      filterApproved: "Approved",
      filterRejected: "Rejected / Returned",
      resultsCount: "Showing: {shown} / Total {total} applications",
      filterTagPrefix: "Filter:",
      searchTagPrefix: "Search:",
      emptyTitle: "No Applications Found",
      emptyDesc:
        "No application records match your selected filter or search terms.",
      resetFilters: "Reset Filters",
      thIndex: "#",
      thApplicant: "Applicant Details",
      thLocation: "Village / Tehsil",
      thAge: "Age (Eligibility)",
      thIncome: "Annual Income",
      thWaiting: "Waiting Time / SLA",
      thStatus: "Status",
      thPriority: "Priority",
      thAction: "Action",
      relationPrefix: "S/o, W/o:",
      ageEligible: "Eligible (60+ yrs)",
      ageIneligible: "Ineligible (<60 yrs)",
      incomeWithin: "Within limit",
      incomeExceeds: "Above ceiling",
      slaOverdue: "SLA Overdue",
      btnReview: "Review",
      btnReviewed: "Done",
      gridIdPrefix: "ID:",
      gridSubmitted: "Submitted:",
      daysPending: "{days} days pending",
    },
    detail: {
      backToDashboard: "Dashboard",
      applicationId: "Application ID:",
      copyId: "Copy Application ID",
      copied: "✓ Copied",
      submissionDate: "Submission Date:",
      daysAgo: "{days} days ago",
      daysCount: "{days} days",
      verifiedApplicant: "Registered Applicant",
      relation: "S/o, W/o:",
      locationDistrict: "{village}, Tehsil {tehsil}, Dist. {district}",
      aadhaar: "Aadhaar: {masked}",
      waitingTime: "Waiting Time: {days} days",
      snapAgeEligible: "✓ Age Eligible",
      snapAgeIneligible: "✕ Underage",
      snapIncomeWithin: "✓ Within Income Limit",
      snapIncomeExceeds: "✕ Above Income Limit",
      snapBankVerified: "✓ Bank Account Verified",
      snapBankMismatch: "Bank Name Mismatch",
      snapDocsCount: "{count}/6 Documents Attached",
      sectionPersonal: "Personal & Eligibility Dossier",
      subPersonal: "Haryana Old Age Samman Allowance Rules 1991",
      labelFullName: "Applicant's Full Name",
      labelFatherHusband: "Father / Husband's Name",
      labelDobAge: "Date of Birth & Age",
      noteAgePass: "Statutory minimum age requirement of 60 years is satisfied",
      noteAgeFail: "Rule: Applicant must have attained at least 60 years of age",
      labelAnnualIncome: "Verified Annual Income",
      noteIncomePass: "Within statutory ceiling of ₹2,00,000",
      noteIncomeFail: "Rule: Annual household income must not exceed ₹2,00,000",
      labelResidence: "Place of Residence (Village)",
      labelTehsilDistrict: "Tehsil & District",
      labelAadhaar: "Aadhaar Number (Masked)",
      labelSubmittedAt: "Application Submission Date",
      sectionBank: "Bank Account & Financial Verification",
      subBank: "Account verification for Direct Benefit Transfer (DBT)",
      bankMatchTitle: "Bank Account Holder Name Matches Exactly",
      bankMismatchTitle: "Account Holder Name Mismatch Detected",
      bankMatchDesc:
        "Applicant Name: {applicant} ⟷ Passbook Holder: {holder}",
      labelBankHolder: "Bank Account Holder Name",
      labelBankAccount: "Account Number (Masked)",
      labelBankIfsc: "Bank IFSC Code",
      labelDbtStatus: "DBT Transfer Eligibility",
      dbtValid: "Active & Valid",
      dbtPending: "Verification Required",
      sectionDocs: "Mandatory Document Portfolio",
      subDocs: "6 mandatory statutory proofs required under Haryana Social Welfare Rules",
      docsAvailableCount: "{count} / 6 Available",
      docStatusMissing: "Document is not attached",
      docStatusExpired: "Document validity period has expired",
      docStatusValid: "Certified and valid attachment",
      docPillMissing: "Missing",
      docPillExpired: "Expired",
      docPillAttached: "Attached ✓",
      aiSectionTitle: "AI Review Co-Pilot",
      aiEngineGemini: "Engine: Groq / Google Gemini",
      aiEngineRule: "Engine: Local Rule Engine",
      aiBtnReanalyze: "Re-Analyze",
      aiBtnAnalyzing: "Analyzing…",
      aiDisclaimer:
        "AI provides policy assistance and recommendations only. The officer makes the final legal decision.",
      aiActionHeading: "AI Recommended Action:",
      aiActionApprove: "Approve (APPROVE)",
      aiActionReject: "Reject (REJECT)",
      aiActionReturn: "Return for Correction (RETURN)",
      aiBtnApply: "Apply AI Recommendation",
      inconsistenciesTitle: "Identified Discrepancies ({count})",
      severityCritical: "Critical",
      severityWarning: "Warning",
      severityInfo: "Info",
      findingsTitle: "Detailed Findings ({count})",
      sectionDecision: "Executive Decision Station",
      subDecision:
        "Record final administrative decision and mandatory remark as designated officer",
      alreadyDecidedTitle: "This application has already been processed:",
      alreadyDecidedSub:
        "Under the Haryana Right to Service Act and digital audit trail regulations, duplicate decisions on processed applications are prohibited.",
      chooseDecisionLabel: "Select Final Decision (Mandatory):",
      btnApprove: "Approve",
      btnApproveSub: "Grant Pension",
      btnReject: "Reject",
      btnRejectSub: "Ineligible",
      btnReturn: "Return for Correction",
      btnReturnSub: "Resubmission",
      quickPresetsLabel: "Quick Reasons:",
      overrideTitle: "Decision Differs from AI Recommendation (Override Alert)",
      overrideDesc:
        "You are overriding the AI suggested action ({action}). This override will be recorded in the official audit trail. Please provide detailed legal justification below.",
      reasonLabel: "Legal and Factual Justification for Decision",
      prefillAiBtn: "Fill AI Suggestion",
      reasonPlaceholder:
        "Enter clear, official justification here (e.g. All 6 mandatory documents verified, applicant meets 60+ age criterion and income is within statutory limit)...",
      charMinNotice: "Minimum 10 characters required.",
      charCount: "{count} / 10 characters",
      btnSaveDecision: "✓ Save Final Decision",
      btnSaving: "Processing…",
      sectionAudit: "Immutable Digital Audit Trail",
      subAudit: "Permanent timestamped log of all officer actions",
      auditEntries: "{count} entries",
      emptyAudit:
        "No prior action recorded for this application. Your decision will create the first audit entry.",
      auditOverrideTag: "Decision Overrode AI Suggestion",
      auditRecordedReason: "Recorded Reason:",
      auditActionRegistered: "Application Registered",
      modalConfirmTitle: "Are you sure you want to record this decision?",
      modalConfirmSub:
        "This decision will be permanently saved to the database and audit trail.",
      modalApplicant: "Applicant:",
      modalDecision: "Selected Decision:",
      modalReason: "Recorded Reason:",
      modalCancel: "Cancel",
      modalConfirmBtn: "Yes, Confirm Decision",
      valAlreadyDecided:
        "A decision has already been recorded for this application. Duplicate decisions cannot be submitted.",
      valSelectDecision:
        "Please select a decision (Approve / Reject / Return for Correction).",
      valMinChars:
        "A clear justification is required (minimum 10 characters required).",
      msgSuccess:
        "Decision successfully recorded: Application has been {action}.",
      msgFail: "Failed to save decision.",
      // Explicit Aliases
      copyIdTooltip: "Copy Application ID",
      appNoPrefix: "Application No:",
      copiedSuccess: "✓ Copied",
      slaOverdue: "SLA Overdue ({days} days)",
      applicationDate: "Application Date",
      registeredApplicant: "Registered Applicant",
      relationPrefix: "S/o, W/o",
      locationFormat: "{village}, Tehsil {tehsil}, District {district}",
      aadhaarLabel: "Aadhaar",
      waitingPeriod: "Waiting Period",
      ageEligible: "✓ Age Eligible",
      ageIneligible: "✕ Underage",
      yearsAge: "{age} years",
      incomeEligible: "✓ Within Income Limit",
      incomeIneligible: "✕ Above Income Ceiling",
      bankVerified: "✓ Bank Account Verified",
      bankNameMismatch: "Bank Name Mismatch",
      documentsAttached: "{count}/6 Documents Attached",
      personalDossierTitle: "Personal & Eligibility Dossier",
      personalDossierSub: "Haryana Old Age Pension Eligibility Rules 1991",
      applicantFullName: "Applicant's Full Name",
      fatherHusbandName: "Father / Husband's Name",
      dobAndAge: "Date of Birth & Age",
      ineligibleAgeBadge: "Ineligible (<60 yrs)",
      eligibleAgeBadge: "Eligible (60+ yrs)",
      ageRuleNoteFail: "Rule: Applicant must have attained at least 60 years of age",
      ageRuleNotePass: "Statutory minimum age requirement of 60 years is satisfied",
      annualIncome: "Verified Annual Income",
      incomeAboveLimitBadge: "Above Ceiling",
      incomeWithinLimitBadge: "Within Ceiling",
      incomeRuleNoteFail: "Rule: Total annual income must not exceed ₹2,00,000",
      incomeRuleNotePass: "Within statutory ceiling of ₹2,00,000",
      village: "Residence (Village)",
      tehsilAndDistrict: "Tehsil & District",
      aadhaarNo: "Aadhaar Number (Masked)",
      submittedOn: "Application Submission Date",
      bankVerificationTitle: "Bank Account & Financial Verification",
      bankVerificationSub: "Account verification for Direct Benefit Transfer (DBT)",
      bankMatchMismatchTitle: "Name Mismatch Detected on Bank Passbook",
      bankMatchSuccessTitle: "Account Holder Name Matches Applicant Record",
      applicantNameLabel: "Applicant Name",
      bankPassbookNameLabel: "Bank Passbook",
      bankAccountHolder: "Bank Account Holder Name",
      bankAccountMasked: "Account Number (Masked)",
      bankIfsc: "Bank IFSC Code",
      dbtEligibility: "DBT Transfer Eligibility",
      dbtVerificationPending: "Verification Required",
      dbtActiveValid: "Active & Validated",
      docPortfolioTitle: "Mandatory Document Portfolio",
      docPortfolioSub: "6 proofs required under Haryana Social Welfare statutory norms",
      docCountTag: "{count} / 6 Available",
      docMissingSub: "Document is not attached",
      docExpiredSub: "Document validity period has expired",
      docValidSub: "Verified and valid attachment",
      aiCopilotTitle: "AI Review Copilot",
      enginePrefix: "Engine",
      ruleEngineName: "Local Rule Engine",
      aiFallbackBanner: "AI service is unavailable, so the local rule-based analysis is shown.",
      aiAnalyzing: "Analyzing…",
      aiReanalyze: "Re-analyze",
      aiSuggestedAction: "AI Recommended Action",
      applyAiRecommendation: "Apply AI Recommendation",
      decisionApproveFull: "Approve Pension (APPROVE)",
      decisionRejectFull: "Reject Application (REJECT)",
      decisionReturnFull: "Return for Correction (RETURN)",
      discrepanciesTitle: "Identified Inconsistencies ({count})",
      decisionStationTitle: "Officer Decision Station",
      decisionStationSub: "Record statutory decision and mandatory officer justification",
      actionApprove: "Approve",
      actionApproveSub: "स्वीकृत करें",
      actionReject: "Reject",
      actionRejectSub: "अस्वीकृत करें",
      actionReturn: "Return for Correction",
      actionReturnSub: "सुधार हेतु लौटाएँ",
      presetReasonsLabel: "Quick Presets:",
      overrideWarningTitle: "Decision Overrides AI Recommendation (Override Alert)",
      overrideWarningDesc1: "You are selecting an action contrary to the AI recommendation",
      overrideWarningDesc2: ". This override will be flagged in the audit trail. Please record specific factual reasons below.",
      reasonInputLabel: "Statutory & Factual Justification",
      btnFillAiSuggestion: "Fill AI Suggestion",
      minCharsRequired: "Minimum 10 characters required.",
      charCounter: "{count} characters (minimum 10)",
      submittingDecision: "Recording decision…",
      btnSubmitFinalDecision: "Save Final Decision",
      auditTrailTitle: "Immutable Digital Audit Trail",
      auditTrailSub: "Permanent timestamped log of all officer actions",
      auditEntriesCount: "{count} entries",
      emptyAuditText: "No prior actions recorded for this application. Your decision will create the first audit record.",
      auditOverriddenBadge: "Decision Overrode AI Suggestion",
      confirmModalTitle: "Are you sure you want to record this decision?",
      confirmModalSub: "This decision will be permanently saved to the database and audit trail.",
      confirmModalApplicant: "Applicant",
      confirmModalDecision: "Selected Decision",
      confirmModalReason: "Recorded Reason",
      confirmModalCancel: "Cancel",
      confirmModalConfirm: "Yes, Confirm Decision",
      errorAlreadyDecided: "A decision has already been recorded for this application. Duplicate decisions cannot be submitted.",
      errorSelectDecisionFirst: "Please select a decision (Approve / Reject / Return for Correction) first.",
      errorReasonMinChars: "A factual justification is required (at least 10 characters).",
      saveDecisionFailed: "Failed to save decision.",
      successDecisionSaved: "Decision successfully recorded: Application has been {action}.",
    },
    intake: {
      navLabel: "New Application",
      pageBadge: "Application Intake",
      pageTitle: "Register a New Old Age Pension Application",
      pageSub: "Fill in the applicant’s details. Once registered, the application joins the review queue and rule-based + AI analysis runs automatically.",
      sectionApplicant: "Applicant Details",
      sectionBank: "Identity & Bank Details",
      sectionDocs: "Attached Documents",
      sectionPriority: "Priority",
      applicantName: "Applicant Name",
      fatherHusbandName: "Father / Husband Name",
      dob: "Date of Birth",
      village: "Village / Ward",
      tehsil: "Tehsil",
      district: "District",
      annualIncome: "Annual Household Income (₹)",
      aadhaarLast4: "Aadhaar — Last 4 Digits",
      bankAccountHolder: "Account Holder Name",
      bankIFSC: "IFSC Code",
      bankAccountLast4: "Account Number — Last 4 Digits",
      privacyNote: "For privacy, only the last 4 digits are stored.",
      docsSelectAll: "Select all",
      docsClear: "Clear",
      priorityNormal: "Normal",
      priorityHigh: "High Priority",
      flagNote: "Reason for High Priority",
      flagNotePlaceholder: "e.g. CM Window grievance, serious illness, senior citizen living alone",
      previewTitle: "Eligibility Preview",
      previewSub: "Instant check against statutory rules",
      previewAge: "Age",
      previewIncome: "Income",
      previewDocs: "Documents",
      previewPending: "Awaiting input",
      previewLikelyApprove: "All statutory criteria met — appears eligible for approval",
      previewLikelyReject: "Statutory criteria not met — likely rejection",
      previewLikelyReturn: "Documents incomplete — likely to be returned",
      previewDisclaimer: "This is only a preview. The final decision rests with the reviewing officer.",
      submitBtn: "Register Application",
      submitting: "Registering...",
      cancelBtn: "Cancel",
      errorFixFields: "Please fix the highlighted fields.",
      errorText: "At least 2 characters required.",
      errorDob: "Enter a valid past date of birth.",
      errorDigits4: "Enter exactly 4 digits.",
      errorIFSC: "Enter a valid IFSC (e.g. SBIN0001234).",
      errorIncome: "Enter a valid income amount.",
      errorFlagNote: "A reason (at least 5 characters) is required for high priority.",
    },
    reports: {
      navLabel: "Reports",
      pageBadge: "Accountability & Transparency",
      pageTitle: "Decision Reports & AI Accountability",
      pageSub: "All figures are computed directly from the immutable audit trail. AI only suggests — the officer makes the final decision.",
      exportCsv: "Download CSV",
      kpiDecisions: "Decisions Recorded",
      kpiDecisionsSub: "{pending} applications still pending",
      kpiAgreement: "Agreement with AI",
      kpiAgreementSub: "{count} decisions overrode the AI",
      kpiAvgDays: "Avg. Time to Decision",
      kpiAvgDaysSub: "From submission to decision",
      kpiSla: "SLA Compliance",
      kpiSlaSub: "Decided within {days} days",
      kpiNoData: "No decisions yet",
      outcomesTitle: "Decision Outcomes",
      outcomesSub: "Distribution of final decisions recorded by officers",
      matrixTitle: "AI Suggestion vs Officer Decision",
      matrixSub: "Diagonal = agreement. Other cells = officer overrode the AI.",
      matrixRowHeader: "AI suggested ↓ / Officer decided →",
      matrixCellTitle: "AI: {ai} → Officer: {officer} — {count} decisions",
      activityTitle: "Recent Activity",
      activitySub: "Latest entries from the audit trail",
      thTime: "Time",
      thApplicant: "Applicant",
      thOfficer: "Officer",
      thAction: "Action",
      thAi: "AI Suggested",
      overriddenTag: "Overrode AI",
      emptyActivity: "No activity recorded yet.",
      decisionApprove: "Approved",
      decisionReject: "Rejected",
      decisionReturn: "Returned",
      daysUnit: "days",
    },
    docs: {
      "आयु प्रमाण पत्र": "Age Certificate / Birth Proof",
      "आय प्रमाण पत्र": "Income Certificate",
      "आधार कार्ड": "Aadhaar Card",
      "बैंक पासबुक": "Bank Passbook",
      "निवास प्रमाण पत्र": "Residence Certificate",
      "पासपोर्ट साइज फोटो": "Passport Size Photo",
    },
    presets: {
      APPROVE: [
        "All 6 mandatory documents attached. Age (60+ yrs) and annual income verified in compliance with statutory rules.",
        "Bank account verified in applicant's name. Pension sanction granted for DBT transfer.",
      ],
      REJECT: [
        "Applicant is under 60 years of age, ineligible under Haryana Old Age Samman Allowance Rules 1991.",
        "Annual household income exceeds the statutory ceiling of ₹2,00,000. Application is rejected.",
      ],
      RETURN: [
        "Application returned for submission of mandatory document(s) (Income Certificate / Bank Passbook).",
        "Bank account holder name differs from applicant. Returned to furnish matching bank account details.",
      ],
    },
  },
};
