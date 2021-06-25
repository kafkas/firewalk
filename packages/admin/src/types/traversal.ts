import type { firestore } from 'firebase-admin';

/**
 * A collection-like group of documents.
 */
export type Traversable<D = firestore.DocumentData> =
  | firestore.CollectionReference<D>
  | firestore.CollectionGroup<D>
  | firestore.Query<D>;

/**
 * The configuration with which a traverser is created.
 */
export interface BaseTraversalConfig {
  /**
   * The number of documents that will be traversed in each batch. Defaults to 250.
   */
  readonly batchSize: number;

  /**
   * Whether to sleep between batches. Defaults to `false`.
   */
  readonly sleepBetweenBatches: boolean;

  /**
   * The amount of time (in ms) to "sleep" before moving on to the next batch. Defaults to 500.
   */
  readonly sleepTimeBetweenBatches: number;

  /**
   * The maximum number of documents that will be traversed. Defaults to `Infinity`.
   */
  readonly maxDocCount: number;
}

/**
 * The configuration with which a fast traverser is created.
 */
export interface FastTraversalConfig extends BaseTraversalConfig {
  /**
   * The maximum number of batches that can be held in memory and processed concurrently. Defaults to 10.
   */
  readonly maxConcurrentBatchCount: number;
}

/**
 * The configuration that a given traverser uses in sequential traversals.
 */
export interface TraverseEachConfig {
  /**
   * Whether to sleep before moving to the next doc. Defaults to `false`.
   */
  readonly sleepBetweenDocs: boolean;

  /**
   * The amount of time (in ms) to "sleep" before moving to the next doc. Defaults to 500.
   */
  readonly sleepTimeBetweenDocs: number;
}

/**
 * Represents an object that contains the details of a traversal.
 */
export interface TraversalResult {
  /**
   * The number of batches that have been retrieved in this traversal.
   */
  readonly batchCount: number;

  /**
   * The number of documents that have been retrieved in this traversal.
   */
  readonly docCount: number;
}
