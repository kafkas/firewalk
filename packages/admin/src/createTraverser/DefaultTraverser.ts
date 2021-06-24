import type { firestore } from 'firebase-admin';
import { BaseTraverser } from '../BaseTraverser';
import type { Traverser } from '../Traverser';
import type {
  Traversable,
  BaseTraversalConfig,
  TraversalResult,
  BatchCallbackAsync,
} from '../types';
import { sleep } from '../utils';

const defaultTraversalConfig: BaseTraversalConfig = BaseTraverser.getDefaultConfig();

export class DefaultTraverser<D = firestore.DocumentData>
  extends BaseTraverser<BaseTraversalConfig, D>
  implements Traverser<D> {
  public constructor(
    public readonly traversable: Traversable<D>,
    config?: Partial<BaseTraversalConfig>
  ) {
    super({ ...defaultTraversalConfig, ...config });
  }

  public withConfig(c: Partial<BaseTraversalConfig>): Traverser<D> {
    return new DefaultTraverser(this.traversable, { ...this.traversalConfig, ...c });
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

      this.registeredCallbacks.onBeforeBatchStart?.(batchDocSnapshots, batchIndex);

      await callback(batchDocSnapshots, batchIndex);

      this.registeredCallbacks.onAfterBatchComplete?.(batchDocSnapshots, batchIndex);

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
