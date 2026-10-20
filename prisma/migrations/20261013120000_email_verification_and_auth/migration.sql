-- AlterTable: Add email and email verification fields to Member
ALTER TABLE "Member" ADD COLUMN "email" TEXT;
ALTER TABLE "Member" ADD COLUMN "passwordHash" TEXT;
ALTER TABLE "Member" ADD COLUMN "emailVerifiedAt" TIMESTAMP(3);
ALTER TABLE "Member" ADD COLUMN "emailVerificationCode" TEXT;
ALTER TABLE "Member" ADD COLUMN "emailVerificationExpiresAt" TIMESTAMP(3);

-- CreateIndex
CREATE INDEX "Member_email_idx" ON "Member"("email");
