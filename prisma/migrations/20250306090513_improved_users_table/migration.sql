/*
  Warnings:

  - You are about to drop the column `username` on the `users` table. All the data in the column will be lost.
  - Made the column `fullName` on table `users` required. This step will fail if there are existing NULL values in that column.

*/
-- CreateEnum
CREATE TYPE "AccountProvider" AS ENUM ('GOOGLE', 'APPLE', 'EMAIL');

-- DropIndex
DROP INDEX "users_username_key";

-- AlterTable
ALTER TABLE "users" DROP COLUMN "username",
ADD COLUMN     "accountId" TEXT,
ADD COLUMN     "accountProvider" "AccountProvider" DEFAULT 'EMAIL',
ALTER COLUMN "fullName" SET NOT NULL;
