import type { firestore } from 'firebase-admin';
import { sleep, isPositiveInteger } from './utils';
import type {
  BaseTraversalConfig,
  BatchCallbackAsync,
  Traversable,
  TraversalResult,
  TraverseEachConfig,
  Traverser,
} from './api';

export abstract class AbstractTraverser<
  D extends firestore.DocumentData,
  C extends BaseTraversalConfig
> implements Traverser<D, C> {
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

  protected constructor(public readonly traversalConfig: C) {
    this.validateBaseConfig(traversalConfig);
  }

  private validateBaseConfig(config: Partial<BaseTraversalConfig> = {}): void {
    const { batchSize, sleepTimeBetweenBatches, maxDocCount } = config;

    this.assertPositiveIntegerInBaseConfig(batchSize, 'batchSize');
    this.assertPositiveIntegerInBaseConfig(sleepTimeBetweenBatches, 'sleepTimeBetweenBatches');

    if (maxDocCount !== Infinity) {
      this.assertPositiveIntegerInBaseConfig(maxDocCount, 'maxDocCount');
    }
  }

  private assertPositiveIntegerInBaseConfig(
    num: number | undefined,
    field: keyof BaseTraversalConfig
  ): asserts num {
    if (typeof num === 'number' && !isPositiveInteger(num)) {
      throw new Error(`The '${field}' field in traversal config must be a positive integer.`);
    }
  }

  public async traverseEach(
    callback: (snapshot: firestore.QueryDocumentSnapshot<D>) => Promise<void>,
    config: Partial<TraverseEachConfig> = {}
  ): Promise<TraversalResult> {
    const { sleepBetweenDocs, sleepTimeBetweenDocs } = {
      ...AbstractTraverser.baseTraverseEachConfig,
      ...config,
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

  public abstract readonly traversable: Traversable<D>;

  public abstract traverse(callback: BatchCallbackAsync<D>): Promise<TraversalResult>;
}
