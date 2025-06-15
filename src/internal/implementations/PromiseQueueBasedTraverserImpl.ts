import type { firestore } from 'firebase-admin';
import type {
  BatchCallback,
  ExitEarlyPredicate,
  Traversable,
  TraversalConfig,
  TraversalResult,
  Traverser,
} from '../../api';
import { ImplementationError } from '../../errors';
import { IllegalArgumentError } from '../errors';
import { PromiseQueue } from '../ds';
import { makeRetriable, registerInterval, sleep } from '../utils';
import { AbstractTraverser } from './abstract';

export class PromiseQueueBasedTraverserImpl<
    AppModelType = firestore.DocumentData,
    DbModelType extends firestore.DocumentData = firestore.DocumentData
  >
  extends AbstractTraverser<AppModelType, DbModelType>
  implements Traverser<AppModelType, DbModelType>
{
  static readonly #defaultConfig: TraversalConfig = {
    ...AbstractTraverser.baseConfig,
  };

  public constructor(
    public readonly traversable: Traversable<AppModelType, DbModelType>,
    exitEarlyPredicates: ExitEarlyPredicate<AppModelType, DbModelType>[] = [],
    config?: Partial<TraversalConfig>
  ) {
    super({ ...PromiseQueueBasedTraverserImpl.#defaultConfig, ...config }, exitEarlyPredicates);
  }

  public withConfig(config: Partial<TraversalConfig>): Traverser<AppModelType, DbModelType> {
    return new PromiseQueueBasedTraverserImpl(this.traversable, this.exitEarlyPredicates, {
      ...this.traversalConfig,
      ...config,
    });
  }

  public withExitEarlyPredicate(
    predicate: ExitEarlyPredicate<AppModelType, DbModelType>
  ): Traverser<AppModelType, DbModelType> {
    return new PromiseQueueBasedTraverserImpl(
      this.traversable,
      [...this.exitEarlyPredicates, predicate],
      this.traversalConfig
    );
  }

  public async traverse(
    callback: BatchCallback<AppModelType, DbModelType>
  ): Promise<TraversalResult> {
    const { traversalConfig } = this;
    const { maxConcurrentBatchCount } = traversalConfig;
    callback = this.#makeRetriableAccordingToConfig(callback);
    if (maxConcurrentBatchCount === 1) {
      return this.runTraversal(async (batchDocs, batchIndex) => {
        await callback(batchDocs, batchIndex);
      });
    }
    const callbackPromiseQueue = new PromiseQueue<void>();
    const unregisterQueueProcessor = registerInterval(
      async () => {
        if (!callbackPromiseQueue.isProcessing) {
          const processableItemCount = this.#getProcessableItemCount(callbackPromiseQueue.size);
          try {
            await callbackPromiseQueue.processFirst(processableItemCount);
          } catch (err) {
            throw err instanceof IllegalArgumentError
              ? new ImplementationError(
                  `Encountered an expected error originating from an incorrectly implemented PromiseQueue data structure.`
                )
              : err;
          }
        }
      },
      () => this.#getProcessQueueInterval(callbackPromiseQueue.size)
    );
    const traversalResult = await this.runTraversal((batchDocs, batchIndex) => {
      callbackPromiseQueue.enqueue(callback(batchDocs, batchIndex) ?? Promise.resolve());
      return async () => {
        while (callbackPromiseQueue.size >= maxConcurrentBatchCount) {
          // TODO: There probably is a better way to compute sleep duration
          const processQueueInterval = this.#getProcessQueueInterval(callbackPromiseQueue.size);
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

  #makeRetriableAccordingToConfig(
    callback: BatchCallback<AppModelType, DbModelType>
  ): BatchCallback<AppModelType, DbModelType> {
    const { maxBatchRetryCount, sleepTimeBetweenTrials } = this.traversalConfig;
    let cb = callback;
    if (maxBatchRetryCount > 0) {
      const retriableCallback = makeRetriable(callback, {
        maxTrialCount: 1 + maxBatchRetryCount,
        sleepTimeBetweenTrials,
        returnErrors: true,
      });
      cb = async (...args) => {
        const result = await retriableCallback(...args);
        if (!result.hasSucceeded) {
          const { errors } = result;
          const lastError = errors[errors.length - 1];
          throw lastError;
        }
      };
    }
    return cb;
  }

  /**
   * Computes the number of queue items to process based on the traversal configuration and queue size.
   *
   * @param queueSize - The current size of the queue.
   * @returns An integer within the range [0, `queueSize`].
   */
  #getProcessableItemCount(queueSize: number): number {
    // TODO: Implement using traversal config and queue size
    return queueSize;
  }

  /**
   * Computes the duration (in ms) for which to sleep before re-running the queue processing logic.
   *
   * @param queueSize - The current size of the queue.
   * @returns A non-negative integer.
   */
  #getProcessQueueInterval(_queueSize: number): number {
    // TODO: Implement using traversal config and queue size
    return 250;
  }
}
