export class InviteCodeRequiredError extends Error {
  constructor() {
    super('Invite code is required for private pools');
    this.name = 'InviteCodeRequiredError';
    Object.setPrototypeOf(this, InviteCodeRequiredError.prototype);
  }
}
