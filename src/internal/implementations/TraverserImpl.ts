import type { firestore } from 'firebase-admin';
import pLimit from 'p-limit';
import type {
  BatchCallback,
  ExitEarlyPredicate,
  Traversable,
  TraversalConfig,
  TraversalResult,
  Traverser,
} from '../../api';
import { makeRetriable, sleep } from '../utils';
import { AbstractTraverser } from './abstract';

export class TraverserImpl<
    AppModelType = firestore.DocumentData,
    DbModelType extends firestore.DocumentData = firestore.DocumentData,
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
    super({ ...TraverserImpl.#defaultConfig, ...config }, exitEarlyPredicates);
  }

  public withConfig(config: Partial<TraversalConfig>): Traverser<AppModelType, DbModelType> {
    return new TraverserImpl(this.traversable, this.exitEarlyPredicates, {
      ...this.traversalConfig,
      ...config,
    });
  }

  public withExitEarlyPredicate(
    predicate: ExitEarlyPredicate<AppModelType, DbModelType>
  ): Traverser<AppModelType, DbModelType> {
    return new TraverserImpl(
      this.traversable,
      [...this.exitEarlyPredicates, predicate],
      this.traversalConfig
    );
  }

  public async traverse(
    callback: BatchCallback<AppModelType, DbModelType>
  ): Promise<TraversalResult> {
    const { maxConcurrentBatchCount } = this.traversalConfig;
    callback = this.#makeRetriableAccordingToConfig(callback);

    if (maxConcurrentBatchCount === 1) {
      return this.runTraversal(async (batchDocs, batchIndex) => {
        await callback(batchDocs, batchIndex);
      });
    }

    const limit = pLimit(maxConcurrentBatchCount);
    const pendingCallbacks: Promise<void>[] = [];

    const traversalResult = await this.runTraversal((batchDocs, batchIndex) => {
      pendingCallbacks.push(
        limit(async () => {
          await (callback(batchDocs, batchIndex) ?? Promise.resolve());
        })
      );
      return async () => {
        while (limit.activeCount + limit.pendingCount >= maxConcurrentBatchCount) {
          await sleep(10);
        }
      };
    });

    await Promise.all(pendingCallbacks);
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
}
