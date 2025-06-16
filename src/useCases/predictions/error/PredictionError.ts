export class PredictionError extends Error {
  constructor(info: string) {
    super(`Prediction error:${info}`);
    this.name = 'PredictionError';
    Object.setPrototypeOf(this, PredictionError.prototype);
  }
}
