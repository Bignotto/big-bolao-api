# Big Bolão — Mobile App Claude Code System Prompt

You are assisting with the development of the **Big Bolão** mobile app — a sports prediction pool (bolão) application. This document is the canonical reference for the backend API that the mobile app consumes.

---

## Project Overview

Big Bolão is a sports betting/pool game where users:
- Create or join prediction pools tied to a tournament
- Submit predictions for match outcomes (score, winner, extra time, penalties)
- Earn points based on prediction accuracy using configurable scoring rules
- Compete on leaderboards within each pool

---

## Backend API

**Base URL (production):** configured via environment
**Auth:** All endpoints (except `POST /users`) require `Authorization: Bearer <supabase_token>` header
**Auth provider:** Supabase — the mobile app authenticates with Supabase directly, then passes the token to this API
**Content-Type:** `application/json`
**API Docs:** `/docs` (Swagger/OpenAPI)

---

## Authentication Flow

1. User authenticates with **Supabase** (email/password, Google, or Apple)
2. Supabase returns a JWT token
3. Mobile app includes token as `Authorization: Bearer <token>` on every API request
4. The API validates the token via Supabase and injects `user.sub` (user ID) into the request context

**Account providers:** `EMAIL` | `GOOGLE` | `APPLE`
**User roles:** `USER` | `ADMIN`

---

## Data Models

### User
```ts
{
  id: string            // CUID
  fullName: string
  email: string         // unique
  passwordHash: string | null
  profileImageUrl: string | null
  createdAt: string     // ISO datetime
  lastLogin: string | null
  accountId: string | null
  accountProvider: "GOOGLE" | "APPLE" | "EMAIL"
  role: "USER" | "ADMIN"
}
```

### Tournament
```ts
{
  id: number
  name: string
  startDate: string
  endDate: string
  logoUrl: string | null
  status: "UPCOMING" | "ACTIVE" | "COMPLETED"
  createdAt: string
  // computed
  totalMatches: number
  completedMatches: number
  totalTeams: number
  totalPools: number
}
```

### Team
```ts
{
  id: number
  name: string
  countryCode: string | null  // ISO 3-char code
  flagUrl: string | null
  createdAt: string
}
```

### Match
```ts
{
  id: number
  tournamentId: number
  homeTeamId: number
  awayTeamId: number
  matchDatetime: string
  stadium: string | null
  stage: "GROUP" | "ROUND_OF_16" | "QUARTER_FINAL" | "SEMI_FINAL" | "FINAL" | "THIRD_PLACE" | "LOSERS_MATCH"
  group: string | null        // e.g. "A", "B" — only for GROUP stage
  homeTeamScore: number | null
  awayTeamScore: number | null
  matchStatus: "SCHEDULED" | "IN_PROGRESS" | "COMPLETED" | "POSTPONED"
  hasExtraTime: boolean
  hasPenalties: boolean
  penaltyHomeScore: number | null
  penaltyAwayScore: number | null
  createdAt: string
  updatedAt: string | null
  // relations
  homeTeam: Team
  awayTeam: Team
  tournament: Tournament
}
```

### Pool
```ts
{
  id: number
  tournamentId: number
  name: string
  description: string | null
  creatorId: string
  isPrivate: boolean
  inviteCode: string | null    // unique
  createdAt: string
  maxParticipants: number | null
  registrationDeadline: string | null
  // computed
  participantsCount: number
  isCreator: boolean
  isParticipant: boolean
  // relations
  scoringRules: ScoringRule
}
```

### ScoringRule
```ts
{
  id: number
  poolId: number
  exactScorePoints: number              // correct home + away score
  correctWinnerGoalDiffPoints: number   // correct winner + goal difference
  correctWinnerPoints: number           // correct winner only
  correctDrawPoints: number             // correct draw prediction
  specialEventPoints: number            // default: 0
  knockoutMultiplier: number            // decimal, e.g. 1.2
  finalMultiplier: number               // decimal, e.g. 1.5
}
```

### Prediction
```ts
{
  id: number
  poolId: number
  matchId: number
  userId: string
  predictedHomeScore: number
  predictedAwayScore: number
  predictedHasExtraTime: boolean
  predictedHasPenalties: boolean
  predictedPenaltyHomeScore: number | null
  predictedPenaltyAwayScore: number | null
  submittedAt: string
  updatedAt: string | null
  pointsEarned: number | null   // null until match is completed
}
```

### Leaderboard Entry
```ts
{
  poolId: number
  userId: string
  totalPoints: number
  exactScoresCount: number
  correctWinnersCount: number
  rank: number | null
  lastUpdated: string | null
  user: User
}
```

---

## API Endpoints

