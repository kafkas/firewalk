/**
 * An error thrown when an invalid configuration is provided.
 */
export class InvalidConfigError extends Error {
  constructor(message: string) {
    super(`Invalid config: ${message}`);
  }
}
