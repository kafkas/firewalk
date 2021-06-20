import type { firestore } from 'firebase-admin';
import type { CollectionTraverser } from './CollectionTraverser';
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

    public setConfig(c: Partial<TraversalConfig>): CollectionTraverser<T> {
      validateTraversalConfig(c);
      this.traversalConfig = { ...this.traversalConfig, ...c };
      return this;
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

        if (batchDocSnapshots.length === 0) {
          break;
        }

        batchCount++;
        docCount += batchDocSnapshots.length;

        await callback(batchDocSnapshots);

        if (docCount === maxDocCount) {
          break;
        }

        const lastDocInBatch = batchDocSnapshots[batchDocSnapshots.length - 1];
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