### Users

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/users` | No | Create user account |
| GET | `/users/me` | Yes | Get authenticated user |
| GET | `/users/:userId` | Yes | Get user by ID |
| PUT | `/users/:userId` | Yes | Update user profile |
| GET | `/users/:userId/pools` | Yes | List pools user belongs to |
| GET | `/users/me/pools/standings` | Yes | Get standings across all user's pools |
| GET | `/users/me/predictions` | Yes | Get user's predictions (optional `?poolId=`) |

**POST /users**
```json
// Request
{
  "fullName": "John Doe",
  "email": "john@example.com",
  "passwordHash": "hashed",
  "profileImageUrl": "https://..."
}
// Response 201
{ "user": User }
```

---

### Pools

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/pools` | Yes | List public pools (`?page=1&limit=10&name=filter`) |
| POST | `/pools` | Yes | Create a new pool |
| GET | `/pools/:poolId` | Yes | Get pool details |
| PUT | `/pools/:poolId` | Yes | Update pool (owner only) |
| GET | `/pools/:poolId/users` | Yes | List pool participants |
| POST | `/pools/:poolId/users` | Yes | Join public pool |
| DELETE | `/pools/:poolId/users/me` | Yes | Leave pool |
| DELETE | `/pools/:poolId/users/:userId` | Yes | Remove user from pool (owner only) |
| GET | `/pools/:poolId/predictions` | Yes | All predictions in the pool |
| GET | `/pools/:poolId/standings` | Yes | Pool leaderboard |
| PUT | `/pools/:poolId/scoring-rules` | Yes | Update scoring rules (owner only) |
| GET | `/pool-invites/:inviteCode` | Yes | Get pool by invite code (read-only) |
| POST | `/pool-invites/:inviteCode` | Yes | Join pool by invite code |

**POST /pools**
```json
// Request
{
  "name": "My Pool",
  "description": "optional",
  "tournamentId": 1,
  "isPrivate": false,
  "inviteCode": "MYCODE",           // optional
  "maxParticipants": 20,            // optional
  "registrationDeadline": "2024-06-01T00:00:00Z"  // optional
}
// Response 201
{ "pool": Pool }
```

**GET /pools (paginated)**
```json
// Response 200
{
  "pools": Pool[],
  "total": 42,
  "page": 1,
  "limit": 10
}
```

**PUT /pools/:poolId/scoring-rules (owner only)**
```json
// Request (all fields optional — only send fields you want to change)
{
  "exactScorePoints": 5,
  "correctWinnerGoalDiffPoints": 3,
  "correctWinnerPoints": 2,
  "correctDrawPoints": 2,
  "specialEventPoints": 3,
  "knockoutMultiplier": 1.5,
  "finalMultiplier": 2.0
}
// Response 200
{ "scoringRules": ScoringRule }
```
> ⚠️ Changing scoring rules recalculates all past points retroactively (the view joins live). Warn the user in the UI before saving.

---

### Predictions

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/predictions` | Yes | Create prediction |
| GET | `/predictions/:predictionId` | Yes | Get prediction |
| PUT | `/predictions/:predictionId` | Yes | Update prediction |

**POST /predictions**
```json
// Request
{
  "poolId": 1,
  "matchId": 42,
  "predictedHomeScore": 2,
  "predictedAwayScore": 1,
  "predictedHasExtraTime": false,
  "predictedHasPenalties": false,
  "predictedPenaltyHomeScore": null,
  "predictedPenaltyAwayScore": null
}
// Response 201
{ "prediction": Prediction }
```

---

### Matches

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/matches/:matchId` | Yes | Get match details |
| GET | `/matches/:matchId/predictions` | Yes | All predictions for a match |
| PUT | `/matches/:matchId` | Yes | Update match result (ADMIN only) |

**PUT /matches/:matchId (admin only)**
```json
// Request
{
  "homeTeamScore": 2,
  "awayTeamScore": 1,
  "matchStatus": "COMPLETED",
  "hasExtraTime": false,
  "hasPenalties": false
}
```

---

### Tournaments

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/tournaments` | Yes | List all tournaments |
| GET | `/tournaments/:tournamentId` | Yes | Get tournament details |
| GET | `/tournaments/:tournamentId/matches` | Yes | Tournament matches (`?stage=FINAL&status=COMPLETED`) |

---

### Health

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/health` | No | Health check |

---

## Error Response Format

All errors follow this shape:

```json
{
  "message": "Human-readable error description"
}
```

| HTTP Status | Meaning |
|-------------|---------|
| 400 | Bad request / validation error |
| 401 | Unauthorized (missing or invalid token) |
| 403 | Forbidden (insufficient permissions) |
| 404 | Resource not found |
| 409 | Conflict (e.g. already joined, email in use) |
| 422 | Unprocessable entity (Zod validation failed) |
| 500 | Internal server error |

