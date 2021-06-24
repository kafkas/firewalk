import type { firestore } from 'firebase-admin';
import { BaseTraverser } from '../BaseTraverser';
import type { Traverser } from '../Traverser';
import type {
  Traversable,
  FastTraversalConfig,
  TraversalResult,
  BatchCallbackAsync,
} from '../types';
import { isPositiveInteger } from '../_utils';

function assertPositiveIntegerInConfig(
  num: number | undefined,
  field: keyof FastTraversalConfig
): asserts num {
  if (typeof num === 'number' && !isPositiveInteger(num)) {
    throw new Error(`The '${field}' field in traversal config must be a positive integer.`);
  }
}

function validateFastTraversalConfig(c: Partial<FastTraversalConfig> = {}): void {
  const { maxInMemoryBatchCount } = c;
  assertPositiveIntegerInConfig(maxInMemoryBatchCount, 'maxInMemoryBatchCount');
}

export class FastTraverser<T = firestore.DocumentData>
  extends BaseTraverser<T>
  implements Traverser<T> {
  public constructor(
    public readonly traversable: Traversable<T>,
    config?: Partial<FastTraversalConfig>
  ) {
    super(config);
    validateFastTraversalConfig(config);
    // TODO: Make sure we assign default values to config values that are not in base traverser config
  }

  public withConfig(c: Partial<FastTraversalConfig>): Traverser<T> {
    return new FastTraverser(this.traversable, { ...this.traversalConfig, ...c });
  }

  // TODO: Implement
  public async traverse(callback: BatchCallbackAsync<T>): Promise<TraversalResult> {
    return { batchCount: 0, docCount: 0 };
  }
}
