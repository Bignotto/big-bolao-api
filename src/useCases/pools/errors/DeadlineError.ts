export class DeadlineError extends Error {
  constructor(info: string) {
    super(`'Registration deadline has passed': ${info}`);
    this.name = 'DeadlineError';
    Object.setPrototypeOf(this, DeadlineError.prototype);
  }
}
