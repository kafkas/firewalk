class AssertionError extends Error {
  public constructor(message: string) {
    super(`Assertion Error: ${message}`);
  }
}

export function assert(condition: unknown, message?: string): asserts condition {
  if (!condition) {
    throw new AssertionError(message ?? 'Assertion failed.');
  }
}

export function assertNever(val: never): never {
  throw new AssertionError(`Invalid value: ${JSON.stringify(val)}`);
}

export function assertDefined<T>(
  condition: T | undefined,
  identifier: string
): asserts condition is T {
  if (condition === undefined) {
    throw new AssertionError(`Expected '${identifier}' to be defined but got undefined.`);
  }
}

export function assertNonNull<T>(val: T | null, identifier: string): asserts val is T {
  assert(val !== null, `Expected '${identifier}' to be non-null but got null.`);
}

export function assertString(val: unknown, identifier: string): asserts val is string {
  assert(typeof val === 'string', `Expected '${identifier}' to be a string but got ${typeof val}.`);
}

export function assertNull<T>(val: T | null, identifier: string): asserts val is null {
  assert(
    val === null,
    `Expected '${identifier}' to be null but got ${val === null ? 'null' : typeof val}.`
  );
}
