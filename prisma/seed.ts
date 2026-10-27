/**
 * prisma/seed.ts
 * Seeds 20 fully made-up Old-Age Pension applications and one demo officer.
 * NO real citizen data. Aadhaar numbers are obviously fake and masked.
 * Every DOB and submittedAt is calculated RELATIVE to today's date so data never goes stale.
 *
 * Run:  npx prisma db seed
 */

import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  // ── Demo officer ────────────────────────────────────────────────────────────
  const passwordHash = await bcrypt.hash("demo1234", 12);
  await prisma.officer.upsert({
    where: { email: "officer@demo.gov.in" },
    update: {},
    create: {
      name: "राम कुमार शर्मा",
      email: "officer@demo.gov.in",
      passwordHash,
      designation: "तहसीलदार, अंबाला",
    },
  });

  console.log("✅ Demo officer upserted: officer@demo.gov.in / demo1234");

  // ── Relative Date Helpers ───────────────────────────────────────────────────
  // daysAgo: calculates a Date N days before today
  const daysAgo = (n: number) => {
    const d = new Date();
    d.setDate(d.getDate() - n);
    return d;
  };

  // yearsAgo: calculates a Date N years before today (plus optional extra days offset)
  // Ensures ages remain exact regardless of what year the app is run
  const yearsAgo = (years: number, extraDays = 15) => {
    const d = new Date();
    d.setFullYear(d.getFullYear() - years);
    d.setDate(d.getDate() - extraDays);
    return d;
  };

  // Shared exact Date instance for duplicate applicant pair (Case #1 and Case #10)
  const duplicateSharedDob = yearsAgo(68);

  // ── Applications ────────────────────────────────────────────────────────────
  // 20 cases: clean cases + deliberate flaws (under-age, over-income, missing docs,
  // name mismatch, expired doc, SLA breach, duplicate applicant).
  const apps: Parameters<typeof prisma.application.create>[0]["data"][] = [
    // ── 1. CLEAN CASE (Eligible: Age 68, Income ₹48k, all docs) ──────────────
    {
      applicantName: "सुरेश लाल",
      fatherHusbandName: "राम लाल (पिता)",
      dob: duplicateSharedDob,
      village: "बाबेल",
      annualIncome: 48_000,
      aadhaarMasked: "XXXX-XXXX-XXXX-1001",
      bankAccountHolder: "सुरेश लाल",
      bankIFSC: "PUNB0001200",
      bankAccountMasked: "XXXX1001",
      documentsSubmitted: [
        "आयु प्रमाण पत्र",
        "आय प्रमाण पत्र",
        "आधार कार्ड",
        "बैंक पासबुक",
        "निवास प्रमाण पत्र",
        "पासपोर्ट साइज फोटो",
      ],
      submittedAt: daysAgo(5),
      status: "PENDING",
      priority: "NORMAL",
    },

    // ── 2. CLEAN CASE (Eligible: Age 72, Income ₹36k, all docs) ──────────────
    {
      applicantName: "कमला देवी",
      fatherHusbandName: "मोहन लाल (पति)",
      dob: yearsAgo(72),
      village: "नारायणगढ़",
      annualIncome: 36_000,
      aadhaarMasked: "XXXX-XXXX-XXXX-1002",
      bankAccountHolder: "कमला देवी",
      bankIFSC: "SBIN0003456",
      bankAccountMasked: "XXXX1002",
      documentsSubmitted: [
        "आयु प्रमाण पत्र",
        "आय प्रमाण पत्र",
        "आधार कार्ड",
        "बैंक पासबुक",
        "निवास प्रमाण पत्र",
        "पासपोर्ट साइज फोटो",
      ],
      submittedAt: daysAgo(10),
      status: "PENDING",
      priority: "NORMAL",
    },

    // ── 3. CLEAN CASE (Eligible: Age 75, Income ₹60k, all docs) ──────────────
    {
      applicantName: "हरि सिंह",
      fatherHusbandName: "जग्गा सिंह (पिता)",
      dob: yearsAgo(75),
      village: "मुलाना",
      annualIncome: 60_000,
      aadhaarMasked: "XXXX-XXXX-XXXX-1003",
      bankAccountHolder: "हरि सिंह",
      bankIFSC: "HDFC0002100",
      bankAccountMasked: "XXXX1003",
      documentsSubmitted: [
        "आयु प्रमाण पत्र",
        "आय प्रमाण पत्र",
        "आधार कार्ड",
        "बैंक पासबुक",
        "निवास प्रमाण पत्र",
        "पासपोर्ट साइज फोटो",
      ],
      submittedAt: daysAgo(3),
      status: "PENDING",
      priority: "NORMAL",
    },

    // ── 4. FLAW: UNDER-AGE (52 years old < 60) ───────────────────────────────
    {
      applicantName: "रमेश कुमार",
      fatherHusbandName: "सीता राम (पिता)",
      dob: yearsAgo(52), // Strictly 52 years old
      village: "शाहबाद",
      annualIncome: 55_000,
      aadhaarMasked: "XXXX-XXXX-XXXX-2001",
      bankAccountHolder: "रमेश कुमार",
      bankIFSC: "AXIS0001100",
      bankAccountMasked: "XXXX2001",
      documentsSubmitted: [
        "आयु प्रमाण पत्र",
        "आय प्रमाण पत्र",
        "आधार कार्ड",
        "बैंक पासबुक",
        "निवास प्रमाण पत्र",
        "पासपोर्ट साइज फोटो",
      ],
      submittedAt: daysAgo(7),
      status: "PENDING",
      priority: "HIGH",
      flagNote: "आयु न्यूनतम पात्रता सीमा से कम",
    },

    // ── 5. FLAW: INCOME ABOVE LIMIT (₹3,80,000 > ₹2,00,000) ──────────────────
    {
      applicantName: "प्रताप सिंह",
      fatherHusbandName: "गुरदीप सिंह (पिता)",
      dob: yearsAgo(74),
      village: "बरारा",
      annualIncome: 3_80_000, // Above ₹2,00,000 limit
      aadhaarMasked: "XXXX-XXXX-XXXX-2002",
      bankAccountHolder: "प्रताप सिंह",
      bankIFSC: "ICIC0001200",
      bankAccountMasked: "XXXX2002",
      documentsSubmitted: [
        "आयु प्रमाण पत्र",
        "आय प्रमाण पत्र",
        "आधार कार्ड",
        "बैंक पासबुक",
        "निवास प्रमाण पत्र",
        "पासपोर्ट साइज फोटो",
      ],
      submittedAt: daysAgo(12),
      status: "PENDING",
      priority: "HIGH",
      flagNote: "वार्षिक आय अनुमेय सीमा से अधिक",
    },

    // ── 6. FLAW: MISSING INCOME CERTIFICATE ───────────────────────────────────
    {
      applicantName: "शांति देवी",
      fatherHusbandName: "रतन लाल (पति)",
      dob: yearsAgo(79),
      village: "सढौरा",
      annualIncome: 72_000,
      aadhaarMasked: "XXXX-XXXX-XXXX-2003",
      bankAccountHolder: "शांति देवी",
      bankIFSC: "PUNB0008800",
      bankAccountMasked: "XXXX2003",
      documentsSubmitted: [
        "आयु प्रमाण पत्र",
        // "आय प्रमाण पत्र" is deliberately MISSING
        "आधार कार्ड",
        "बैंक पासबुक",
        "निवास प्रमाण पत्र",
        "पासपोर्ट साइज फोटो",
      ],
      submittedAt: daysAgo(20),
      status: "PENDING",
      priority: "HIGH",
      flagNote: "आय प्रमाण पत्र संलग्न नहीं",
    },

    // ── 7. FLAW: NAME MISMATCH (Applicant vs Bank Account) ───────────────────
    {
      applicantName: "गीता बाई",
      fatherHusbandName: "भगत राम (पति)",
      dob: yearsAgo(71),
      village: "टोपरा",
      annualIncome: 45_000,
      aadhaarMasked: "XXXX-XXXX-XXXX-2004",
      bankAccountHolder: "सुमित्रा देवी", // Different name from applicant
      bankIFSC: "SBIN0007700",
      bankAccountMasked: "XXXX2004",
      documentsSubmitted: [
        "आयु प्रमाण पत्र",
        "आय प्रमाण पत्र",
        "आधार कार्ड",
        "बैंक पासबुक",
        "निवास प्रमाण पत्र",
        "पासपोर्ट साइज फोटो",
      ],
      submittedAt: daysAgo(8),
      status: "PENDING",
      priority: "HIGH",
      flagNote: "आवेदक नाम और बैंक खातेदार नाम में अंतर",
    },

    // ── 8. FLAW: EXPIRED DOCUMENT (Age Certificate expired) ─────────────────
    {
      applicantName: "जमुना प्रसाद",
      fatherHusbandName: "नेक राम (पिता)",
      dob: yearsAgo(76),
      village: "रादौर",
      annualIncome: 30_000,
      aadhaarMasked: "XXXX-XXXX-XXXX-2005",
      bankAccountHolder: "जमुना प्रसाद",
      bankIFSC: "HDFC0004400",
      bankAccountMasked: "XXXX2005",
      documentsSubmitted: [
        "आयु प्रमाण पत्र (समाप्त – 2019)", // Expired cert
        "आय प्रमाण पत्र",
        "आधार कार्ड",
        "बैंक पासबुक",
        "निवास प्रमाण पत्र",
        "पासपोर्ट साइज फोटो",
      ],
      submittedAt: daysAgo(15),
      status: "PENDING",
      priority: "HIGH",
      flagNote: "आयु प्रमाण पत्र वैधता समाप्त",
    },

    // ── 9. FLAW: SLA BREACH (> 30 days pending) ──────────────────────────────
    {
      applicantName: "बलवान सिंह",
      fatherHusbandName: "हुकम सिंह (पिता)",
      dob: yearsAgo(80),
      village: "लाडवा",
      annualIncome: 24_000,
      aadhaarMasked: "XXXX-XXXX-XXXX-2006",
      bankAccountHolder: "बलवान सिंह",
      bankIFSC: "AXIS0005500",
      bankAccountMasked: "XXXX2006",
      documentsSubmitted: [
        "आयु प्रमाण पत्र",
        "आय प्रमाण पत्र",
        "आधार कार्ड",
        "बैंक पासबुक",
        "निवास प्रमाण पत्र",
        "पासपोर्ट साइज फोटो",
      ],
      submittedAt: daysAgo(45), // 45 days ago — SLA Breach
      status: "PENDING",
      priority: "HIGH",
      flagNote: "SLA समय-सीमा उल्लंघन (त्वरित समीक्षा अपेक्षित)",
    },

    // ── 10. FLAW: DUPLICATE APPLICANT (Same name, village, and DOB as #1 Suresh Lal) ──
    {
      applicantName: "सुरेश लाल",
      fatherHusbandName: "राम लाल (पिता)",
      dob: duplicateSharedDob, // Shared exact Date instance with Case #1
      village: "बाबेल",
      annualIncome: 48_000,
      aadhaarMasked: "XXXX-XXXX-XXXX-2007",
      bankAccountHolder: "सुरेश लाल",
      bankIFSC: "PUNB0006600",
      bankAccountMasked: "XXXX2007",
      documentsSubmitted: [
        "आयु प्रमाण पत्र",
        "आय प्रमाण पत्र",
        "आधार कार्ड",
        "बैंक पासबुक",
        "निवास प्रमाण पत्र",
        "पासपोर्ट साइज फोटो",
      ],
      submittedAt: daysAgo(2),
      status: "PENDING",
      priority: "HIGH",
      flagNote: "संभावित डुप्लीकेट: समान नाम, गाँव व जन्म तिथि पर अन्य आवेदन पहले से दर्ज",
    },

    // ── 11. CLEAN CASE (Eligible: Age 66, Income ₹90k) ──────────────────────
    {
      applicantName: "पारो देवी",
      fatherHusbandName: "जगत राम (पति)",
      dob: yearsAgo(66),
      village: "थानेसर",
      annualIncome: 90_000,
      aadhaarMasked: "XXXX-XXXX-XXXX-1004",
      bankAccountHolder: "पारो देवी",
      bankIFSC: "PUNB0009900",
      bankAccountMasked: "XXXX1004",
      documentsSubmitted: [
        "आयु प्रमाण पत्र",
        "आय प्रमाण पत्र",
        "आधार कार्ड",
        "बैंक पासबुक",
        "निवास प्रमाण पत्र",
        "पासपोर्ट साइज फोटो",
      ],
      submittedAt: daysAgo(2),
      status: "PENDING",
      priority: "NORMAL",
    },

    // ── 12. CLEAN CASE (Eligible: Age 73, Income ₹55k) ──────────────────────
    {
      applicantName: "दुर्गा प्रसाद",
      fatherHusbandName: "शिव दयाल (पिता)",
      dob: yearsAgo(73),
      village: "नीलोखेड़ी",
      annualIncome: 55_000,
      aadhaarMasked: "XXXX-XXXX-XXXX-1005",
      bankAccountHolder: "दुर्गा प्रसाद",
      bankIFSC: "SBIN0001100",
      bankAccountMasked: "XXXX1005",
      documentsSubmitted: [
        "आयु प्रमाण पत्र",
        "आय प्रमाण पत्र",
        "आधार कार्ड",
        "बैंक पासबुक",
        "निवास प्रमाण पत्र",
        "पासपोर्ट साइज फोटो",
      ],
      submittedAt: daysAgo(18),
      status: "PENDING",
      priority: "NORMAL",
    },

    // ── 13. FLAW: MISSING RESIDENCE CERTIFICATE ──────────────────────────────
    {
      applicantName: "नर्मदा देवी",
      fatherHusbandName: "राधे श्याम (पति)",
      dob: yearsAgo(69),
      village: "असंध",
      annualIncome: 66_000,
      aadhaarMasked: "XXXX-XXXX-XXXX-2008",
      bankAccountHolder: "नर्मदा देवी",
      bankIFSC: "HDFC0007700",
      bankAccountMasked: "XXXX2008",
      documentsSubmitted: [
        "आयु प्रमाण पत्र",
        "आय प्रमाण पत्र",
        "आधार कार्ड",
        "बैंक पासबुक",
        // "निवास प्रमाण पत्र" is deliberately MISSING
        "पासपोर्ट साइज फोटो",
      ],
      submittedAt: daysAgo(9),
      status: "PENDING",
      priority: "HIGH",
      flagNote: "निवास प्रमाण पत्र संलग्न नहीं",
    },

    // ── 14. FLAW: SLA BREACH (33 days pending) ───────────────────────────────
    {
      applicantName: "महेन्द्र पाल",
      fatherHusbandName: "भीम सेन (पिता)",
      dob: yearsAgo(78),
      village: "सफीदों",
      annualIncome: 42_000,
      aadhaarMasked: "XXXX-XXXX-XXXX-1006",
      bankAccountHolder: "महेन्द्र पाल",
      bankIFSC: "AXIS0003300",
      bankAccountMasked: "XXXX1006",
      documentsSubmitted: [
        "आयु प्रमाण पत्र",
        "आय प्रमाण पत्र",
        "आधार कार्ड",
        "बैंक पासबुक",
        "निवास प्रमाण पत्र",
        "पासपोर्ट साइज फोटो",
      ],
      submittedAt: daysAgo(33),
      status: "PENDING",
      priority: "HIGH",
      flagNote: "SLA समय-सीमा उल्लंघन (त्वरित समीक्षा अपेक्षित)",
    },

    // ── 15. CLEAN CASE (Eligible: Age 64, Income ₹80k) ──────────────────────
    {
      applicantName: "सत्यवती",
      fatherHusbandName: "ओम प्रकाश (पति)",
      dob: yearsAgo(64),
      village: "पेहोवा",
      annualIncome: 80_000,
      aadhaarMasked: "XXXX-XXXX-XXXX-1007",
      bankAccountHolder: "सत्यवती",
      bankIFSC: "ICIC0008800",
      bankAccountMasked: "XXXX1007",
      documentsSubmitted: [
        "आयु प्रमाण पत्र",
        "आय प्रमाण पत्र",
        "आधार कार्ड",
        "बैंक पासबुक",
        "निवास प्रमाण पत्र",
        "पासपोर्ट साइज फोटो",
      ],
      submittedAt: daysAgo(4),
      status: "PENDING",
      priority: "NORMAL",
    },

    // ── 16. FLAW: UNDER-AGE (58 years old < 60) ─────────────────────────────
    {
      applicantName: "विमला देवी",
      fatherHusbandName: "करम सिंह (पति)",
      dob: yearsAgo(58),
      village: "गुहला",
      annualIncome: 30_000,
      aadhaarMasked: "XXXX-XXXX-XXXX-2009",
      bankAccountHolder: "विमला देवी",
      bankIFSC: "PUNB0002200",
      bankAccountMasked: "XXXX2009",
      documentsSubmitted: [
        "आयु प्रमाण पत्र",
        "आय प्रमाण पत्र",
        "आधार कार्ड",
        "बैंक पासबुक",
        "निवास प्रमाण पत्र",
        "पासपोर्ट साइज फोटो",
      ],
      submittedAt: daysAgo(11),
      status: "PENDING",
      priority: "HIGH",
      flagNote: "आयु न्यूनतम पात्रता सीमा से कम",
    },

    // ── 17. CLEAN CASE (Eligible: Age 81, Income ₹38k) ──────────────────────
    {
      applicantName: "जगदीश राम",
      fatherHusbandName: "तीर्थ राम (पिता)",
      dob: yearsAgo(81),
      village: "कैथल",
      annualIncome: 38_000,
      aadhaarMasked: "XXXX-XXXX-XXXX-1008",
      bankAccountHolder: "जगदीश राम",
      bankIFSC: "SBIN0006600",
      bankAccountMasked: "XXXX1008",
      documentsSubmitted: [
        "आयु प्रमाण पत्र",
        "आय प्रमाण पत्र",
        "आधार कार्ड",
        "बैंक पासबुक",
        "निवास प्रमाण पत्र",
        "पासपोर्ट साइज फोटो",
      ],
      submittedAt: daysAgo(14),
      status: "PENDING",
      priority: "NORMAL",
    },

    // ── 18. FLAW: INCOME ABOVE LIMIT + MISSING PHOTO ────────────────────────
    {
      applicantName: "रुक्मणी देवी",
      fatherHusbandName: "देव राज (पति)",
      dob: yearsAgo(70),
      village: "नांगल चौधरी",
      annualIncome: 2_10_000, // Above ₹2,00,000 limit
      aadhaarMasked: "XXXX-XXXX-XXXX-2010",
      bankAccountHolder: "रुक्मणी देवी",
      bankIFSC: "HDFC0005500",
      bankAccountMasked: "XXXX2010",
      documentsSubmitted: [
        "आयु प्रमाण पत्र",
        "आय प्रमाण पत्र",
        "आधार कार्ड",
        "बैंक पासबुक",
        "निवास प्रमाण पत्र",
        // "पासपोर्ट साइज फोटो" is deliberately MISSING
      ],
      submittedAt: daysAgo(16),
      status: "PENDING",
      priority: "HIGH",
      flagNote: "आय सीमा से अधिक; फोटो संलग्न नहीं",
    },

    // ── 19. PROCESSED CASE: APPROVED ────────────────────────────────────────
    {
      applicantName: "घनश्याम दास",
      fatherHusbandName: "पन्ना लाल (पिता)",
      dob: yearsAgo(77),
      village: "जींद",
      annualIncome: 44_000,
      aadhaarMasked: "XXXX-XXXX-XXXX-1009",
      bankAccountHolder: "घनश्याम दास",
      bankIFSC: "AXIS0007700",
      bankAccountMasked: "XXXX1009",
      documentsSubmitted: [
        "आयु प्रमाण पत्र",
        "आय प्रमाण पत्र",
        "आधार कार्ड",
        "बैंक पासबुक",
        "निवास प्रमाण पत्र",
        "पासपोर्ट साइज फोटो",
      ],
      submittedAt: daysAgo(25),
      status: "APPROVED",
      priority: "NORMAL",
    },

    // ── 20. PROCESSED CASE: REJECTED (Age 51) ───────────────────────────────
    {
      applicantName: "मीना कुमारी",
      fatherHusbandName: "सुभाष चंद (पति)",
      dob: yearsAgo(51),
      village: "हिसार",
      annualIncome: 95_000,
      aadhaarMasked: "XXXX-XXXX-XXXX-1010",
      bankAccountHolder: "मीना कुमारी",
      bankIFSC: "ICIC0009900",
      bankAccountMasked: "XXXX1010",
      documentsSubmitted: [
        "आयु प्रमाण पत्र",
        "आय प्रमाण पत्र",
        "आधार कार्ड",
        "बैंक पासबुक",
        "निवास प्रमाण पत्र",
        "पासपोर्ट साइज फोटो",
      ],
      submittedAt: daysAgo(30),
      status: "REJECTED",
      priority: "HIGH",
      flagNote: "आयु न्यूनतम पात्रता सीमा से कम",
    },
  ];

  // Clear existing records to ensure idempotent, duplicate-safe re-runs
  await prisma.auditLog.deleteMany();
  await prisma.application.deleteMany();

  for (const data of apps) {
    await prisma.application.create({ data: data as never });
  }

  console.log(`✅ Seeded ${apps.length} applications with dynamic relative dates`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
