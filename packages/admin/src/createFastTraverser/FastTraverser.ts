import type { firestore } from 'firebase-admin';
import { Traverser } from '../Traverser';
import type {
  Traversable,
  FastTraversalConfig,
  TraversalResult,
  BatchCallbackAsync,
} from '../types';
import { sleep, PromiseQueue, registerInterval, isPositiveInteger } from '../utils';

// TODO: This should probably be a function of traversal config
const PROCESS_QUEUE_INTERVAL = 250;

/**
 * A fast traverser object that facilitates Firestore collection traversals.
 */
export class FastTraverser<D extends firestore.DocumentData> extends Traverser<
  D,
  FastTraversalConfig
> {
  private static readonly defaultConfig: FastTraversalConfig = {
    ...Traverser.baseConfig,
    maxConcurrentBatchCount: 10,
  };

  public constructor(
    public readonly traversable: Traversable<D>,
    config?: Partial<FastTraversalConfig>
  ) {
    super({ ...FastTraverser.defaultConfig, ...config });
    this.validateConfig(config);
  }

  private validateConfig(c: Partial<FastTraversalConfig> = {}): void {
    const { maxConcurrentBatchCount } = c;
    this.assertPositiveIntegerInConfig(maxConcurrentBatchCount, 'maxConcurrentBatchCount');
  }

  private assertPositiveIntegerInConfig(
    num: number | undefined,
    field: keyof FastTraversalConfig
  ): asserts num {
    if (typeof num === 'number' && !isPositiveInteger(num)) {
      throw new Error(`The '${field}' field in traversal config must be a positive integer.`);
    }
  }

  /**
   * Applies a the specified config values to the traverser.
   *
   * @param config Partial traversal configuration.
   * @returns A new FastTraverser object.
   */
  public withConfig(c: Partial<FastTraversalConfig>): FastTraverser<D> {
    return new FastTraverser(this.traversable, {
      ...this.traversalConfig,
      ...c,
    });
  }

  /**
   * Traverses the entire collection in batches of the size specified in traversal config. Invokes the specified async
   * callback for each batch of document snapshots and immediately moves to the next batch. Does not wait for the callback
   * Promise to resolve before moving to the next batch so there is no guarantee that any given batch will finish processing
   * before a later batch.
   *
   * **Properties:**
   *
   * - Time complexity: _O_(_C_ + (_N_ / `batchSize`) * _Q_(`batchSize`))
   * - Space complexity: _O_(`maxConcurrentBatchCount` * (`batchSize` * _D_ + _S_))
   * - Billing: _max_(1, _N_) reads
   *
   * where:
   *
   * - _N_: number of docs in the traversable
   * - _Q_(`batchSize`): average batch query time
   * - _C_: average callback processing time
   * - _D_: document size
   * - _S_: average extra space used by the callback
   *
   * @param callback An asynchronous callback function to invoke for each batch of document snapshots.
   * @returns A Promise resolving to an object representing the details of the traversal.
   */
  public async traverse(callback: BatchCallbackAsync<D>): Promise<TraversalResult> {
    const {
      batchSize,
      sleepBetweenBatches,
      sleepTimeBetweenBatches,
      maxDocCount,
      maxConcurrentBatchCount,
    } = this.traversalConfig;

    let curBatchIndex = 0;
    let docCount = 0;
    let query = this.traversable.limit(Math.min(batchSize, maxDocCount));

    const callbackPromiseQueue = new PromiseQueue<void>();

    const unregisterQueueProcessor = registerInterval(async () => {
      if (!callbackPromiseQueue.isProcessing()) {
        await callbackPromiseQueue.process();
      }
    }, PROCESS_QUEUE_INTERVAL);

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

      while (callbackPromiseQueue.size >= maxConcurrentBatchCount) {
        await sleep(PROCESS_QUEUE_INTERVAL);
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
