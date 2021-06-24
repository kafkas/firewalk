import type { firestore } from 'firebase-admin';
import { BaseTraverser } from './BaseTraverser';
import type { Traverser } from './Traverser';
import type {
  Traversable,
  BaseTraversalConfig,
  TraversalResult,
  BatchCallbackAsync,
} from './types';
import { isPositiveInteger } from './_utils';

interface FastTraversalConfig extends BaseTraversalConfig {
  maxInMemoryBatchCount: number;
}

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

/**
 * Creates a fast traverser object that facilitates Firestore collection traversals. When traversing
 * the collection, this traverser invokes a specified async callback for each batch of document
 * snapshots and immediately moves to the next batch. It does not wait for the callback Promise to resolve
 * before moving to the next batch so there is no guarantee that any given batch will finish processing
 * before a later batch. This traverser uses more memory but is significantly faster than the default traverser.
 */
export function createFastTraverser<T = firestore.DocumentData>(
  traversable: Traversable<T>,
  config: Partial<FastTraversalConfig> = {}
): Traverser<T> {
  validateFastTraversalConfig(config);

  class FastTraverser extends BaseTraverser<T> implements Traverser<T> {
    public readonly traversable: Traversable<T>;

    public constructor(t: Traversable<T>) {
      super(config);
      this.traversable = t;
    }

    public withConfig(c: Partial<FastTraversalConfig>): Traverser<T> {
      return createFastTraverser(this.traversable, { ...this.traversalConfig, ...c });
    }

    // TODO: Implement
    public async traverse(callback: BatchCallbackAsync<T>): Promise<TraversalResult> {
      return { batchCount: 0, docCount: 0 };
    }
  }

  return new FastTraverser(traversable);
}
