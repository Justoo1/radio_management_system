-- CreateEnum
CREATE TYPE "MetricType" AS ENUM ('CLIENTS_TOTAL', 'CLIENTS_ACTIVE', 'PROGRAMS_TOTAL', 'PROGRAMS_ACTIVE', 'SMS_CAMPAIGNS_SENT', 'SMS_CAMPAIGNS_TOTAL', 'GROWTH_RATE');

-- CreateTable
CREATE TABLE "metrics" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "metricType" "MetricType" NOT NULL,
    "metricName" TEXT NOT NULL,
    "value" DECIMAL(10,2) NOT NULL,
    "recordedDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "metadata" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "metrics_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "metrics_organizationId_idx" ON "metrics"("organizationId");

-- CreateIndex
CREATE INDEX "metrics_metricType_idx" ON "metrics"("metricType");

-- CreateIndex
CREATE INDEX "metrics_recordedDate_idx" ON "metrics"("recordedDate");

-- AddForeignKey
ALTER TABLE "metrics" ADD CONSTRAINT "metrics_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
