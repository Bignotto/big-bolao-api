export class MatchUpdateError extends Error {
  constructor(message: string = 'Error updating match') {
    super(`Match update error: ${message}`);
    this.name = 'MatchUpdateError';
    Object.setPrototypeOf(this, MatchUpdateError.prototype);
  }
}
