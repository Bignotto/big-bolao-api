-- CreateEnum
CREATE TYPE "tournament_status" AS ENUM ('UPCOMING', 'ACTIVE', 'COMPLETED');

-- CreateEnum
CREATE TYPE "match_status" AS ENUM ('SCHEDULED', 'IN_PROGRESS', 'COMPLETED', 'POSTPONED');

-- CreateTable
CREATE TABLE "users" (
    "id" SERIAL NOT NULL,
    "username" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "fullName" TEXT,
    "profileImageUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastLogin" TIMESTAMP(3),

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tournaments" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3) NOT NULL,
    "logoUrl" TEXT,
    "status" "tournament_status" NOT NULL DEFAULT 'UPCOMING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "tournaments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "teams" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "countryCode" CHAR(3),
    "flagUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "teams_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tournament_teams" (
    "tournamentId" INTEGER NOT NULL,
    "teamId" INTEGER NOT NULL,
    "groupName" TEXT,

    CONSTRAINT "tournament_teams_pkey" PRIMARY KEY ("tournamentId","teamId")
);

-- CreateTable
CREATE TABLE "matches" (
    "id" SERIAL NOT NULL,
    "tournamentId" INTEGER NOT NULL,
    "homeTeamId" INTEGER NOT NULL,
    "awayTeamId" INTEGER NOT NULL,
    "matchDatetime" TIMESTAMP(3) NOT NULL,
    "stadium" TEXT,
    "stage" TEXT NOT NULL,
    "homeTeamScore" INTEGER,
    "awayTeamScore" INTEGER,
    "matchStatus" "match_status" NOT NULL DEFAULT 'SCHEDULED',
    "hasExtraTime" BOOLEAN NOT NULL DEFAULT false,
    "hasPenalties" BOOLEAN NOT NULL DEFAULT false,
    "penaltyHomeScore" INTEGER,
    "penaltyAwayScore" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3),

    CONSTRAINT "matches_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pools" (
    "id" SERIAL NOT NULL,
    "tournamentId" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "creatorId" INTEGER NOT NULL,
    "isPrivate" BOOLEAN NOT NULL DEFAULT false,
    "inviteCode" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "maxParticipants" INTEGER,
    "registrationDeadline" TIMESTAMP(3),

    CONSTRAINT "pools_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pool_participants" (
    "poolId" INTEGER NOT NULL,
    "userId" INTEGER NOT NULL,
    "joinedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "pool_participants_pkey" PRIMARY KEY ("poolId","userId")
);

-- CreateTable
CREATE TABLE "scoring_rules" (
    "id" SERIAL NOT NULL,
    "poolId" INTEGER NOT NULL,
    "exactScorePoints" INTEGER NOT NULL,
    "correctWinnerGoalDiffPoints" INTEGER NOT NULL,
    "correctWinnerPoints" INTEGER NOT NULL,
    "correctDrawPoints" INTEGER NOT NULL,
    "specialEventPoints" INTEGER NOT NULL DEFAULT 0,
    "knockoutMultiplier" DECIMAL(3,2) NOT NULL DEFAULT 1.0,
    "finalMultiplier" DECIMAL(3,2) NOT NULL DEFAULT 1.0,

    CONSTRAINT "scoring_rules_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "special_events" (
    "id" SERIAL NOT NULL,
    "poolId" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "points" INTEGER NOT NULL DEFAULT 5,

    CONSTRAINT "special_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "predictions" (
    "id" SERIAL NOT NULL,
    "poolId" INTEGER NOT NULL,
    "matchId" INTEGER NOT NULL,
    "userId" INTEGER NOT NULL,
    "predictedHomeScore" INTEGER NOT NULL,
    "predictedAwayScore" INTEGER NOT NULL,
    "predictedHasExtraTime" BOOLEAN NOT NULL DEFAULT false,
    "predictedHasPenalties" BOOLEAN NOT NULL DEFAULT false,
    "predictedPenaltyHomeScore" INTEGER,
    "predictedPenaltyAwayScore" INTEGER,
    "submittedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3),
    "pointsEarned" INTEGER,

    CONSTRAINT "predictions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "special_event_predictions" (
    "id" SERIAL NOT NULL,
    "eventId" INTEGER NOT NULL,
    "userId" INTEGER NOT NULL,
    "poolId" INTEGER NOT NULL,
    "prediction" TEXT NOT NULL,
    "submittedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "isCorrect" BOOLEAN,
    "pointsEarned" INTEGER,

    CONSTRAINT "special_event_predictions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "leaderboard" (
    "id" SERIAL NOT NULL,
    "poolId" INTEGER NOT NULL,
    "userId" INTEGER NOT NULL,
    "totalPoints" INTEGER NOT NULL DEFAULT 0,
    "exactScoresCount" INTEGER NOT NULL DEFAULT 0,
    "correctWinnersCount" INTEGER NOT NULL DEFAULT 0,
    "rank" INTEGER,
    "lastUpdated" TIMESTAMP(3),

    CONSTRAINT "leaderboard_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notifications" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "message" TEXT NOT NULL,
    "isRead" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "notificationType" TEXT,

    CONSTRAINT "notifications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "prize_information" (
    "id" SERIAL NOT NULL,
    "poolId" INTEGER NOT NULL,
    "rank" INTEGER NOT NULL,
    "description" TEXT NOT NULL,

    CONSTRAINT "prize_information_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_username_key" ON "users"("username");

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "pools_inviteCode_key" ON "pools"("inviteCode");

-- CreateIndex
CREATE UNIQUE INDEX "scoring_rules_poolId_key" ON "scoring_rules"("poolId");

-- CreateIndex
CREATE UNIQUE INDEX "predictions_poolId_matchId_userId_key" ON "predictions"("poolId", "matchId", "userId");

-- CreateIndex
CREATE UNIQUE INDEX "special_event_predictions_eventId_userId_poolId_key" ON "special_event_predictions"("eventId", "userId", "poolId");

-- CreateIndex
CREATE UNIQUE INDEX "leaderboard_poolId_userId_key" ON "leaderboard"("poolId", "userId");

-- CreateIndex
CREATE UNIQUE INDEX "prize_information_poolId_rank_key" ON "prize_information"("poolId", "rank");

-- AddForeignKey
ALTER TABLE "tournament_teams" ADD CONSTRAINT "tournament_teams_tournamentId_fkey" FOREIGN KEY ("tournamentId") REFERENCES "tournaments"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tournament_teams" ADD CONSTRAINT "tournament_teams_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "teams"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "matches" ADD CONSTRAINT "matches_tournamentId_fkey" FOREIGN KEY ("tournamentId") REFERENCES "tournaments"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "matches" ADD CONSTRAINT "matches_homeTeamId_fkey" FOREIGN KEY ("homeTeamId") REFERENCES "teams"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "matches" ADD CONSTRAINT "matches_awayTeamId_fkey" FOREIGN KEY ("awayTeamId") REFERENCES "teams"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pools" ADD CONSTRAINT "pools_tournamentId_fkey" FOREIGN KEY ("tournamentId") REFERENCES "tournaments"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pools" ADD CONSTRAINT "pools_creatorId_fkey" FOREIGN KEY ("creatorId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pool_participants" ADD CONSTRAINT "pool_participants_poolId_fkey" FOREIGN KEY ("poolId") REFERENCES "pools"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pool_participants" ADD CONSTRAINT "pool_participants_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "scoring_rules" ADD CONSTRAINT "scoring_rules_poolId_fkey" FOREIGN KEY ("poolId") REFERENCES "pools"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "special_events" ADD CONSTRAINT "special_events_poolId_fkey" FOREIGN KEY ("poolId") REFERENCES "pools"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "predictions" ADD CONSTRAINT "predictions_poolId_fkey" FOREIGN KEY ("poolId") REFERENCES "pools"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "predictions" ADD CONSTRAINT "predictions_matchId_fkey" FOREIGN KEY ("matchId") REFERENCES "matches"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "predictions" ADD CONSTRAINT "predictions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "special_event_predictions" ADD CONSTRAINT "special_event_predictions_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "special_events"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "special_event_predictions" ADD CONSTRAINT "special_event_predictions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "special_event_predictions" ADD CONSTRAINT "special_event_predictions_poolId_fkey" FOREIGN KEY ("poolId") REFERENCES "pools"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "leaderboard" ADD CONSTRAINT "leaderboard_poolId_fkey" FOREIGN KEY ("poolId") REFERENCES "pools"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "leaderboard" ADD CONSTRAINT "leaderboard_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "prize_information" ADD CONSTRAINT "prize_information_poolId_fkey" FOREIGN KEY ("poolId") REFERENCES "pools"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
