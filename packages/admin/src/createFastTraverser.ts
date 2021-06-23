import type { firestore } from 'firebase-admin';
import type { Traverser } from './Traverser';
import type {
  Traversable,
  TraversalConfig,
  TraverseEachConfig,
  TraversalResult,
  BatchCallback,
  BatchCallbackAsync,
} from './types';
import { isPositiveInteger } from './_utils';

const defaultTraversalConfig: TraversalConfig = {
  batchSize: 100,
  sleepBetweenBatches: true,
  sleepTimeBetweenBatches: 1_000,
  maxDocCount: Infinity,
};

const defaultTraverseEachConfig: TraverseEachConfig = {
  sleepBetweenDocs: false,
  sleepTimeBetweenDocs: 500,
};

function assertPositiveIntegerInConfig(
  num: number | undefined,
  field: keyof TraversalConfig
): asserts num {
  if (typeof num === 'number' && !isPositiveInteger(num)) {
    throw new Error(`The '${field}' field in traversal config must be a positive integer.`);
  }
}

function validateTraversalConfig(c: Partial<TraversalConfig> = {}): void {
  const { batchSize, sleepTimeBetweenBatches, maxDocCount } = c;

  assertPositiveIntegerInConfig(batchSize, 'batchSize');
  assertPositiveIntegerInConfig(sleepTimeBetweenBatches, 'sleepTimeBetweenBatches');
  if (maxDocCount !== Infinity) {
    assertPositiveIntegerInConfig(maxDocCount, 'maxDocCount');
  }
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
  config: Partial<TraversalConfig> = {}
): Traverser<T> {
  validateTraversalConfig(config);

  class FastTraverser implements Traverser<T> {
    private traversalConfig: TraversalConfig = { ...defaultTraversalConfig, ...config };
    private registeredCallbacks: {
      onBeforeBatchStart?: BatchCallback<T>;
      onAfterBatchComplete?: BatchCallback<T>;
    } = {};

    public withConfig(c: Partial<TraversalConfig>): Traverser<T> {
      validateTraversalConfig(c);
      return createFastTraverser(traversable, { ...this.traversalConfig, ...c });
    }

    public onBeforeBatchStart(callback: BatchCallback<T>): void {
      this.registeredCallbacks.onBeforeBatchStart = callback;
    }

    public onAfterBatchComplete(callback: BatchCallback<T>): void {
      this.registeredCallbacks.onAfterBatchComplete = callback;
    }

    // TODO: Implement
    public async traverseEach(
      callback: (snapshot: firestore.QueryDocumentSnapshot<T>) => Promise<void>,
      c: Partial<TraverseEachConfig> = {}
    ): Promise<TraversalResult> {
      return { batchCount: 0, docCount: 0 };
    }

    // TODO: Implement
    public async traverse(callback: BatchCallbackAsync<T>): Promise<TraversalResult> {
      return { batchCount: 0, docCount: 0 };
    }
  }

  return new FastTraverser();
}
