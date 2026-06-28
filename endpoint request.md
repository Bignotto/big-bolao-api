### Step 0 — New backend endpoint (backend team prerequisite)

**Endpoint**: `GET /pools/:poolId/users/:userId/predictions`

**Authorization**: Any authenticated pool member can call this for any `userId` within the same pool (same visibility rule as the standings tab).

**Behavior**: Returns only predictions for `COMPLETED` matches, with points calculated server-side using the existing scoring logic.

**Suggested response shape**:
```json
{
  "predictions": [
    {
      "matchId": 1,
      "predictedHomeScore": 2,
      "predictedAwayScore": 1,
      "predictedHasExtraTime": false,
      "predictedHasPenalties": false,
      "pointsEarned": 10,
      "exactScore": true,
      "correctWinner": true,
      "match": {
        "id": 1,
        "homeTeam": { "name": "Brazil", "flag": "..." },
        "awayTeam": { "name": "Argentina", "flag": "..." },
        "homeScore": 2,
        "awayScore": 1,
        "matchDate": "2026-06-15T18:00:00Z",
        "status": "COMPLETED"
      }
    }
  ]
}
```