---

## Business Rules

- A user can only have **one prediction per match per pool** (`poolId + matchId + userId` is unique)
- Predictions can be updated before a match starts; once started, they are locked
- Pool owners can remove participants; regular users can only leave
- `inviteCode` must be unique across all pools
- `ScoringRule` is created automatically when a pool is created; the pool owner can update it via `PUT /pools/:poolId/scoring-rules`
- Scoring rule changes are **retroactive** — past points are recalculated immediately since the view joins live
- `pointsEarned` on a prediction is `null` until the match status is `COMPLETED`
- Knockout stage predictions use `knockoutMultiplier`; final uses `finalMultiplier`
- `role: ADMIN` is required to update match results via `PUT /matches/:matchId`

---

## Scoring Logic

Each pool has one `ScoringRule` record. Points are calculated by the database when a match is `COMPLETED` and are exposed via `pointsEarned` on `Prediction` and `totalPoints` on leaderboard entries.

### Base Points (priority order — first match wins)

| Condition | Field | Default |
|---|---|---|
| Predicted home AND away score exactly correct | `exactScorePoints` | 5 |
| Correct winner AND correct goal difference (e.g. predicted 2-0, actual 3-1 — both home wins by 1) | `correctWinnerGoalDiffPoints` | 3 |
| Correct winner, wrong goal difference | `correctWinnerPoints` | 2 |
| Predicted draw AND match ended in a draw | `correctDrawPoints` | 2 |
| None of the above | — | 0 |

### Stage Multipliers

```
finalPoints = basePoints × stageMultiplier
```

| Match stage | Multiplier field | Default |
|---|---|---|
| `GROUP` | *(hardcoded 1 — no multiplier)* | 1× |
| Any knockout stage (`ROUND_OF_32`, `ROUND_OF_16`, `QUARTER_FINAL`, `SEMI_FINAL`, `THIRD_PLACE`) | `knockoutMultiplier` | 1.5× |
| `FINAL` | `finalMultiplier` | 2.0× |

### Example

A user predicts **2-1** and the actual result is **3-1** in a `SEMI_FINAL`:
- Correct winner (home) ✓, goal difference matches (both +1) ✓ → `correctWinnerGoalDiffPoints` = 3 pts
- Stage multiplier: `knockoutMultiplier` = 1.5×
- **Total: 3 × 1.5 = 4.5 points**

### UI Guidance

- Always show the pool's `scoringRules` when the user is submitting or reviewing a prediction
- `pointsEarned` is `null` until `matchStatus === "COMPLETED"` — show a pending state
- `specialEventPoints` is stored but not currently used in scoring — do not display it
- Extra-time / penalty prediction fields are stored but have no scoring impact in the current version

### Pool Settings Screen — Editing Scoring Rules

1. Load current rules from `pool.scoringRules` (already included in `GET /pools/:poolId`)
2. Show editable fields pre-filled with current values — only show this form when `pool.isCreator === true`
3. Before saving, display a confirmation: *"Changing scoring rules will recalculate all points immediately."*
4. On confirm, call `PUT /pools/:poolId/scoring-rules` with only the changed fields
5. On success, refresh the leaderboard (`GET /pools/:poolId/standings`) to reflect recalculated points

---

## Backend Stack (for context)

- **Runtime:** Node.js with TypeScript (ES Modules)
- **Framework:** Fastify v5
- **Database:** PostgreSQL via Prisma ORM v6
- **Auth:** Supabase (JWT verification)
- **Validation:** Zod
- **Deployment:** Render.com (see `render.yaml`)
- **Architecture:** Clean Architecture — Controllers → Use Cases → Repositories

---

## Key Implementation Notes for Mobile

1. **Always handle `null` values** — many fields are nullable (scores, profile images, deadlines)
2. **Supabase token refresh** — tokens expire; implement auto-refresh in the mobile auth layer
3. **Optimistic UI** — for predictions, apply local state immediately then sync with server
4. **Pagination** — `GET /pools` supports `page` and `limit` query params; implement infinite scroll
5. **Poll or push for match updates** — `matchStatus` and scores change server-side; consider polling or websocket subscriptions via Supabase Realtime
6. **Role-aware UI** — hide admin controls (`PUT /matches/:matchId`) unless `user.role === "ADMIN"`
7. **Invite flow** — use `GET /pool-invites/:code` to preview pool before `POST /pool-invites/:code` to join
8. **Scoring display** — always show the `scoringRules` when users are submitting predictions so they understand the point values
