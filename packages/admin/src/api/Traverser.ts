import type { firestore } from 'firebase-admin';
import type {
  BatchCallbackAsync,
  BaseTraversalConfig,
  Traversable,
  TraversalResult,
  TraverseEachConfig,
} from '.';

/**
 * Represents the general interface of a traverser.
 */
export interface Traverser<D extends firestore.DocumentData, C extends BaseTraversalConfig> {
  /**
   * The underlying traversable.
   */
  readonly traversable: Traversable<D>;

  /**
   * Existing traversal config.
   */
  readonly traversalConfig: C;

  /**
   * Traverses the entire collection in batches of the size specified in traversal config. Invokes the specified
   * callback sequentially for each document snapshot in each batch.
   * @param callback An asynchronous callback function to invoke for each document snapshot in each batch.
   * @param config The sequential traversal configuration.
   * @returns A Promise resolving to an object representing the details of the traversal. The Promise resolves when the entire traversal ends.
   */
  traverseEach(
    callback: (snapshot: firestore.QueryDocumentSnapshot<D>) => Promise<void>,
    config?: Partial<TraverseEachConfig>
  ): Promise<TraversalResult>;

  traverse(callback: BatchCallbackAsync<D>): Promise<TraversalResult>;
}
