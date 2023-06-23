export class IllegalArgumentError extends Error {
  public constructor(message: string) {
    super(`Encountered an illegal argument: ${message}`);
  }
}
