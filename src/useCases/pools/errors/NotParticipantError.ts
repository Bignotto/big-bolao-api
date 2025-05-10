export class NotParticipantError extends Error {
  constructor(info: string) {
    super(`Not participant: ${info}`);
    this.name = 'NotParticipantError';
    Object.setPrototypeOf(this, NotParticipantError.prototype);
  }
}
