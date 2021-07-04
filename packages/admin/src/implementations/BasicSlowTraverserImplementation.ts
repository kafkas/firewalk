import { sleep } from '../utils';
import type {
  BatchCallbackAsync,
  ExitEarlyPredicate,
  SlowTraverser,
  Traversable,
  TraversalConfig,
  TraversalResult,
} from '../api';
import { AbstractTraverser } from './abstract';

export class BasicSlowTraverserImplementation<D>
  extends AbstractTraverser<TraversalConfig, D>
  implements SlowTraverser<D> {
  private static readonly defaultConfig: TraversalConfig = {
    ...AbstractTraverser.baseConfig,
  };

  public constructor(
    public readonly traversable: Traversable<D>,
    exitEarlyPredicates: ExitEarlyPredicate<D>[] = [],
    config?: Partial<TraversalConfig>
  ) {
    super({ ...BasicSlowTraverserImplementation.defaultConfig, ...config }, exitEarlyPredicates);
  }

  // eslint-disable-next-line
  private validateConfig(config: Partial<TraversalConfig> = {}): void {}

  public withConfig(config: Partial<TraversalConfig>): SlowTraverser<D> {
    return new BasicSlowTraverserImplementation(this.traversable, this.exitEarlyPredicates, {
      ...this.traversalConfig,
      ...config,
    });
  }

  public withExitEarlyPredicate(predicate: ExitEarlyPredicate<D>): SlowTraverser<D> {
    return new BasicSlowTraverserImplementation(
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
    } = this.traversalConfig;

    let curBatchIndex = 0;
    let docCount = 0;
    let query = this.traversable.limit(Math.min(batchSize, maxDocCount));

    while (true) {
      const { docs: batchDocSnapshots } = await query.get();
      const batchDocCount = batchDocSnapshots.length;

      if (batchDocCount === 0) {
        break;
      }

      const lastDocInBatch = batchDocSnapshots[batchDocCount - 1];

      docCount += batchDocCount;

      await callback(batchDocSnapshots, curBatchIndex);

      if (this.shouldExitEarly(batchDocSnapshots, curBatchIndex) || docCount === maxDocCount) {
        break;
      }

      query = query.startAfter(lastDocInBatch).limit(Math.min(batchSize, maxDocCount - docCount));
      curBatchIndex++;

      if (sleepBetweenBatches) {
        await sleep(sleepTimeBetweenBatches);
      }
    }

    return { batchCount: curBatchIndex, docCount };
  }
}
