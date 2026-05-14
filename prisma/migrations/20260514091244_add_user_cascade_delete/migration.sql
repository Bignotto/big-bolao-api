-- DropForeignKey
ALTER TABLE "leaderboard" DROP CONSTRAINT "leaderboard_poolId_fkey";

-- DropForeignKey
ALTER TABLE "leaderboard" DROP CONSTRAINT "leaderboard_userId_fkey";

-- DropForeignKey
ALTER TABLE "notifications" DROP CONSTRAINT "notifications_userId_fkey";

-- DropForeignKey
ALTER TABLE "pool_participants" DROP CONSTRAINT "pool_participants_poolId_fkey";

-- DropForeignKey
ALTER TABLE "pool_participants" DROP CONSTRAINT "pool_participants_userId_fkey";

-- DropForeignKey
ALTER TABLE "pools" DROP CONSTRAINT "pools_creatorId_fkey";

-- DropForeignKey
ALTER TABLE "predictions" DROP CONSTRAINT "predictions_poolId_fkey";

-- DropForeignKey
ALTER TABLE "predictions" DROP CONSTRAINT "predictions_userId_fkey";

-- DropForeignKey
ALTER TABLE "prize_information" DROP CONSTRAINT "prize_information_poolId_fkey";

-- DropForeignKey
ALTER TABLE "scoring_rules" DROP CONSTRAINT "scoring_rules_poolId_fkey";

-- DropForeignKey
ALTER TABLE "special_event_predictions" DROP CONSTRAINT "special_event_predictions_eventId_fkey";

-- DropForeignKey
ALTER TABLE "special_event_predictions" DROP CONSTRAINT "special_event_predictions_poolId_fkey";

-- DropForeignKey
ALTER TABLE "special_event_predictions" DROP CONSTRAINT "special_event_predictions_userId_fkey";

-- DropForeignKey
ALTER TABLE "special_events" DROP CONSTRAINT "special_events_poolId_fkey";

-- AddForeignKey
ALTER TABLE "pools" ADD CONSTRAINT "pools_creatorId_fkey" FOREIGN KEY ("creatorId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pool_participants" ADD CONSTRAINT "pool_participants_poolId_fkey" FOREIGN KEY ("poolId") REFERENCES "pools"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pool_participants" ADD CONSTRAINT "pool_participants_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "scoring_rules" ADD CONSTRAINT "scoring_rules_poolId_fkey" FOREIGN KEY ("poolId") REFERENCES "pools"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "special_events" ADD CONSTRAINT "special_events_poolId_fkey" FOREIGN KEY ("poolId") REFERENCES "pools"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "predictions" ADD CONSTRAINT "predictions_poolId_fkey" FOREIGN KEY ("poolId") REFERENCES "pools"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "predictions" ADD CONSTRAINT "predictions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "special_event_predictions" ADD CONSTRAINT "special_event_predictions_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "special_events"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "special_event_predictions" ADD CONSTRAINT "special_event_predictions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "special_event_predictions" ADD CONSTRAINT "special_event_predictions_poolId_fkey" FOREIGN KEY ("poolId") REFERENCES "pools"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "leaderboard" ADD CONSTRAINT "leaderboard_poolId_fkey" FOREIGN KEY ("poolId") REFERENCES "pools"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "leaderboard" ADD CONSTRAINT "leaderboard_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "prize_information" ADD CONSTRAINT "prize_information_poolId_fkey" FOREIGN KEY ("poolId") REFERENCES "pools"("id") ON DELETE CASCADE ON UPDATE CASCADE;
