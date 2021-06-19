import type { firestore } from 'firebase-admin';
import type { TraverseEachConfig, TraversalResult } from './types';

export interface CollectionTraverser<T = firestore.DocumentData> {
  /**
   * Traverses the entire collection in batches of size `TraversalConfig.batchSize`. Invokes the
   * specified callback for each document snapshot in each batch.
   * @returns The number of batches and documents retrieved.
   */
  traverseEach(
    callback: (snapshot: firestore.QueryDocumentSnapshot<T>) => Promise<void>,
    config?: Partial<TraverseEachConfig>
  ): Promise<TraversalResult>;

  /**
   * Traverses the entire collection in batches of size `TraversalConfig.batchSize`. Invokes the
   * specified callback for each batch of document snapshots.
   * @returns The number of batches and documents retrieved.
   */
  traverse(
    callback: (batchSnapshots: firestore.QueryDocumentSnapshot<T>[]) => Promise<void>
  ): Promise<TraversalResult>;
}
