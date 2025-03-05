export class EmailInUseError extends Error {
  constructor(info?: string | undefined) {
    super(`Email already in use. ${info}`);
    this.name = 'EmailInUseError';
    Object.setPrototypeOf(this, EmailInUseError.prototype);
  }
}
