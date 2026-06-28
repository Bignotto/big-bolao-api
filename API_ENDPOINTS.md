# Big Bolão API — Endpoints

All endpoints require a valid Supabase Bearer token in the `Authorization` header unless noted otherwise.

---

## Users

| Method | Path | Description | Auth |
|--------|------|-------------|------|
| `POST` | `/users` | Create a new user account | Required |
| `GET` | `/users/:userId` | Get user profile by ID | Required |
| `GET` | `/users/me` | Get authenticated user profile | Required |
| `PUT` | `/users/:userId` | Update user profile | Required |
| `DELETE` | `/users/me` | Permanently delete authenticated user account and all associated data | Required |
| `GET` | `/users/:userId/pools` | List pools the user participates in | Required |
| `GET` | `/users/me/predictions` | Get authenticated user's predictions (filter by `?poolId`) | Required |
| `GET` | `/users/me/pools/standings` | Get authenticated user's standings across all pools | Required |

### DELETE /users/me
Permanently removes the user account and all associated data: pool participations, predictions, special event predictions, notifications, and leaderboard entries. Required by Apple App Store and Google Play Store guidelines.

For pools the user created: ownership is transferred to the earliest-joined other participant. If no other participants exist, the pool is deleted along with all its data.

- **Response 204** — Account deleted successfully
- **Response 401** — Missing or invalid token
- **Response 404** — User not found

---

## Pools

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/pools` | List public pools (optional `?name` filter, pagination) |
| `POST` | `/pools` | Create a new pool |
| `GET` | `/pools/:poolId` | Get pool details |
| `PUT` | `/pools/:poolId` | Update pool info (owner only) |
| `GET` | `/pools/:poolId/users` | List participants in a pool |
| `POST` | `/pools/:poolId/users` | Join a public pool by ID |
| `DELETE` | `/pools/:poolId/users/me` | Leave a pool |
| `DELETE` | `/pools/:poolId/users/:userId` | Remove a user from a pool (owner only) |
| `PUT` | `/pools/:poolId/scoring-rules` | Update pool scoring rules (owner only) |
| `GET` | `/pools/:poolId/predictions` | Get all predictions in a pool |
| `GET` | `/pools/:poolId/matches/:matchId/predictions` | Get prediction status per participant for a match |
| `GET` | `/pools/:poolId/standings` | Get pool leaderboard |
| `GET` | `/pools/:poolId/odds` | Get home/draw/away prediction odds for all tournament matches (pool-scoped and global) |
| `GET` | `/pools/:poolId/matches/:matchId/odds` | Get home/draw/away prediction odds for a single match (pool-scoped and global) |
| `GET` | `/pool-invites/:inviteCode` | Get pool info by invite code (no join) |
| `POST` | `/pool-invites/:inviteCode` | Join a pool using invite code (public or private) |

### GET /pools/:poolId/odds and GET /pools/:poolId/matches/:matchId/odds

Both endpoints require the authenticated user to be a pool participant or creator. They return prediction percentage breakdowns computed from two scopes simultaneously:

- **`pool`** — predictions made within this specific pool only
- **`global`** — predictions across all pools for the same match

The all-matches endpoint returns an array; the per-match endpoint returns a single object.

Each entry shape:
```json
{
  "matchId": 1,
  "homeTeam": { "id": 1, "name": "Brazil", "countryCode": "BRA", "flagUrl": "..." },
  "awayTeam": { "id": 2, "name": "Argentina", "countryCode": "ARG", "flagUrl": "..." },
  "global": { "total": 150, "homeWinsPercentage": 45.33, "drawPercentage": 22.00, "awayWinsPercentage": 32.67 },
  "pool":   { "total": 12,  "homeWinsPercentage": 50.00, "drawPercentage": 16.67, "awayWinsPercentage": 33.33 }
}
```

Matches with zero predictions return `total: 0` and all percentages `0`.

- **Response 200** — Odds returned successfully
- **Response 401** — Missing or invalid token
- **Response 403** — User is not a pool participant or creator
- **Response 404** — Pool not found (or match not found, for the per-match endpoint)

---

## Matches

| Method | Path | Description | Auth |
|--------|------|-------------|------|
| `GET` | `/matches/:matchId` | Get match details with team and tournament info | Required |
| `GET` | `/matches/:matchId/predictions` | Get all predictions for a match | Required |
| `GET` | `/matches/:matchId/predictions/me` | Get authenticated user's prediction for a match | Required |
| `PUT` | `/matches/:matchId` | Update match details — teams, scores, status, stage, extra time, penalties | Admin only |

### PUT /matches/:matchId
Updates any field on a match record. Intended for admins to manage live World Cup data, including:
- Assigning real teams to knockout-stage placeholders (`homeTeam`, `awayTeam`)
- Setting scores and match status (`IN_PROGRESS` → `COMPLETED`)
- Recording extra time (`hasExtraTime`) and penalty shootouts (`hasPenalties`, `penaltyHomeScore`, `penaltyAwayScore`)

Business rules enforced:
- Scores, extra time, and penalties cannot be set on `SCHEDULED` matches
- Group-stage matches cannot have extra time or penalties
- Penalties require extra time, tied regular scores, and a decisive penalty score

- **Response 200** — Match updated successfully
- **Response 400** — Business rule violation
- **Response 401** — Missing or invalid token
- **Response 403** — Authenticated user does not have admin role
- **Response 404** — Match not found
- **Response 422** — Validation error

---

## Predictions

| Method | Path | Description |
|--------|------|-------------|
| `POST` | `/predictions` | Submit a new prediction (before match start) |
| `GET` | `/predictions/:predictionId` | Get prediction details |
| `PUT` | `/predictions/:predictionId` | Update a prediction (before match start) |

---

## Teams

| Method | Path | Description | Auth |
|--------|------|-------------|------|
| `GET` | `/teams/:teamId/recent-form` | Get a team's last N finished results (W/D/L) | Required |

### GET /teams/:teamId/recent-form

Returns a team's most recent completed matches from that team's perspective, ordered oldest → newest. Use the optional `?limit` query parameter to control how many results are returned (default: 3, max: 10).

Response shape:
```json
{
  "teamId": 12,
  "results": [
    {
      "matchId": 387,
      "result": "W",
      "teamScore": 2,
      "opponentScore": 0,
      "opponentId": 7,
      "opponentName": "Croácia",
      "opponentCode": "CRO",
      "matchDatetime": "2026-06-12T18:00:00.000Z",
      "stage": "GROUP",
      "decidedOnPenalties": false
    }
  ]
}
```

- `result` is always from the requested team's perspective (`W` / `D` / `L`)
- A knockout draw won on penalties remains `D`; `decidedOnPenalties` is set to `true`
- Returns fewer than `limit` entries (or `[]`) when the team has played fewer completed matches

- **Response 200** — Results returned successfully (may be empty array)
- **Response 401** — Missing or invalid token

---

## Tournaments

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/tournaments` | List all tournaments |
| `GET` | `/tournaments/:tournamentId` | Get tournament details and stats |
| `GET` | `/tournaments/:tournamentId/matches` | List matches for a tournament (filter by `stage`, `status`, `group`) |
