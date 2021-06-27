import type { firestore } from 'firebase-admin';
import { sleep } from '../utils';
import type {
  BaseTraversalConfig,
  BatchCallbackAsync,
  SlowTraverser,
  Traversable,
  TraversalResult,
} from '../api';
import { AbstractTraverser } from '../AbstractTraverser';

export class SpecificSlowTraverser<D extends firestore.DocumentData>
  extends AbstractTraverser<D, BaseTraversalConfig>
  implements SlowTraverser<D> {
  private static readonly defaultConfig: BaseTraversalConfig = {
    ...AbstractTraverser.baseConfig,
  };

  public constructor(
    public readonly traversable: Traversable<D>,
    config?: Partial<BaseTraversalConfig>
  ) {
    super({ ...SpecificSlowTraverser.defaultConfig, ...config });
  }

  // eslint-disable-next-line
  private validateConfig(config: Partial<BaseTraversalConfig> = {}): void {}

  public withConfig(config: Partial<BaseTraversalConfig>): SlowTraverser<D> {
    return new SpecificSlowTraverser(this.traversable, { ...this.traversalConfig, ...config });
  }

  public async traverse(callback: BatchCallbackAsync<D>): Promise<TraversalResult> {
    const {
      batchSize,
      sleepBetweenBatches,
      sleepTimeBetweenBatches,
      maxDocCount,
    } = this.traversalConfig;

    let batchIndex = 0;
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

      await callback(batchDocSnapshots, batchIndex);

      if (docCount === maxDocCount) {
        break;
      }

      query = query.startAfter(lastDocInBatch).limit(Math.min(batchSize, maxDocCount - docCount));
      batchIndex++;

      if (sleepBetweenBatches) {
        await sleep(sleepTimeBetweenBatches);
      }
    }

    return { batchCount: batchIndex, docCount };
  }
}
