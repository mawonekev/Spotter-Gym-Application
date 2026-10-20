-- Authentication security hardening
-- Adds durable password-reset fields plus compliance/audit tables.

ALTER TABLE "Member" ADD COLUMN "resetPasswordToken" TEXT;
ALTER TABLE "Member" ADD COLUMN "resetPasswordExpiresAt" TIMESTAMP(3);

CREATE TABLE "user_sessions" (
    "id" TEXT NOT NULL,
    "memberId" TEXT NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "deviceId" TEXT NOT NULL,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastSeenAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "revokedAt" TIMESTAMP(3),
    CONSTRAINT "user_sessions_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "verification_statuses" (
    "id" TEXT NOT NULL,
    "memberId" TEXT,
    "email" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "codeHash" TEXT,
    "expiresAt" TIMESTAMP(3),
    "verifiedAt" TIMESTAMP(3),
    "ip" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "verification_statuses_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "auth_audit_logs" (
    "id" TEXT NOT NULL,
    "eventType" TEXT NOT NULL,
    "ip" TEXT NOT NULL,
    "identifier" TEXT,
    "details" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "auth_audit_logs_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "payment_logs" (
    "id" TEXT NOT NULL,
    "paymentId" TEXT,
    "reference" TEXT,
    "event" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "amountKobo" INTEGER,
    "message" TEXT,
    "rawPayload" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "payment_logs_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "user_sessions_tokenHash_key" ON "user_sessions"("tokenHash");
CREATE INDEX "user_sessions_memberId_revokedAt_idx" ON "user_sessions"("memberId", "revokedAt");
CREATE INDEX "user_sessions_expiresAt_idx" ON "user_sessions"("expiresAt");

CREATE INDEX "verification_statuses_email_createdAt_idx" ON "verification_statuses"("email", "createdAt");
CREATE INDEX "verification_statuses_status_createdAt_idx" ON "verification_statuses"("status", "createdAt");

CREATE INDEX "auth_audit_logs_eventType_createdAt_idx" ON "auth_audit_logs"("eventType", "createdAt");
CREATE INDEX "auth_audit_logs_identifier_createdAt_idx" ON "auth_audit_logs"("identifier", "createdAt");

CREATE INDEX "payment_logs_reference_createdAt_idx" ON "payment_logs"("reference", "createdAt");
CREATE INDEX "payment_logs_event_createdAt_idx" ON "payment_logs"("event", "createdAt");

ALTER TABLE "user_sessions"
    ADD CONSTRAINT "user_sessions_memberId_fkey"
    FOREIGN KEY ("memberId") REFERENCES "Member"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "verification_statuses"
    ADD CONSTRAINT "verification_statuses_memberId_fkey"
    FOREIGN KEY ("memberId") REFERENCES "Member"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "payment_logs"
    ADD CONSTRAINT "payment_logs_paymentId_fkey"
    FOREIGN KEY ("paymentId") REFERENCES "Payment"("id") ON DELETE SET NULL ON UPDATE CASCADE;
