import type { TraversalConfig } from '.';

/**
 * The configuration with which a fast traverser is created.
 */
export interface FastTraversalConfig extends TraversalConfig {
  /**
   * The maximum number of batches that can be held in memory and processed concurrently.
   *
   * @remarks
   *
   * This field must be a positive integer representing the maximum number of batches that you wish
   * the traverser to process concurrently at any given time. The traverser will pause when the number
   * of batches being processed concurrently reaches this number and continue when a batch has been
   * processed. This means that the higher the value of `maxConcurrentBatchCount`, the more memory the
   * traverser will consume but also the faster it will finish the traversal.
   *
   * @example
   *
   * ```
   * const projectsColRef = firestore().collection('projects');
   * const fastTraverser = createFastTraverser(projectsColRef, {
   *   batchSize: 500,
   *   maxConcurrentBatchCount: 20,
   * });
   * ```
   *
   * By providing this config we have indicated that we want each batch to contain 500 documents and the
   * traverser to process 20 batches concurrently at any given time. This means we have ensured that our
   * machine can handle 500 * 20 = 10,000 documents in memory at any given time.
   *
   * @defaultValue 10
   */
  readonly maxConcurrentBatchCount: number;
}
