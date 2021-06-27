import type { firestore } from 'firebase-admin';
import { Traverser } from '../Traverser';
import type {
  Traversable,
  BaseTraversalConfig,
  TraversalResult,
  BatchCallbackAsync,
} from '../types';
import { sleep } from '../utils';

/**
 * A slow traverser object that facilitates Firestore collection traversals.
 */
export class SlowTraverser<D extends firestore.DocumentData> extends Traverser<
  D,
  BaseTraversalConfig
> {
  private static readonly defaultConfig: BaseTraversalConfig = {
    ...Traverser.baseConfig,
  };

  public constructor(
    public readonly traversable: Traversable<D>,
    config?: Partial<BaseTraversalConfig>
  ) {
    super({ ...SlowTraverser.defaultConfig, ...config });
  }

  // eslint-disable-next-line
  private validateConfig(config: Partial<BaseTraversalConfig> = {}): void {}

  /**
   * Applies a the specified config values to the traverser.
   *
   * @param config Partial traversal configuration.
   * @returns A new SlowTraverser object.
   */
  public withConfig(config: Partial<BaseTraversalConfig>): SlowTraverser<D> {
    return new SlowTraverser(this.traversable, { ...this.traversalConfig, ...config });
  }

  /**
   * Traverses the entire collection in batches of the size specified in traversal config. Invokes the specified
   * async callback for each batch of document snapshots. Waits for the callback Promise to resolve before moving to the next batch.
   *
   * **Properties:**
   *
   * - Time complexity: _O_((_N_ / `batchSize`) * (_Q_(`batchSize`) + _C_))
   * - Space complexity: _O_(`batchSize` * _D_ + _S_)
   * - Billing: max(1, _N_) reads
   *
   * where:
   *
   * - _N_: number of docs in the traversable
   * - _Q_(`batchSize`): average batch query time
   * - _C_: average processing time
   * - _D_: document size
   * - _S_: average extra space used by the callback
   *
   * @param callback An asynchronous callback function to invoke for each batch of document snapshots.
   * @returns A Promise resolving to an object representing the details of the traversal. The Promise resolves when the entire traversal ends.
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
