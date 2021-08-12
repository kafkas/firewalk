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

/**
 * Computes the duration (in ms) for which to sleep before re-running the queue processing logic.
 *
 * @param traversalConfig - Traversal config.
 * @param queueSize - The current size of the queue.
 * @returns A non-negative integer.
 */
function getProcessQueueInterval(traversalConfig: FastTraversalConfig, queueSize: number): number {
  // TODO: Implement
  return 250;
}

/**
 * Computes the number of queue items to process based on the traversal configuration and queue size.
 *
 * @param traversalConfig - Traversal config.
 * @param queueSize - The current size of the queue.
 * @returns An integer within the range [0, `queueSize`].
 */
function getProcessableItemCount(traversalConfig: FastTraversalConfig, queueSize: number): number {
  // TODO: Implement
  return Math.ceil(queueSize / 2);
}

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
    const { traversalConfig } = this;
    const { maxConcurrentBatchCount } = traversalConfig;

    const callbackPromiseQueue = new PromiseQueue<void>();

    const unregisterQueueProcessor = registerInterval(
      async () => {
        if (!callbackPromiseQueue.isProcessing()) {
          const processableItemCount = getProcessableItemCount(
            traversalConfig,
            callbackPromiseQueue.size
          );
          await callbackPromiseQueue.processFirst(processableItemCount);
        }
      },
      () => getProcessQueueInterval(traversalConfig, callbackPromiseQueue.size)
    );

    const traversalResult = await this.runTraversal((batchDocs, batchIndex) => {
      callbackPromiseQueue.enqueue(callback(batchDocs, batchIndex));
      return async () => {
        while (callbackPromiseQueue.size >= maxConcurrentBatchCount) {
          // TODO: The sleep time is currently set to processQueueInterval but there may be a better way
          // to compute sleep duration.
          const processQueueInterval = getProcessQueueInterval(
            traversalConfig,
            callbackPromiseQueue.size
          );
          await sleep(processQueueInterval);
        }
      };
    });

    await unregisterQueueProcessor();

    // There may still be some Promises left in the queue but there won't be any new ones coming in.
    // Wait for the existing ones to resolve and exit.
    await callbackPromiseQueue.processAll();

    return traversalResult;
  }
}
