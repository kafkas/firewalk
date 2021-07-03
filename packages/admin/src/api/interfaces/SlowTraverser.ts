import type { firestore } from 'firebase-admin';
import type { BatchCallbackAsync, TraversalConfig, TraversalResult, Traverser } from '.';

/**
 * A slow traverser object that facilitates Firestore collection traversals.
 */
export interface SlowTraverser<D extends firestore.DocumentData>
  extends Traverser<D, TraversalConfig> {
  /**
   * Applies the specified config values to the traverser.
   *
   * @param config Partial traversal configuration.
   * @returns A new {@link SlowTraverser} object.
   */
  withConfig(config: Partial<TraversalConfig>): SlowTraverser<D>;

  /**
   * Traverses the entire collection in batches of the size specified in traversal config. Invokes the specified
   * async callback for each batch of document snapshots. Waits for the callback Promise to resolve before moving to the next batch.
   *
   * @remarks
   *
   * **Complexity:**
   *
   * - Time complexity: _O_((_N_ / `batchSize`) * (_Q_(`batchSize`) + _C_))
   * - Space complexity: _O_(`batchSize` * _D_ + _S_)
   * - Billing: max(1, _N_) reads
   *
   * where:
   *
   * - _N_: number of docs in the traversable
   * - _Q_(`batchSize`): average batch query time
   * - _D_: average document size
   * - _C_: average callback processing time
   * - _S_: average extra space used by the callback
   *
   * @param callback An asynchronous callback function to invoke for each batch of document snapshots.
   * @returns A Promise resolving to an object representing the details of the traversal. The Promise resolves when the entire traversal ends.
   */
  traverse(callback: BatchCallbackAsync<D>): Promise<TraversalResult>;
}
