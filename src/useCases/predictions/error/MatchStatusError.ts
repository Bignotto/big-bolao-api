export class MatchStatusError extends Error {
  constructor(info: string) {
    super(`Invalid Match Status: ${info}`);
    this.name = 'MatchStatusError';
    Object.setPrototypeOf(this, MatchStatusError.prototype);
  }
}
