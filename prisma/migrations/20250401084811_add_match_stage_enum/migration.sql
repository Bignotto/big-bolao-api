/*
  Warnings:

  - You are about to drop the column `stage` on the `matches` table. All the data in the column will be lost.

*/
-- CreateEnum
CREATE TYPE "match_stage" AS ENUM ('GROUP', 'ROUND_OF_16', 'QUARTER_FINAL', 'SEMI_FINAL', 'FINAL');

-- AlterTable
ALTER TABLE "matches" DROP COLUMN "stage";
