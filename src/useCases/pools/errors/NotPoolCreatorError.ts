export class NotPoolCreatorError extends Error {
  constructor(info: string) {
    super(`Not pool creator: ${info}`);
    this.name = 'NotPoolCreatorError';
    Object.setPrototypeOf(this, NotPoolCreatorError.prototype);
  }
}
