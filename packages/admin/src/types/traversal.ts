import type { firestore } from 'firebase-admin';

/**
 * A collection-like traversable object.
 */
export type Traversable<T = firestore.DocumentData> =
  | firestore.CollectionReference<T>
  | firestore.CollectionGroup<T>
  | firestore.Query<T>;

/**
 * The configuration with which a traverser is created.
 */
export interface BaseTraversalConfig {
  /**
   * The number of documents that will be traversed in each batch. Defaults to 250.
   */
  batchSize: number;

  /**
   * Whether to sleep between batches. Defaults to `false`.
   */
  sleepBetweenBatches: boolean;

  /**
   * The amount of time (in ms) to "sleep" before moving on to the next batch. Defaults to 500.
   */
  sleepTimeBetweenBatches: number;

  /**
   * The maximum number of documents that will be traversed. Defaults to `Infinity`.
   */
  maxDocCount: number;
}

export interface FastTraversalConfig extends BaseTraversalConfig {
  maxInMemoryBatchCount: number;
}

/**
 * The configuration that a given traverser uses in sequential traversals.
 */
export interface TraverseEachConfig {
  /**
   * Whether to sleep before moving to the next doc. Defaults to `false`.
   */
  sleepBetweenDocs: boolean;

  /**
   * The amount of time (in ms) to "sleep" before moving to the next doc. Defaults to 500.
   */
  sleepTimeBetweenDocs: number;
}

/**
 * Represents an object that contains the details of a traversal.
 */
export interface TraversalResult {
  /**
   * The number of batches that have been retrieved in this traversal.
   */
  batchCount: number;

  /**
   * The number of documents that have been retrieved in this traversal.
   */
  docCount: number;
}
