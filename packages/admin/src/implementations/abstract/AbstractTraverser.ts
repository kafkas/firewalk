import { sleep, isPositiveInteger } from '../../utils';
import type {
  BatchCallbackAsync,
  ExitEarlyPredicate,
  Traversable,
  TraversalConfig,
  TraversalResult,
  TraverseEachCallback,
  TraverseEachConfig,
  Traverser,
} from '../../api';

export abstract class AbstractTraverser<C extends TraversalConfig, D> implements Traverser<C, D> {
  protected static readonly baseConfig: TraversalConfig = {
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

  private validateBaseConfig(config: Partial<TraversalConfig> = {}): void {
    const { batchSize, sleepTimeBetweenBatches, maxDocCount } = config;

    this.assertPositiveIntegerInBaseConfig(batchSize, 'batchSize');
    this.assertPositiveIntegerInBaseConfig(sleepTimeBetweenBatches, 'sleepTimeBetweenBatches');

    if (maxDocCount !== Infinity) {
      this.assertPositiveIntegerInBaseConfig(maxDocCount, 'maxDocCount');
    }
  }

  private assertPositiveIntegerInBaseConfig(
    num: number | undefined,
    field: keyof TraversalConfig
  ): asserts num {
    if (typeof num === 'number' && !isPositiveInteger(num)) {
      throw new Error(`The '${field}' field in traversal config must be a positive integer.`);
    }
  }

  public async traverseEach(
    callback: TraverseEachCallback<D>,
    config: Partial<TraverseEachConfig> = {}
  ): Promise<TraversalResult> {
    const { sleepBetweenDocs, sleepTimeBetweenDocs } = {
      ...AbstractTraverser.baseTraverseEachConfig,
      ...config,
    };

    const { batchCount, docCount } = await this.traverse(async (snapshots, batchIndex) => {
      for (let i = 0; i < snapshots.length; i++) {
        await callback(snapshots[i], i, batchIndex);
        if (sleepBetweenDocs) {
          await sleep(sleepTimeBetweenDocs);
        }
      }
    });

    return { batchCount, docCount };
  }

  public abstract readonly traversable: Traversable<D>;

  public abstract withConfig(config: Partial<C>): Traverser<C, D>;

  public abstract withExitEarlyPredicate(predicate: ExitEarlyPredicate<D>): Traverser<C, D>;

  public abstract traverse(callback: BatchCallbackAsync<D>): Promise<TraversalResult>;
}
