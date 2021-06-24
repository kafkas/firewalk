import type { firestore } from 'firebase-admin';
import { BaseTraverser } from './BaseTraverser';
import type { Traverser } from './Traverser';
import type {
  Traversable,
  BaseTraversalConfig,
  TraversalResult,
  BatchCallbackAsync,
} from './types';
import { sleep } from './_utils';

export type DefaultTraversalConfig = BaseTraversalConfig;

/**
 * Creates a traverser object that facilitates Firestore collection traversals. When traversing the collection,
 * this traverser invokes a specified async callback for each batch of document snapshots and waits for the callback
 * Promise to resolve before moving to the next batch.
 */
export function createTraverser<T = firestore.DocumentData>(
  traversable: Traversable<T>,
  config: Partial<DefaultTraversalConfig> = {}
): Traverser<T> {
  class DefaultTraverser extends BaseTraverser<T> implements Traverser<T> {
    public readonly traversable: Traversable<T>;

    public constructor(t: Traversable<T>) {
      super(config);
      this.traversable = t;
    }

    public withConfig(c: Partial<DefaultTraversalConfig>): Traverser<T> {
      return createTraverser(this.traversable, { ...this.traversalConfig, ...c });
    }

    public async traverse(callback: BatchCallbackAsync<T>): Promise<TraversalResult> {
      const {
        batchSize,
        sleepBetweenBatches,
        sleepTimeBetweenBatches,
        maxDocCount,
      } = this.traversalConfig;

      let batchIndex = 0;
      let docCount = 0;
      let query = this.traversable.limit(Math.min(batchSize, maxDocCount));

      while (true) {
        const { docs: batchDocSnapshots } = await query.get();
        const batchDocCount = batchDocSnapshots.length;

        if (batchDocCount === 0) {
          break;
        }

        const lastDocInBatch = batchDocSnapshots[batchDocCount - 1];

        docCount += batchDocCount;

        this.registeredCallbacks.onBeforeBatchStart?.(batchDocSnapshots, batchIndex);

        await callback(batchDocSnapshots, batchIndex);

        this.registeredCallbacks.onAfterBatchComplete?.(batchDocSnapshots, batchIndex);

        if (docCount === maxDocCount) {
          break;
        }

        query = query.startAfter(lastDocInBatch).limit(Math.min(batchSize, maxDocCount - docCount));
        batchIndex++;

        if (sleepBetweenBatches) {
          await sleep(sleepTimeBetweenBatches);
        }
      }

      return { batchCount: batchIndex, docCount };
    }
  }

  return new DefaultTraverser(traversable);
}
