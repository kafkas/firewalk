import type { firestore } from 'firebase-admin';
import type {
  BaseTraversalConfig,
  TraverseEachConfig,
  TraversalResult,
  BatchCallback,
  BatchCallbackAsync,
} from './types';
import { sleep, isPositiveInteger } from './utils';

const defaultTraversalConfig: BaseTraversalConfig = {
  batchSize: 250,
  sleepBetweenBatches: false,
  sleepTimeBetweenBatches: 500,
  maxDocCount: Infinity,
};

const defaultTraverseEachConfig: TraverseEachConfig = {
  sleepBetweenDocs: false,
  sleepTimeBetweenDocs: 500,
};

function assertPositiveIntegerInConfig(
  num: number | undefined,
  field: keyof BaseTraversalConfig
): asserts num {
  if (typeof num === 'number' && !isPositiveInteger(num)) {
    throw new Error(`The '${field}' field in traversal config must be a positive integer.`);
  }
}

function validateTraversalConfig(c: Partial<BaseTraversalConfig> = {}): void {
  const { batchSize, sleepTimeBetweenBatches, maxDocCount } = c;

  assertPositiveIntegerInConfig(batchSize, 'batchSize');
  assertPositiveIntegerInConfig(sleepTimeBetweenBatches, 'sleepTimeBetweenBatches');
  if (maxDocCount !== Infinity) {
    assertPositiveIntegerInConfig(maxDocCount, 'maxDocCount');
  }
}

export abstract class BaseTraverser<C extends BaseTraversalConfig, D = firestore.DocumentData> {
  public static getDefaultConfig(): BaseTraversalConfig {
    return { ...defaultTraversalConfig };
  }

  protected readonly traversalConfig: C;
  protected readonly registeredCallbacks: {
    onBeforeBatchStart?: BatchCallback<D>;
    onAfterBatchComplete?: BatchCallback<D>;
  };

  protected constructor(c: C) {
    validateTraversalConfig(c);
    this.traversalConfig = c;
    this.registeredCallbacks = {};
  }

  public onBeforeBatchStart(callback: BatchCallback<D>): void {
    this.registeredCallbacks.onBeforeBatchStart = callback;
  }

  public onAfterBatchComplete(callback: BatchCallback<D>): void {
    this.registeredCallbacks.onAfterBatchComplete = callback;
  }

  public async traverseEach(
    callback: (snapshot: firestore.QueryDocumentSnapshot<D>) => Promise<void>,
    c: Partial<TraverseEachConfig> = {}
  ): Promise<TraversalResult> {
    const { sleepBetweenDocs, sleepTimeBetweenDocs } = {
      ...defaultTraverseEachConfig,
      ...c,
    };

    const { batchCount, docCount } = await this.traverse(async (snapshots) => {
      for (let i = 0; i < snapshots.length; i++) {
        await callback(snapshots[i]);
        if (sleepBetweenDocs) {
          await sleep(sleepTimeBetweenDocs);
        }
      }
    });

    return { batchCount, docCount };
  }

  public abstract traverse(callback: BatchCallbackAsync<D>): Promise<TraversalResult>;
}
