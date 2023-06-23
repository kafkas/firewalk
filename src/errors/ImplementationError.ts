/**
 * An error thrown when a piece of code is found to be incorrectly implemented. If the maintainers of the
 * library have done everything right, this error should never be encountered.
 */
export class ImplementationError extends Error {
  constructor(message: string) {
    super(`Implementation Error: ${message}`);
  }
}
