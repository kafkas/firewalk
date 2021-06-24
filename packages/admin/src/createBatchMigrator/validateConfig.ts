import type { BaseTraversalConfig } from '../types';
import { isPositiveInteger } from '../_utils';

const MAX_BATCH_WRITE_DOC_COUNT = 500;

export function validateConfig(c: Partial<BaseTraversalConfig> = {}): void {
  const { batchSize } = c;

  if (
    typeof batchSize === 'number' &&
    (!isPositiveInteger(batchSize) || batchSize > MAX_BATCH_WRITE_DOC_COUNT)
  ) {
    throw new Error(
      `The 'batchSize' field in traversal config for a batch migrator must be a positive integer less than or equal to ${MAX_BATCH_WRITE_DOC_COUNT}. In Firestore, each transaction or write batch can write to a maximum of ${MAX_BATCH_WRITE_DOC_COUNT} documents.`
    );
  }
}
