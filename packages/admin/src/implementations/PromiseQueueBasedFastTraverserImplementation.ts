import { sleep, PromiseQueue, registerInterval, isPositiveInteger } from '../utils';
import type {
  BatchCallbackAsync,
  ExitEarlyPredicate,
  FastTraversalConfig,
  FastTraverser,
  Traversable,
  TraversalResult,
} from '../api';
import { AbstractTraverser } from './abstract';

// TODO: This should probably be a function of traversal config
const PROCESS_QUEUE_INTERVAL = 250;

export class PromiseQueueBasedFastTraverserImplementation<D>
  extends AbstractTraverser<FastTraversalConfig, D>
  implements FastTraverser<D> {
  private static readonly defaultConfig: FastTraversalConfig = {
    ...AbstractTraverser.baseConfig,
    maxConcurrentBatchCount: 10,
  };

  public constructor(
    public readonly traversable: Traversable<D>,
    exitEarlyPredicates: ExitEarlyPredicate<D>[] = [],
    config?: Partial<FastTraversalConfig>
  ) {
    super(
      { ...PromiseQueueBasedFastTraverserImplementation.defaultConfig, ...config },
      exitEarlyPredicates
    );
    this.validateConfig(config);
  }

  private validateConfig(config: Partial<FastTraversalConfig> = {}): void {
    const { maxConcurrentBatchCount } = config;
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

  public withConfig(config: Partial<FastTraversalConfig>): FastTraverser<D> {
    return new PromiseQueueBasedFastTraverserImplementation(
      this.traversable,
      this.exitEarlyPredicates,
      {
        ...this.traversalConfig,
        ...config,
      }
    );
  }

  public withExitEarlyPredicate(predicate: ExitEarlyPredicate<D>): FastTraverser<D> {
    return new PromiseQueueBasedFastTraverserImplementation(
      this.traversable,
      [...this.exitEarlyPredicates, predicate],
      this.traversalConfig
    );
  }

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
      const { docs: batchDocs } = await query.get();
      const batchDocCount = batchDocs.length;

      if (batchDocCount === 0) {
        break;
      }

      const lastDocInBatch = batchDocs[batchDocCount - 1];

      docCount += batchDocCount;

      callbackPromiseQueue.enqueue(callback(batchDocs, curBatchIndex));

      if (this.shouldExitEarly(batchDocs, curBatchIndex) || docCount === maxDocCount) {
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

    await unregisterQueueProcessor();

    // There may still be some Promises left in the queue but there won't be any new ones coming in.
    // Wait for the existing ones to resolve and exit.

    await callbackPromiseQueue.process();

    return { batchCount: curBatchIndex, docCount };
  }
}
