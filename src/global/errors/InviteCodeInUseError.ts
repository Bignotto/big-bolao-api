export class InviteCodeInUseError extends Error {
  constructor(info?: string) {
    super(`Invite code already in use: ${info || ''}`);
    this.name = 'InviteCodeInUseError';
    Object.setPrototypeOf(this, InviteCodeInUseError.prototype);
  }
}
