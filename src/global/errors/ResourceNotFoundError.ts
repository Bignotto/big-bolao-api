export class ResourceNotFoundError extends Error {
  constructor(info: string) {
    super(`Resource not found: ${info}`);
    this.name = 'ResourceNotFoundError';
    Object.setPrototypeOf(this, ResourceNotFoundError.prototype);
  }
}
