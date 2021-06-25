import type { firestore } from 'firebase-admin';
import type {
  Traversable,
  BaseTraversalConfig,
  TraverseEachConfig,
  TraversalResult,
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

export abstract class Traverser<
  D extends firestore.DocumentData,
  T extends Traversable<D>,
  C extends BaseTraversalConfig
> {
  public static getDefaultConfig(): BaseTraversalConfig {
    return { ...defaultTraversalConfig };
  }

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
   * @returns A Promise resolving to an object representing the details of the traversal.
   */
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

  /**
   * The underlying traversable.
   */
  public abstract readonly traversable: T;

  /**
   * Applies the specified traversal config values. Creates and returns a new traverser rather than
   * modify the existing instance.
   * @param config Partial traversal configuration.
   * @returns The newly created traverser.
   */
  public abstract withConfig(config: Partial<BaseTraversalConfig>): Traverser<D, T, C>;

  public abstract traverse(callback: BatchCallbackAsync<D>): Promise<TraversalResult>;
}
