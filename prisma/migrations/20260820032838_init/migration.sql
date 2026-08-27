-- CreateEnum
CREATE TYPE "Environment" AS ENUM ('demo', 'production');

-- CreateEnum
CREATE TYPE "PlanCode" AS ENUM ('monthly', 'quarterly', 'semester', 'annual');

-- CreateEnum
CREATE TYPE "MembershipStatus" AS ENUM ('ACTIVE', 'EXPIRING', 'EXPIRED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "PaymentStatus" AS ENUM ('PENDING', 'APPROVED', 'DECLINED', 'VOIDED', 'ERROR');

-- CreateEnum
CREATE TYPE "NotificationType" AS ENUM ('PAYMENT_CONFIRMATION', 'REMINDER');

-- CreateEnum
CREATE TYPE "NotificationStatus" AS ENUM ('PENDING', 'SENT', 'FAILED', 'SKIPPED');

-- CreateTable
CREATE TABLE "businesses" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "timezone" TEXT NOT NULL,
    "currency" TEXT NOT NULL,
    "environment" "Environment" NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "businesses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "plans" (
    "id" TEXT NOT NULL,
    "business_id" TEXT NOT NULL,
    "code" "PlanCode" NOT NULL,
    "name" TEXT NOT NULL,
    "duration_days" INTEGER NOT NULL,
    "price_cents" INTEGER NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "plans_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "customers" (
    "id" TEXT NOT NULL,
    "business_id" TEXT NOT NULL,
    "external_id" TEXT,
    "full_name" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "email" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "demo_record" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "customers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "memberships" (
    "id" TEXT NOT NULL,
    "business_id" TEXT NOT NULL,
    "customer_id" TEXT NOT NULL,
    "plan_id" TEXT NOT NULL,
    "start_date" DATE NOT NULL,
    "expiration_date" DATE NOT NULL,
    "status" "MembershipStatus" NOT NULL DEFAULT 'ACTIVE',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "memberships_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "payments" (
    "id" TEXT NOT NULL,
    "business_id" TEXT NOT NULL,
    "customer_id" TEXT NOT NULL,
    "membership_id" TEXT,
    "plan_id" TEXT,
    "provider" TEXT NOT NULL,
    "provider_transaction_id" TEXT,
    "reference" TEXT NOT NULL,
    "amount_cents" INTEGER NOT NULL,
    "currency" TEXT NOT NULL,
    "payment_method" TEXT,
    "status" "PaymentStatus" NOT NULL DEFAULT 'PENDING',
    "provider_payload" JSONB,
    "approved_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "payments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notifications" (
    "id" TEXT NOT NULL,
    "business_id" TEXT NOT NULL,
    "customer_id" TEXT NOT NULL,
    "membership_id" TEXT,
    "payment_id" TEXT,
    "type" "NotificationType" NOT NULL,
    "offset_days" INTEGER,
    "scheduled_for" DATE NOT NULL,
    "sent_at" TIMESTAMP(3),
    "status" "NotificationStatus" NOT NULL DEFAULT 'PENDING',
    "provider_message_id" TEXT,
    "error_message" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "notifications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "scheduler_runs" (
    "id" TEXT NOT NULL,
    "ran_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "candidates_evaluated" INTEGER NOT NULL,
    "reminders_sent" INTEGER NOT NULL,
    "reminders_failed" INTEGER NOT NULL,
    "error_message" TEXT,

    CONSTRAINT "scheduler_runs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "webhook_events" (
    "id" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "event_type" TEXT NOT NULL,
    "provider_event_id" TEXT NOT NULL,
    "payload" JSONB NOT NULL,
    "signature_valid" BOOLEAN NOT NULL,
    "processed" BOOLEAN NOT NULL DEFAULT false,
    "processed_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "webhook_events_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "plans_business_id_code_key" ON "plans"("business_id", "code");

-- CreateIndex
CREATE INDEX "customers_business_id_phone_idx" ON "customers"("business_id", "phone");

-- CreateIndex
CREATE UNIQUE INDEX "customers_business_id_external_id_key" ON "customers"("business_id", "external_id");

-- CreateIndex
CREATE INDEX "memberships_business_id_expiration_date_idx" ON "memberships"("business_id", "expiration_date");

-- CreateIndex
CREATE INDEX "memberships_customer_id_idx" ON "memberships"("customer_id");

-- CreateIndex
CREATE INDEX "payments_business_id_status_idx" ON "payments"("business_id", "status");

-- CreateIndex
CREATE UNIQUE INDEX "payments_reference_key" ON "payments"("reference");

-- CreateIndex
CREATE UNIQUE INDEX "payments_provider_provider_transaction_id_key" ON "payments"("provider", "provider_transaction_id");

-- CreateIndex
CREATE INDEX "notifications_business_id_status_idx" ON "notifications"("business_id", "status");

-- CreateIndex
CREATE UNIQUE INDEX "notifications_membership_id_type_offset_days_scheduled_for_key" ON "notifications"("membership_id", "type", "offset_days", "scheduled_for");

-- CreateIndex
CREATE UNIQUE INDEX "notifications_payment_id_type_key" ON "notifications"("payment_id", "type");

-- CreateIndex
CREATE UNIQUE INDEX "webhook_events_provider_provider_event_id_key" ON "webhook_events"("provider", "provider_event_id");

-- AddForeignKey
ALTER TABLE "plans" ADD CONSTRAINT "plans_business_id_fkey" FOREIGN KEY ("business_id") REFERENCES "businesses"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "customers" ADD CONSTRAINT "customers_business_id_fkey" FOREIGN KEY ("business_id") REFERENCES "businesses"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "memberships" ADD CONSTRAINT "memberships_business_id_fkey" FOREIGN KEY ("business_id") REFERENCES "businesses"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "memberships" ADD CONSTRAINT "memberships_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "customers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "memberships" ADD CONSTRAINT "memberships_plan_id_fkey" FOREIGN KEY ("plan_id") REFERENCES "plans"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payments" ADD CONSTRAINT "payments_business_id_fkey" FOREIGN KEY ("business_id") REFERENCES "businesses"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payments" ADD CONSTRAINT "payments_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "customers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payments" ADD CONSTRAINT "payments_membership_id_fkey" FOREIGN KEY ("membership_id") REFERENCES "memberships"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payments" ADD CONSTRAINT "payments_plan_id_fkey" FOREIGN KEY ("plan_id") REFERENCES "plans"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_business_id_fkey" FOREIGN KEY ("business_id") REFERENCES "businesses"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "customers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_membership_id_fkey" FOREIGN KEY ("membership_id") REFERENCES "memberships"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_payment_id_fkey" FOREIGN KEY ("payment_id") REFERENCES "payments"("id") ON DELETE SET NULL ON UPDATE CASCADE;
