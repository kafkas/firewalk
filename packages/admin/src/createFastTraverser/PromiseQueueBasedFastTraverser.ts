import type { firestore } from 'firebase-admin';
import { BaseTraverser } from '../abstract/BaseTraverser';
import type { FastTraverser } from '../FastTraverser';
import type {
  Traversable,
  FastTraversalConfig,
  TraversalResult,
  BatchCallbackAsync,
} from '../types';
import { sleep, PromiseQueue, registerInterval } from '../utils';
import { validateConfig } from './validateConfig';

const defaultTraversalConfig: FastTraversalConfig = {
  ...BaseTraverser.getDefaultConfig(),
  maxInMemoryBatchCount: 10,
};

const QUEUE_PROCESS_INTERVAL = 100;

export class PromiseQueueBasedFastTraverser<T extends Traversable<D>, D = firestore.DocumentData>
  extends BaseTraverser<FastTraversalConfig, D>
  implements FastTraverser<T, D> {
  public constructor(public readonly traversable: T, config?: Partial<FastTraversalConfig>) {
    super({ ...defaultTraversalConfig, ...config });
    validateConfig(config);
  }

  public withConfig(c: Partial<FastTraversalConfig>): FastTraverser<T, D> {
    return new PromiseQueueBasedFastTraverser(this.traversable, {
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

    const callbackPromiseQueue = new PromiseQueue<void>();

    const unregisterQueueProcessor = registerInterval(async () => {
      if (!callbackPromiseQueue.isProcessing()) {
        await callbackPromiseQueue.process();
      }
    }, QUEUE_PROCESS_INTERVAL);

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

      while (callbackPromiseQueue.size >= maxInMemoryBatchCount) {
        await sleep(QUEUE_PROCESS_INTERVAL);
      }

      if (sleepBetweenBatches) {
        await sleep(sleepTimeBetweenBatches);
      }

      query = query.startAfter(lastDocInBatch).limit(Math.min(batchSize, maxDocCount - docCount));
      curBatchIndex++;
    }

    unregisterQueueProcessor();

    // There may still be some Promises left in the queue but there won't be any new items coming in.
    // Wait for the existing ones to resolve and exit.

    await callbackPromiseQueue.process();

    return { batchCount: curBatchIndex, docCount };
  }
}
