import type { firestore } from 'firebase-admin';
import type { TraverseEachConfig, TraversalResult } from './types';

export interface CollectionTraverser<T = firestore.DocumentData> {
  /**
   * Traverses the entire collection in batches of size `TraversalConfig.batchSize`. Invokes the
   * specified callback sequentially for each document snapshot in each batch.
   * @param callback The callback to invoke for each document snapshot.
   * @param config The sequential traversal configuration.
   * @returns An object containing the number of batches and documents retrieved.
   */
  traverseEach(
    callback: (snapshot: firestore.QueryDocumentSnapshot<T>) => Promise<void>,
    config?: Partial<TraverseEachConfig>
  ): Promise<TraversalResult>;

  /**
   * Traverses the entire collection in batches of size `TraversalConfig.batchSize`. Invokes the
   * specified callback for each batch of document snapshots.
   * @param callback The callback to invoke for each batch of document snapshots.
   * @returns An object containing the number of batches and documents retrieved.
   */
  traverse(
    callback: (batchSnapshots: firestore.QueryDocumentSnapshot<T>[]) => Promise<void>
  ): Promise<TraversalResult>;
}
