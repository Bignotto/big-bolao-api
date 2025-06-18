export class AuthorizationError extends Error {
  constructor(info: string) {
    super(`Not allowed: ${info}`);
    this.name = 'AuthorizationError';
    Object.setPrototypeOf(this, AuthorizationError.prototype);
  }
}
