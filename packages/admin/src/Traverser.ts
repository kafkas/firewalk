import type { firestore } from 'firebase-admin';
import type {
  Traversable,
  TraverseEachConfig,
  TraversalResult,
  BaseTraversalConfig,
  BatchCallbackAsync,
} from './types';

export interface Traverser<T extends Traversable<D>, D = firestore.DocumentData> {
  readonly traversable: T;

  /**
   * Applies the specified traversal config values. Creates and returns a new traverser rather than
   * modify the existing instance.
   * @param config Partial traversal configuration.
   * @returns The newly created traverser.
   */
  withConfig(config: Partial<BaseTraversalConfig>): Traverser<T, D>;

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
  traverse(callback: BatchCallbackAsync<D>): Promise<TraversalResult>;

  /**
   * Traverses the entire collection in batches of the size specified in traversal config. Invokes the specified
   * callback sequentially for each document snapshot in each batch.
   * @param callback An asynchronous callback function to invoke for each document snapshot in each batch.
   * @param config The sequential traversal configuration.
   * @returns A Promise resolving to an object representing the details of the traversal.
   */
  traverseEach(
    callback: (snapshot: firestore.QueryDocumentSnapshot<D>) => Promise<void>,
    config?: Partial<TraverseEachConfig>
  ): Promise<TraversalResult>;
}
