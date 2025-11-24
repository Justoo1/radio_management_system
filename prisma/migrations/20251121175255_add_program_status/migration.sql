-- CreateEnum
CREATE TYPE "ProgramStatus" AS ENUM ('DRAFT', 'SCHEDULED', 'LIVE', 'ARCHIVED', 'CANCELLED');

-- AlterTable
ALTER TABLE "programs" ADD COLUMN     "status" "ProgramStatus" NOT NULL DEFAULT 'DRAFT';

-- CreateIndex
CREATE INDEX "programs_status_idx" ON "programs"("status");
