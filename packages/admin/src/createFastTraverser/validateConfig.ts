import type { FastTraversalConfig } from '../types';
import { isPositiveInteger } from '../utils';

function assertPositiveIntegerInConfig(
  num: number | undefined,
  field: keyof FastTraversalConfig
): asserts num {
  if (typeof num === 'number' && !isPositiveInteger(num)) {
    throw new Error(`The '${field}' field in traversal config must be a positive integer.`);
  }
}

export function validateConfig(c: Partial<FastTraversalConfig> = {}): void {
  const { maxInMemoryBatchCount } = c;
  assertPositiveIntegerInConfig(maxInMemoryBatchCount, 'maxInMemoryBatchCount');
}
