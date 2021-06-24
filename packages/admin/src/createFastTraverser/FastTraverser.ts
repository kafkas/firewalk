import type { firestore } from 'firebase-admin';
import { BaseTraverser } from '../BaseTraverser';
import type { Traverser } from '../Traverser';
import type {
  Traversable,
  FastTraversalConfig,
  TraversalResult,
  BatchCallbackAsync,
} from '../types';
import { SLLQueue, sleep } from '../utils';
import { validateConfig } from './validateConfig';

const defaultTraversalConfig: FastTraversalConfig = {
  ...BaseTraverser.getDefaultConfig(),
  maxInMemoryBatchCount: 10,
};

export class FastTraverser<T = firestore.DocumentData>
  extends BaseTraverser<FastTraversalConfig, T>
  implements Traverser<T> {
  public constructor(
    public readonly traversable: Traversable<T>,
    config?: Partial<FastTraversalConfig>
  ) {
    super({ ...defaultTraversalConfig, ...config });
    validateConfig(config);
  }

  public withConfig(c: Partial<FastTraversalConfig>): Traverser<T> {
    return new FastTraverser(this.traversable, { ...this.traversalConfig, ...c });
  }

  public async traverse(callback: BatchCallbackAsync<T>): Promise<TraversalResult> {
    const {
      batchSize,
      sleepBetweenBatches,
      sleepTimeBetweenBatches,
      maxDocCount,
      maxInMemoryBatchCount,
    } = this.traversalConfig;

    let curBatchIndex = 0;
    let docCount = 0;
    let query = this.traversable.limit(Math.min(batchSize, maxDocCount));

    type QueueItem = {
      batchDocs: firestore.QueryDocumentSnapshot<T>[];
      batchIndex: number;
      promise: Promise<void>;
    };

    const callbackPromiseQueue = new SLLQueue<QueueItem>();

    const processQueue = async (): Promise<void> => {
      // Clear resolved promises
      const dequeuedItems: QueueItem[] = [];

      while (!callbackPromiseQueue.isEmpty()) {
        dequeuedItems.push(callbackPromiseQueue.dequeue());
      }

      await Promise.all(
        dequeuedItems.map(async ({ promise, batchDocs, batchIndex }) => {
          await promise;
          this.registeredCallbacks.onAfterBatchComplete?.(batchDocs, batchIndex);
        })
      );
    };

    const attachObserverTo = <T>(func: (item: T) => void, callback: () => Promise<void>): void => {
      // TODO: Implement
    };

    let isProcessingQueue = false;
    attachObserverTo(callbackPromiseQueue.enqueue, async () => {
      if (isProcessingQueue) {
        return;
      }
      isProcessingQueue = true;
      await processQueue();
      isProcessingQueue = false;
    });

    while (true) {
      const { docs: batchDocSnapshots } = await query.get();
      const batchDocCount = batchDocSnapshots.length;

      if (batchDocCount === 0) {
        break;
      }

      const lastDocInBatch = batchDocSnapshots[batchDocCount - 1];

      docCount += batchDocCount;

      this.registeredCallbacks.onBeforeBatchStart?.(batchDocSnapshots, curBatchIndex);
      callbackPromiseQueue.enqueue({
        batchDocs: batchDocSnapshots,
        batchIndex: curBatchIndex,
        promise: callback(batchDocSnapshots, curBatchIndex),
      });

      if (docCount === maxDocCount) {
        break;
      }

      while (callbackPromiseQueue.size > maxInMemoryBatchCount) {
        // The queue is getting too large. Wait until its emptied a little.
        // TODO: This needs to be done differently. Likely with some kind of an observable.
        attachObserverTo(callbackPromiseQueue.dequeue, async () => {
          //
        });
        await sleep(500);
      }

      if (sleepBetweenBatches) {
        await sleep(sleepTimeBetweenBatches);
      }

      query = query.startAfter(lastDocInBatch).limit(Math.min(batchSize, maxDocCount - docCount));
      curBatchIndex++;
    }

    // There may still be some Promises left in the queue but there won't be any new items coming in.
    // Wait for the existing ones to resolve and exit.

    await processQueue();

    return { batchCount: curBatchIndex, docCount };
  }
}
