export class UnauthorizedError extends Error {
  constructor(info: string) {
    super(`Unauthorized: ${info}`);
    this.name = 'UnauthorizedError';
    Object.setPrototypeOf(this, UnauthorizedError.prototype);
  }
}
