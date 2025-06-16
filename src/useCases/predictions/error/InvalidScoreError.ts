export class InvalidScoreError extends Error {
  constructor(info: string) {
    super(`Score is invalid: ${info}`);
    this.name = 'InvalidScoreError';
    Object.setPrototypeOf(this, InvalidScoreError.prototype);
  }
}
