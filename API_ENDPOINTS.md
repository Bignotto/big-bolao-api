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
| `GET` | `/pool-invites/:inviteCode` | Get pool info by invite code (no join) |
| `POST` | `/pool-invites/:inviteCode` | Join a pool using invite code (public or private) |

---

## Matches

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/matches/:matchId` | Get match details with team and tournament info |
| `GET` | `/matches/:matchId/predictions` | Get all predictions for a match |
| `GET` | `/matches/:matchId/predictions/me` | Get authenticated user's prediction for a match |
| `PUT` | `/matches/:matchId` | Update match scores/status (admin only) |

---

## Predictions

| Method | Path | Description |
|--------|------|-------------|
| `POST` | `/predictions` | Submit a new prediction (before match start) |
| `GET` | `/predictions/:predictionId` | Get prediction details |
| `PUT` | `/predictions/:predictionId` | Update a prediction (before match start) |

---

## Tournaments

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/tournaments` | List all tournaments |
| `GET` | `/tournaments/:tournamentId` | Get tournament details and stats |
| `GET` | `/tournaments/:tournamentId/matches` | List matches for a tournament (filter by `stage`, `status`, `group`) |
