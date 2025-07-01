export const errorResponseSchema = {
  type: 'object',
  properties: {
    message: { type: 'string' },
  },
  required: ['message'],
};

export const userSchema = {
  type: 'object',
  properties: {
    id: { type: 'string' },
    fullName: { type: 'string' },
    email: { type: 'string' },
    profileImageUrl: { type: 'string', nullable: true },
    createdAt: { type: 'string', format: 'date-time' },
  },
  required: ['id', 'fullName', 'email', 'createdAt'],
};

export const poolSchema = {
  type: 'object',
  properties: {
    id: { type: 'integer' },
    tournamentId: { type: 'integer' },
    name: { type: 'string' },
    description: { type: 'string', nullable: true },
    creatorId: { type: 'string' },
    isPrivate: { type: 'boolean' },
    inviteCode: { type: 'string', nullable: true },
    createdAt: { type: 'string', format: 'date-time' },
    maxParticipants: { type: 'integer', nullable: true },
    registrationDeadline: { type: 'string', format: 'date-time', nullable: true },
  },
  required: ['id', 'tournamentId', 'name', 'creatorId', 'isPrivate', 'createdAt'],
};

export const matchSchema = {
  type: 'object',
  properties: {
    id: { type: 'integer' },
    tournamentId: { type: 'integer' },
    homeTeamId: { type: 'integer' },
    awayTeamId: { type: 'integer' },
    matchDatetime: { type: 'string', format: 'date-time' },
    stadium: { type: 'string', nullable: true },
    stage: { type: 'string' },
    group: { type: 'string', nullable: true },
    homeTeamScore: { type: 'integer', nullable: true },
    awayTeamScore: { type: 'integer', nullable: true },
    matchStatus: { type: 'string' },
    hasExtraTime: { type: 'boolean' },
    hasPenalties: { type: 'boolean' },
    penaltyHomeScore: { type: 'integer', nullable: true },
    penaltyAwayScore: { type: 'integer', nullable: true },
    createdAt: { type: 'string', format: 'date-time' },
    updatedAt: { type: 'string', format: 'date-time', nullable: true },
  },
  required: ['id', 'tournamentId', 'homeTeamId', 'awayTeamId', 'matchDatetime', 'stage', 'matchStatus', 'hasExtraTime', 'hasPenalties', 'createdAt'],
};

export const predictionSchema = {
  type: 'object',
  properties: {
    id: { type: 'integer' },
    poolId: { type: 'integer' },
    matchId: { type: 'integer' },
    userId: { type: 'string' },
    predictedHomeScore: { type: 'integer' },
    predictedAwayScore: { type: 'integer' },
    predictedHasExtraTime: { type: 'boolean' },
    predictedHasPenalties: { type: 'boolean' },
    predictedPenaltyHomeScore: { type: 'integer', nullable: true },
    predictedPenaltyAwayScore: { type: 'integer', nullable: true },
    submittedAt: { type: 'string', format: 'date-time' },
    updatedAt: { type: 'string', format: 'date-time', nullable: true },
    pointsEarned: { type: 'integer', nullable: true },
  },
  required: [
    'id',
    'poolId',
    'matchId',
    'userId',
    'predictedHomeScore',
    'predictedAwayScore',
    'predictedHasExtraTime',
    'predictedHasPenalties',
    'submittedAt',
  ],
};

export const tournamentSchema = {
  type: 'object',
  properties: {
    id: { type: 'integer' },
    name: { type: 'string' },
    startDate: { type: 'string', format: 'date-time' },
    endDate: { type: 'string', format: 'date-time' },
    logoUrl: { type: 'string', nullable: true },
    status: { type: 'string' },
    createdAt: { type: 'string', format: 'date-time' },
  },
  required: ['id', 'name', 'startDate', 'endDate', 'status', 'createdAt'],
};

export const userIdParam = {
  type: 'object',
  properties: { userId: { type: 'string' } },
  required: ['userId'],
};

export const matchIdParam = {
  type: 'object',
  properties: { matchId: { type: 'string' } },
  required: ['matchId'],
};

