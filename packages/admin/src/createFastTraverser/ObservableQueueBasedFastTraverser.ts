import type { firestore } from 'firebase-admin';
import { BaseTraverser } from '../abstract/BaseTraverser';
import type { FastTraverser } from '../FastTraverser';
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

export class ObservableQueueBasedFastTraverser<T extends Traversable<D>, D = firestore.DocumentData>
  extends BaseTraverser<FastTraversalConfig, D>
  implements FastTraverser<T, D> {
  public constructor(public readonly traversable: T, config?: Partial<FastTraversalConfig>) {
    super({ ...defaultTraversalConfig, ...config });
    validateConfig(config);
  }

  public withConfig(c: Partial<FastTraversalConfig>): FastTraverser<T, D> {
    return new ObservableQueueBasedFastTraverser(this.traversable, {
      ...this.traversalConfig,
      ...c,
    });
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

    const callbackPromiseQueue = new ObservableQueue<Promise<void>>();
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
          await processQueue();
        }
      },
    });

    const processQueue = async (): Promise<void> => {
      queueState.isProcessing = true;
      const dequeuedPromises = callbackPromiseQueue.extractToArray();
      queueState.hasNewItems = false;
      await Promise.all(dequeuedPromises);
      queueState.isProcessing = false;
    };

    while (true) {
      const { docs: batchDocSnapshots } = await query.get();
      const batchDocCount = batchDocSnapshots.length;

      if (batchDocCount === 0) {
        break;
      }

      const lastDocInBatch = batchDocSnapshots[batchDocCount - 1];

      docCount += batchDocCount;

      callbackPromiseQueue.enqueue(callback(batchDocSnapshots, curBatchIndex));

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
