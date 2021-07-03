import type { firestore } from 'firebase-admin';
import type {
  BatchCallbackAsync,
  ExitEarlyPredicate,
  FastTraversalConfig,
  TraversalResult,
  Traverser,
} from '.';

/**
 * A fast traverser object that facilitates Firestore collection traversals.
 */
export interface FastTraverser<D extends firestore.DocumentData>
  extends Traverser<D, FastTraversalConfig> {
  /**
   * Applies the specified config values to the traverser.
   *
   * @param config Partial traversal configuration.
   * @returns A new {@link FastTraverser} object.
   */
  withConfig(config: Partial<FastTraversalConfig>): FastTraverser<D>;

  /**
   * Applies the specified exit-early predicate to the traverser. After retrieving each batch, the traverser will evaluate the
   * predicate with the current batch doc snapshots and batch index and decide whether to continue the traversal or exit early.
   *
   * @param predicate A synchronous function that takes batch doc snapshots and the 0-based batch index and returns a boolean
   * indicating whether to exit traversal early.
   * @returns A new {@link FastTraverser} object.
   */
  withExitEarlyPredicate(predicate: ExitEarlyPredicate<D>): FastTraverser<D>;

  /**
   * Traverses the entire collection in batches of the size specified in traversal config. Invokes the specified async
   * callback for each batch of document snapshots and immediately moves to the next batch. Does not wait for the callback
   * Promise to resolve before moving to the next batch so there is no guarantee that any given batch will finish processing
   * before a later batch.
   *
   * @remarks
   *
   * **Complexity:**
   *
   * - Time complexity: _O_(_C_ + (_N_ / `batchSize`) * _Q_(`batchSize`))
   * - Space complexity: _O_(`maxConcurrentBatchCount` * (`batchSize` * _D_ + _S_))
   * - Billing: _max_(1, _N_) reads
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
   * @returns A Promise resolving to an object representing the details of the traversal.
   */
  traverse(callback: BatchCallbackAsync<D>): Promise<TraversalResult>;
}
