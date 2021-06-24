import type { firestore } from 'firebase-admin';
import { BaseTraverser } from '../BaseTraverser';
import type { Traverser } from '../Traverser';
import type {
  Traversable,
  FastTraversalConfig,
  TraversalResult,
  BatchCallbackAsync,
} from '../types';
import { sleep, ObservableQueue } from '../utils';
import { validateConfig } from './validateConfig';

const defaultTraversalConfig: FastTraversalConfig = {
  ...BaseTraverser.getDefaultConfig(),
  maxInMemoryBatchCount: 10,
};

export class FastTraverser<D = firestore.DocumentData>
  extends BaseTraverser<FastTraversalConfig, D>
  implements Traverser<D> {
  public constructor(
    public readonly traversable: Traversable<D>,
    config?: Partial<FastTraversalConfig>
  ) {
    super({ ...defaultTraversalConfig, ...config });
    validateConfig(config);
  }

  public withConfig(c: Partial<FastTraversalConfig>): Traverser<D> {
    return new FastTraverser(this.traversable, { ...this.traversalConfig, ...c });
  }

  public async traverse(callback: BatchCallbackAsync<D>): Promise<TraversalResult> {
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
      batchDocs: firestore.QueryDocumentSnapshot<D>[];
      batchIndex: number;
      promise: Promise<void>;
    };

    const callbackPromiseQueue = new ObservableQueue<QueueItem>();
    const queueState = {
      isProcessing: false,
      hasNewItems: false,
    };

    const unregisterEnqueueObserver = callbackPromiseQueue.registerEnqueueObserver({
      receiveUpdate: async () => {
        queueState.hasNewItems = true;
        if (queueState.isProcessing) {
          return;
        }
        while (queueState.hasNewItems) {
          queueState.isProcessing = true;
          await processQueue();
          queueState.isProcessing = false;
        }
      },
    });

    const processQueue = async (): Promise<void> => {
      // Clear resolved promises
      const dequeuedItems: QueueItem[] = [];

      while (!callbackPromiseQueue.isEmpty()) {
        dequeuedItems.push(callbackPromiseQueue.dequeue());
      }
      queueState.hasNewItems = false;

      await Promise.all(
        dequeuedItems.map(async ({ promise, batchDocs, batchIndex }) => {
          await promise;
          this.registeredCallbacks.onAfterBatchComplete?.(batchDocs, batchIndex);
        })
      );
    };

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
        let unregisterDequeueObserver = (): void => {};
        const dequeuePromise = new Promise<void>((res) => {
          unregisterDequeueObserver = callbackPromiseQueue.registerDequeueObserver({
            receiveUpdate: () => res(),
          });
        });
        await dequeuePromise;
        unregisterDequeueObserver();
      }

      if (sleepBetweenBatches) {
        await sleep(sleepTimeBetweenBatches);
      }

      query = query.startAfter(lastDocInBatch).limit(Math.min(batchSize, maxDocCount - docCount));
      curBatchIndex++;
    }

    unregisterEnqueueObserver();

    // There may still be some Promises left in the queue but there won't be any new items coming in.
    // Wait for the existing ones to resolve and exit.

    await processQueue();

    return { batchCount: curBatchIndex, docCount };
  }
}
