-- DropForeignKey
ALTER TABLE "pools" DROP CONSTRAINT "pools_creatorId_fkey";

-- AddForeignKey
ALTER TABLE "pools" ADD CONSTRAINT "pools_creatorId_fkey" FOREIGN KEY ("creatorId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
