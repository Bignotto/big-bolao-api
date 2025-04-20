-- Create views necessary to handle pool standings

create or replace view prediction_points as
with prediction_points as (
select
	P0.id "Prediction",
  P0."poolId",
  P0."userId",
  P0."matchId",
  M0."homeTeamScore",
  M0."awayTeamScore",
  M0.stage,
  M0."matchStatus",
  P0."predictedHomeScore" "predictedHome",
  P0."predictedAwayScore" "predictedAway",
  P0."predictedHasExtraTime",
  P0."predictedHasPenalties",
  P0."predictedPenaltyHomeScore" "predictedHomePenalty",
  P0."predictedPenaltyAwayScore" "predictedAwayPenalty",
  
  case
		when P0."predictedHomeScore" = M0."homeTeamScore"
    	AND P0."predictedAwayScore" = M0."awayTeamScore"
      THEN 1
  	else 0
  end as "exactScore",
  case
  	when P0."predictedHomeScore" = M0."homeTeamScore"
    	AND P0."predictedAwayScore" = M0."awayTeamScore"
      THEN P1."exactScorePoints"
      
    when SIGN(P0."predictedHomeScore" - P0."predictedAwayScore") = SIGN(M0."homeTeamScore" - M0."awayTeamScore")
			AND (P0."predictedHomeScore" - P0."predictedAwayScore") = (M0."homeTeamScore" - M0."awayTeamScore")
      THEN P1."correctWinnerGoalDiffPoints"
      
    when P0."predictedHomeScore" > P0."predictedAwayScore"
    	AND M0."homeTeamScore" > M0."awayTeamScore"
      THEN P1."correctWinnerPoints"
    
    when P0."predictedAwayScore" > P0."predictedHomeScore"
    	AND M0."awayTeamScore" > M0."homeTeamScore"
      THEN P1."correctWinnerPoints"
   
   	when P0."predictedHomeScore" = P0."predictedAwayScore"
    	AND M0."homeTeamScore" = M0."awayTeamScore"
      THEN P1."correctDrawPoints"
    
    else 0
  end as basePoints,
  
  case
  	when M0.stage = 'FINAL' then P1."finalMultiplier"
    when M0.stage != 'GROUP' then P1."knockoutMultiplier"
    else 1
  end as stageMultiplier
  
from predictions P0 --on P0."userId" = PP."userId" and P0."poolId" = PP."poolId"
	left join scoring_rules P1 on P1."poolId" = P0."poolId"
  inner join matches M0 on M0.id = P0."matchId"
  
where M0."matchStatus" = 'COMPLETED'
)

select *,
	basePoints * stageMultiplier as "TotalPoints"
from prediction_points;

create or replace view tournament_statistics as
select
	POL.id "poolId",
  POL.name,
  MST.*,
  (MST."groupMatches" * PSR."exactScorePoints") 
  	+ (MST."knockOutMatches" * PSR."exactScorePoints" * PSR."knockoutMultiplier")
    + (MST."finalMatches" * PSR."exactScorePoints" * PSR."finalMultiplier") "possibleTotalPoints"
from pools POL
	left join scoring_rules PSR on PSR."poolId" = POL.id
  
  left join (
    select
      T0.id "tournamentId",
    	sum(
        case
          when M0.stage = 'GROUP' then 1
          else 0
        end) "groupMatches",
    	sum(
        case
          when M0.stage = 'FINAL' then 1
          else 0
        end) "finalMatches",
    	sum(
        case
        	when M0.stage = 'FINAL' then 0
          when M0.stage != 'GROUP' then 1
          else 0
        end) "knockOutMatches",
    count(M0.id) "totalMatches"

    from tournaments T0
      inner join matches M0 on M0."tournamentId" = T0.id
    group by T0.id
  ) MST on MST."tournamentId" = POL."tournamentId";

create or replace view pool_standings as
with pool_standings as (
select
	P0."userId",
  P0."poolId",
  count(P0."Prediction") "totalPredictions",
	sum(P0."TotalPoints") "totalPoints",
  sum(P0."exactScore") "exactScoreCount"
from prediction_points P0
group by P0."userId", P0."poolId")

select
	row_number() over(
  	PARTITION by PS."poolId"
    ORDER BY PS."totalPoints" desc, PS."exactScoreCount" desc
  ) as ranking,
  USR."fullName",
  USR."profileImageUrl",
	PS."userId",
  PS."poolId",
  PS."totalPredictions",
  PS."totalPoints",
  PS."exactScoreCount",
  round((PS."totalPoints" / TS."possibleTotalPoints") * 100, 1) "pointsRatio",
  round(((PS."exactScoreCount" * 1.00) / TS."totalMatches") * 100, 1) "guessRatio",
  round(((PS."totalPredictions" * 1.00)/TS."totalMatches") *100, 1) "predictionsRatio"
from pool_standings PS
	left join users USR on USR.id = PS."userId"
	left join tournament_statistics TS on TS."poolId" = PS."poolId"
  
order by
	PS."poolId",
	(row_number() over(
  	PARTITION by PS."poolId"
    ORDER BY PS."totalPoints" desc, PS."exactScoreCount" desc
  ))
;
