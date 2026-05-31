/*
  Warnings:

  - You are about to drop the column `apiFootballId` on the `matches` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "matches" DROP COLUMN "apiFootballId",
ADD COLUMN     "apiFutebolId" INTEGER;
