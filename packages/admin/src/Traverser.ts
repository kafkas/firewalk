import type { firestore } from 'firebase-admin';
import type {
  Traversable,
  BaseTraversalConfig,
  TraverseEachConfig,
  TraversalResult,
  BatchCallbackAsync,
} from './types';
import { sleep, isPositiveInteger } from './utils';

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

/**
 * Represents the general interface of a traverser.
 */
export abstract class Traverser<D extends firestore.DocumentData, C extends BaseTraversalConfig> {
  protected static readonly baseConfig: BaseTraversalConfig = {
    batchSize: 250,
    sleepBetweenBatches: false,
    sleepTimeBetweenBatches: 500,
    maxDocCount: Infinity,
  };

  protected static readonly baseTraverseEachConfig: TraverseEachConfig = {
    sleepBetweenDocs: false,
    sleepTimeBetweenDocs: 500,
  };

  public readonly traversalConfig: C;

  protected constructor(c: C) {
    validateTraversalConfig(c);
    this.traversalConfig = c;
  }

  /**
   * Traverses the entire collection in batches of the size specified in traversal config. Invokes the specified
   * callback sequentially for each document snapshot in each batch.
   * @param callback An asynchronous callback function to invoke for each document snapshot in each batch.
   * @param config The sequential traversal configuration.
   * @returns A Promise resolving to an object representing the details of the traversal. The Promise resolves when the entire traversal ends.
   */
  public async traverseEach(
    callback: (snapshot: firestore.QueryDocumentSnapshot<D>) => Promise<void>,
    c: Partial<TraverseEachConfig> = {}
  ): Promise<TraversalResult> {
    const { sleepBetweenDocs, sleepTimeBetweenDocs } = {
      ...Traverser.baseTraverseEachConfig,
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

  /**
   * The underlying traversable.
   */
  public abstract readonly traversable: Traversable<D>;

  public abstract withConfig(config: Partial<C>): Traverser<D, C>;

  public abstract traverse(callback: BatchCallbackAsync<D>): Promise<TraversalResult>;
}
