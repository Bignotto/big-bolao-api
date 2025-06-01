export class PoolNameInUseError extends Error {
  constructor(info?: string) {
    super(`Pool name is already in use. ${info || ''}`);
    this.name = 'PoolNameInUseError';
    Object.setPrototypeOf(this, PoolNameInUseError.prototype);
  }
}
