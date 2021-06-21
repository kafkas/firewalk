import type { firestore } from 'firebase-admin';
import type { CollectionTraverser, BatchCallback } from './CollectionTraverser';
import type { Traversable, TraversalConfig, TraverseEachConfig, TraversalResult } from './types';
import { sleep, isPositiveInteger } from './_utils';

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
  assertPositiveIntegerInConfig(maxDocCount, 'maxDocCount');
}

/**
 * Creates a traverser object that facilitates Firestore collection traversals.
 */
export function createTraverser<T = firestore.DocumentData>(
  traversable: Traversable<T>,
  config: Partial<TraversalConfig> = {}
): CollectionTraverser<T> {
  validateTraversalConfig(config);

  class DefaultCollectionTraverser implements CollectionTraverser<T> {
    private traversalConfig: TraversalConfig = { ...defaultTraversalConfig, ...config };
    private registeredCallbacks: {
      onBeforeBatchStart?: BatchCallback<T>;
      onAfterBatchComplete?: BatchCallback<T>;
    } = {};

    public setConfig(c: Partial<TraversalConfig>): CollectionTraverser<T> {
      validateTraversalConfig(c);
      this.traversalConfig = { ...this.traversalConfig, ...c };
      return this;
    }

    public onBeforeBatchStart(callback: BatchCallback<T>): void {
      this.registeredCallbacks.onBeforeBatchStart = callback;
    }

    public onAfterBatchComplete(callback: BatchCallback<T>): void {
      this.registeredCallbacks.onAfterBatchComplete = callback;
    }

    public async traverseEach(
      callback: (snapshot: firestore.QueryDocumentSnapshot<T>) => Promise<void>,
      c: Partial<TraverseEachConfig> = {}
    ): Promise<TraversalResult> {
      const { sleepBetweenDocs, sleepTimeBetweenDocs } = {
        ...defaultTraverseEachConfig,
        ...c,
      };

      const { batchCount, docCount } = await this.traverse(async (docSnapshots) => {
        for (let i = 0; i < docSnapshots.length; i++) {
          await callback(docSnapshots[i]);
          if (sleepBetweenDocs) {
            await sleep(sleepTimeBetweenDocs);
          }
        }
      });

      return { batchCount, docCount };
    }

    public async traverse(
      callback: (batchSnapshots: firestore.QueryDocumentSnapshot<T>[]) => Promise<void>
    ): Promise<TraversalResult> {
      const {
        batchSize,
        sleepBetweenBatches,
        sleepTimeBetweenBatches,
        maxDocCount,
      } = this.traversalConfig;

      let batchCount = 0;
      let docCount = 0;
      let query = traversable.limit(Math.min(batchSize, maxDocCount));

      while (true) {
        const { docs: batchDocSnapshots } = await query.get();
        const batchDocCount = batchDocSnapshots.length;

        if (batchDocCount === 0) {
          break;
        }

        const batchIndex = batchCount + 1;
        const lastDocInBatch = batchDocSnapshots[batchDocCount - 1];

        batchCount++;
        docCount += batchDocCount;

        this.registeredCallbacks.onBeforeBatchStart?.(batchDocSnapshots, batchIndex);

        await callback(batchDocSnapshots);

        this.registeredCallbacks.onAfterBatchComplete?.(batchDocSnapshots, batchIndex);

        if (docCount === maxDocCount) {
          break;
        }

        query = query.startAfter(lastDocInBatch).limit(Math.min(batchSize, maxDocCount - docCount));

        if (sleepBetweenBatches) {
          await sleep(sleepTimeBetweenBatches);
        }
      }

      return { batchCount, docCount };
    }
  }

  return new DefaultCollectionTraverser();
}
