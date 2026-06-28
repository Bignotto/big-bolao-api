CREATE OR REPLACE VIEW "public"."prediction_points" AS
WITH
  prediction_points AS (
    SELECT
      p0.id AS "Prediction",
      p0."poolId",
      p0."userId",
      p0."matchId",
      m0."homeTeamScore",
      m0."awayTeamScore",
      m0.stage,
      m0."matchStatus",
      p0."predictedHomeScore" AS "predictedHome",
      p0."predictedAwayScore" AS "predictedAway",
      p0."predictedHasExtraTime",
      p0."predictedHasPenalties",
      p0."predictedPenaltyHomeScore" AS "predictedHomePenalty",
      p0."predictedPenaltyAwayScore" AS "predictedAwayPenalty",
      CASE
        WHEN p0."predictedHomeScore" = m0."homeTeamScore"
        AND p0."predictedAwayScore" = m0."awayTeamScore" THEN 1
        ELSE 0
      END AS "exactScore",
      CASE
        WHEN p0."predictedHomeScore" = m0."homeTeamScore"
        AND p0."predictedAwayScore" = m0."awayTeamScore" THEN p1."exactScorePoints"
        WHEN sign(
          (p0."predictedHomeScore" - p0."predictedAwayScore")::double precision
        ) = sign(
          (m0."homeTeamScore" - m0."awayTeamScore")::double precision
        )
        AND (p0."predictedHomeScore" - p0."predictedAwayScore") = (m0."homeTeamScore" - m0."awayTeamScore") THEN p1."correctWinnerGoalDiffPoints"
        WHEN p0."predictedHomeScore" > p0."predictedAwayScore"
        AND m0."homeTeamScore" > m0."awayTeamScore" THEN p1."correctWinnerPoints"
        WHEN p0."predictedAwayScore" > p0."predictedHomeScore"
        AND m0."awayTeamScore" > m0."homeTeamScore" THEN p1."correctWinnerPoints"
        WHEN p0."predictedHomeScore" = p0."predictedAwayScore"
        AND m0."homeTeamScore" = m0."awayTeamScore" THEN p1."correctDrawPoints"
        ELSE 0
      END AS basepoints,
      CASE
        WHEN m0.stage = 'FINAL'::match_stage THEN p1."finalMultiplier"
        WHEN m0.stage <> 'GROUP'::match_stage THEN p1."knockoutMultiplier"
        ELSE 1::numeric
      END AS stagemultiplier
    FROM
      predictions p0
      LEFT JOIN scoring_rules p1 ON p1."poolId" = p0."poolId"
      JOIN matches m0 ON m0.id = p0."matchId"
    WHERE
      m0."matchStatus" = 'COMPLETED'::match_status
  )
SELECT
  "Prediction",
  "poolId",
  "userId",
  "matchId",
  "homeTeamScore",
  "awayTeamScore",
  stage,
  "matchStatus",
  "predictedHome",
  "predictedAway",
  "predictedHasExtraTime",
  "predictedHasPenalties",
  "predictedHomePenalty",
  "predictedAwayPenalty",
  "exactScore",
  basepoints,
  stagemultiplier,
  basepoints::numeric * stagemultiplier AS "TotalPoints"
FROM
  prediction_points;