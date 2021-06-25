import type { firestore } from 'firebase-admin';
import { Traverser } from '../Traverser';
import type {
  Traversable,
  BaseTraversalConfig,
  TraversalResult,
  BatchCallbackAsync,
} from '../types';
import { sleep } from '../utils';

const defaultTraversalConfig: BaseTraversalConfig = Traverser.getDefaultConfig();

export class SlowTraverser<D extends firestore.DocumentData> extends Traverser<
  D,
  BaseTraversalConfig
> {
  public constructor(
    public readonly traversable: Traversable<D>,
    config?: Partial<BaseTraversalConfig>
  ) {
    super({ ...defaultTraversalConfig, ...config });
  }

  public withConfig(c: Partial<BaseTraversalConfig>): SlowTraverser<D> {
    return new SlowTraverser(this.traversable, { ...this.traversalConfig, ...c });
  }

  /**
   * Traverses the entire collection in batches of the size specified in traversal config. Invokes the specified
   * async callback for each batch of document snapshots. Waits for the callback Promise to resolve before moving to the next batch.
   *
   * - Time complexity: O((N / `batchSize`) * (Q(`batchSize`) + C))
   * - Space complexity: O(`batchSize` * D)
   * - Billing: N reads
   *
   * where:
   *
   * - N: number of docs in the traversable
   * - Q(`batchSize`): average batch query time
   * - C: average processing time
   * - D: document size
   *
   * @param callback An asynchronous callback function to invoke for each batch of document snapshots.
   * @returns A Promise resolving to an object representing the details of the traversal.
   */
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
