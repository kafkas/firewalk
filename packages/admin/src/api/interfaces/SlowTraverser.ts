import type { firestore } from 'firebase-admin';
import type {
  BatchCallbackAsync,
  ExitEarlyPredicate,
  TraversalConfig,
  TraversalResult,
  Traverser,
} from '.';

/**
 * A slow traverser object that facilitates Firestore collection traversals.
 */
export interface SlowTraverser<D = firestore.DocumentData> extends Traverser<TraversalConfig, D> {
  /**
   * Applies the specified config values to the traverser.
   *
   * @param config - Partial traversal configuration.
   * @returns A new {@link SlowTraverser} object.
   */
  withConfig(config: Partial<TraversalConfig>): SlowTraverser<D>;

  /**
   * Applies the specified exit-early predicate to the traverser. After retrieving each batch, the traverser will evaluate the
   * predicate with the current batch doc snapshots and batch index and decide whether to continue the traversal or exit early.
   *
   *  @remarks
   *
   * If you have already applied other exit-early predicates to this traverser, this and all the other predicates will be
   * evaluated and the resulting booleans will be OR'd to get the boolean that indicates whether to exit early or not. This
   * is consistent with the intuitive default behavior that the traverser doesn't exit early.
   *
   * @example
   *
   * ```ts
   * const newTraverser = traverser
   *   .withExitEarlyPredicate((batchDocs) => batchDocs.some((d) => d.get('name') === undefined))
   *   .withExitEarlyPredicate((_, batchIndex) => batchIndex === 99);
   * ```
   *
   * In the above case `newTraverser` will exit early if the `name` field of one of the docs in the batch is missing OR if
   * the batch index is 99. That is, it will never reach batch 100 and depending on the documents in the database it may exit
   * earlier than 99.
   *
   * @param predicate - A synchronous function that takes batch doc snapshots and the 0-based batch index and returns a boolean
   * indicating whether to exit traversal early.
   * @returns A new {@link SlowTraverser} object.
   */
  withExitEarlyPredicate(predicate: ExitEarlyPredicate<D>): SlowTraverser<D>;

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
   * @param callback - An asynchronous callback function to invoke for each batch of document snapshots.
   * @returns A Promise resolving to an object representing the details of the traversal. The Promise resolves when the entire traversal ends.
   */
  traverse(callback: BatchCallbackAsync<D>): Promise<TraversalResult>;
}
