-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "match_stage" ADD VALUE 'THIRD_PLACE';
ALTER TYPE "match_stage" ADD VALUE 'LOSERS_MATCH';

-- AlterTable
ALTER TABLE "matches" ADD COLUMN     "group" TEXT DEFAULT 'default group';
