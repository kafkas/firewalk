import type { firestore } from 'firebase-admin';
import type {
  BatchCallbackAsync,
  ExitEarlyPredicate,
  Traversable,
  TraversalConfig,
  TraversalResult,
  TraverseEachCallback,
  TraverseEachConfig,
} from '.';

/**
 * Represents the general interface of a traverser.
 */
export interface Traverser<D extends firestore.DocumentData, C extends TraversalConfig> {
  /**
   * The underlying traversable.
   */
  readonly traversable: Traversable<D>;

  /**
   * Existing traversal config.
   */
  readonly traversalConfig: C;

  /**
   * Applies the specified config values to the traverser.
   *
   * @param config - Partial traversal configuration.
   * @returns A new {@link Traverser} object.
   */
  withConfig(config: Partial<C>): Traverser<D, C>;

  /**
   * Applies the specified exit-early predicate to the traverser. After retrieving each batch, the traverser will evaluate the
   * predicate with the current batch doc snapshots and batch index and decide whether to continue the traversal or exit early.
   *
   * @param predicate - A synchronous function that takes batch doc snapshots and the 0-based batch index and returns a boolean
   * indicating whether to exit traversal early.
   * @returns A new {@link Traverser} object.
   */
  withExitEarlyPredicate(predicate: ExitEarlyPredicate<D>): Traverser<D, C>;

  /**
   * Traverses the entire collection in batches of the size specified in traversal config. Invokes the specified
   * callback sequentially for each document snapshot in each batch.
   *
   * @param callback - An asynchronous callback function to invoke for each document snapshot in each batch.
   * @param config - The sequential traversal configuration.
   * @returns A Promise resolving to an object representing the details of the traversal. The Promise resolves when the entire traversal ends.
   */
  traverseEach(
    callback: TraverseEachCallback<D>,
    config?: Partial<TraverseEachConfig>
  ): Promise<TraversalResult>;

  /**
   * Traverses the entire collection in batches of the size specified in traversal config. The traversal
   * method and complexity depend on the specific implementation.
   *
   * @param callback - An asynchronous callback function to invoke for each batch of document snapshots.
   * @returns A Promise resolving to an object representing the details of the traversal.
   */
  traverse(callback: BatchCallbackAsync<D>): Promise<TraversalResult>;
}
