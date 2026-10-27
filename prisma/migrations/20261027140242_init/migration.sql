-- CreateEnum
CREATE TYPE "ApplicationStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED', 'RETURNED');

-- CreateEnum
CREATE TYPE "Priority" AS ENUM ('HIGH', 'NORMAL');

-- CreateTable
CREATE TABLE "Officer" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "designation" TEXT NOT NULL DEFAULT 'तहसीलदार',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Officer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Application" (
    "id" TEXT NOT NULL,
    "applicantName" TEXT NOT NULL,
    "fatherHusbandName" TEXT NOT NULL,
    "dob" TIMESTAMP(3) NOT NULL,
    "village" TEXT NOT NULL,
    "tehsil" TEXT NOT NULL DEFAULT 'अंबाला',
    "district" TEXT NOT NULL DEFAULT 'अंबाला',
    "aadhaarMasked" TEXT NOT NULL,
    "bankAccountHolder" TEXT NOT NULL,
    "bankIFSC" TEXT NOT NULL,
    "bankAccountMasked" TEXT NOT NULL,
    "annualIncome" INTEGER NOT NULL,
    "documentsSubmitted" TEXT[],
    "submittedAt" TIMESTAMP(3) NOT NULL,
    "status" "ApplicationStatus" NOT NULL DEFAULT 'PENDING',
    "priority" "Priority" NOT NULL DEFAULT 'NORMAL',
    "flagNote" TEXT,
    "aiAnalysis" JSONB,
    "analyzedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Application_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuditLog" (
    "id" TEXT NOT NULL,
    "applicationId" TEXT NOT NULL,
    "officerId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "aiSuggested" TEXT,
    "finalDecision" TEXT,
    "overridden" BOOLEAN NOT NULL DEFAULT false,
    "reason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Officer_email_key" ON "Officer"("email");

-- CreateIndex
CREATE INDEX "AuditLog_applicationId_idx" ON "AuditLog"("applicationId");

-- CreateIndex
CREATE INDEX "AuditLog_officerId_idx" ON "AuditLog"("officerId");

-- AddForeignKey
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_applicationId_fkey" FOREIGN KEY ("applicationId") REFERENCES "Application"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_officerId_fkey" FOREIGN KEY ("officerId") REFERENCES "Officer"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