export const poolIdParam = {
  type: 'object',
  properties: { poolId: { type: 'string' } },
  required: ['poolId'],
};

export const predictionIdParam = {
  type: 'object',
  properties: { predictionId: { type: 'string' } },
  required: ['predictionId'],
};

export const poolIdQuery = {
  type: 'object',
  properties: { poolId: { type: 'integer' } },
};

export const createUserBody = {
  type: 'object',
  properties: {
    id: { type: 'string' },
    email: { type: 'string' },
    passwordHash: { type: 'string' },
    fullName: { type: 'string' },
    profileImageUrl: { type: 'string' },
  },
  required: ['email', 'passwordHash', 'fullName', 'profileImageUrl'],
};

export const updateUserBody = {
  type: 'object',
  properties: {
    email: { type: 'string' },
    fullName: { type: 'string' },
    profileImageUrl: { type: 'string' },
  },
};

export const updateMatchBody = {
  type: 'object',
  properties: {
    homeTeam: { type: 'integer' },
    awayTeam: { type: 'integer' },
    homeScore: { type: 'integer' },
    awayScore: { type: 'integer' },
    matchDate: { type: 'string' },
    matchStatus: { type: 'string' },
    matchStage: { type: 'string' },
    hasExtraTime: { type: 'boolean' },
    hasPenalties: { type: 'boolean' },
    penaltyHomeScore: { type: 'integer' },
    penaltyAwayScore: { type: 'integer' },
    stadium: { type: 'string' },
  },
};

export const createPredictionBody = {
  type: 'object',
  properties: {
    matchId: { type: 'integer' },
    poolId: { type: 'integer' },
    predictedHomeScore: { type: 'integer' },
    predictedAwayScore: { type: 'integer' },
    predictedHasExtraTime: { type: 'boolean' },
    predictedHasPenalties: { type: 'boolean' },
    predictedPenaltyHomeScore: { type: 'integer' },
    predictedPenaltyAwayScore: { type: 'integer' },
  },
  required: ['matchId', 'poolId', 'predictedHomeScore', 'predictedAwayScore'],
};

export const updatePredictionBody = {
  type: 'object',
  properties: {
    predictedHomeScore: { type: 'integer' },
    predictedAwayScore: { type: 'integer' },
    predictedHasExtraTime: { type: 'boolean' },
    predictedHasPenalties: { type: 'boolean' },
    predictedPenaltyHomeScore: { type: 'integer' },
    predictedPenaltyAwayScore: { type: 'integer' },
  },
};

export const createPoolBody = {
  type: 'object',
  properties: {
    name: { type: 'string' },
    description: { type: 'string' },
    tournamentId: { type: 'integer' },
    isPrivate: { type: 'boolean' },
    maxParticipants: { type: 'integer' },
    inviteCode: { type: 'string' },
    registrationDeadline: { type: 'string', format: 'date-time' },
  },
  required: ['name', 'tournamentId'],
};

export const updatePoolBody = {
  type: 'object',
  properties: {
    name: { type: 'string' },
    description: { type: 'string' },
    isPrivate: { type: 'boolean' },
    maxParticipants: { type: 'integer' },
    inviteCode: { type: 'string' },
    registrationDeadline: { type: 'string', format: 'date-time' },
  },
};

export const poolStandingSchema = {
  type: 'object',
  properties: {
    ranking: { type: 'integer' },
    fullName: { type: 'string' },
    profileImageUrl: { type: 'string', nullable: true },
    userId: { type: 'string' },
    poolId: { type: 'integer' },
    totalPredictions: { type: 'integer' },
    totalPoints: { type: 'integer' },
    exactScoreCount: { type: 'integer' },
    pointsRatio: { type: 'number' },
    guessRatio: { type: 'number' },
    predictionsRatio: { type: 'number' },
  },
  required: [
    'ranking',
    'fullName',
    'userId',
    'poolId',
    'totalPredictions',
    'totalPoints',
    'exactScoreCount',
    'pointsRatio',
    'guessRatio',
    'predictionsRatio',
  ],
};

