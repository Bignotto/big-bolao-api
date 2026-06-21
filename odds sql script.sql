select
  ODS.matchId,
  ODS.homeTeam,
  HOME.name as HomeTeamName,
  ODS.HomeWins,
  ODS.DrawMatch,
  ODS.AwayWins,
  AWAY.name as AwayTeamName,
  ODS.awayTeam,
  ODS.HomeWins + ODS.AwayWins + ODS.DrawMatch as TotalPredictions,
round(
  ODS.HomeWins::numeric * 100 / 
  (ODS.HomeWins + ODS.AwayWins + ODS.DrawMatch),
  2
) as HomePercentage,

round(
  ODS.AwayWins::numeric * 100 / 
  (ODS.HomeWins + ODS.AwayWins + ODS.DrawMatch),
  2
) as AwayPercentage,

round(
  ODS.DrawMatch::numeric * 100 / 
  (ODS.HomeWins + ODS.AwayWins + ODS.DrawMatch),
  2
) as DrawPercentage
from (
  select
  PRS.MatchId,
  PRS.HomeTeam,
  PRS.AwayTeam,
  sum(HomeWins) as HomeWins,
  sum(DrawMatch) as DrawMatch,
  sum(AwayWins) as AwayWins
from (
        select
        M.id as MatchId,
        H.id as HomeTeam,
        A.id as AwayTeam,
        case
          when PR."predictedHomeScore" > PR."predictedAwayScore" then 1 else 0
        end as HomeWins,
        case
          when PR."predictedHomeScore" = PR."predictedAwayScore" then 1 else 0
        end as DrawMatch,
        case
          when PR."predictedAwayScore" > PR."predictedHomeScore" then 1 else 0
        end as AwayWins
      from predictions as PR
        inner join matches as M on M.id = PR."matchId"
        inner join teams as H on H.id = M."homeTeamId"
        inner join teams as A on A.id = M."awayTeamId"
    ) as PRS
    
    group by PRS.MatchId, PRS.HomeTeam, PRS.AwayTeam
) as ODS
  inner join teams as HOME on HOME.id = ODS.HomeTeam
  inner join teams as AWAY on AWAY.id = ODS.AwayTeam