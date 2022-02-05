export class ImplementationError extends Error {
  constructor(message: string) {
    super(`Implementation Error: ${message}`);
  }
}
