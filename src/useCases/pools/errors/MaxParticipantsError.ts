export class MaxParticipantsError extends Error {
  constructor(info: string) {
    super(`Pool has reached maximum number of participants: ${info}`);
    this.name = 'MaxParticipantsError';
    Object.setPrototypeOf(this, MaxParticipantsError.prototype);
  }
}
