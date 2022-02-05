export class InvalidConfigError extends Error {
  constructor(message: string) {
    super(`Invalid config: ${message}`);
  }
}
