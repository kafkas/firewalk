/**
 * The configuration with which a traverser is created.
 */
export interface TraversalConfig {
  /**
   * The number of documents that will be traversed in each batch.
   *
   * @defaultValue 250
   */
  readonly batchSize: number;

  /**
   * The amount of time (in ms) to "sleep" before moving on to the next batch.
   *
   * @defaultValue 0
   */
  readonly sleepTimeBetweenBatches: number;

  /**
   * The maximum number of documents that will be traversed.
   *
   * @defaultValue `Infinity`
   */
  readonly maxDocCount: number;

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
   * ```typescript
   * const projectsColRef = firestore().collection('projects');
   * const traverser = createTraverser(projectsColRef, {
   *   batchSize: 500,
   *   maxConcurrentBatchCount: 20,
   * });
   * ```
   *
   * By providing this config we have indicated that we want each batch to contain 500 documents and the
   * traverser to process 20 batches concurrently at any given time. This means we have ensured that our
   * machine can handle 500 * 20 = 10,000 documents in memory at any given time.
   *
   * @defaultValue 1
   */
  readonly maxConcurrentBatchCount: number;

  /**
   * The maximum number of times the traverser will retry processing a given batch, in case of an error.
   * By default, batches are not retried.
   *
   * @remarks
   *
   * This field must be a non-negative integer representing the maximum number of times the traverser will
   * retry processing a given batch. By default, the traverser invokes the batch callback only once i.e.
   * with 0 retries but, if `maxBatchRetryCount` > 0, it will keep invoking the callback until it succeeds
   * or the total number of retries reaches `maxBatchRetryCount`.
   *
   * @defaultValue 0
   */
  readonly maxBatchRetryCount: number;

  /**
   * A non-negative integer or a function that takes the 0-based index of the last trial and returns a
   * non-negative integer indicating the amount of time (in ms) to "sleep" before retrying processing
   * the current batch. This is useful if you want to implement something like exponential backoff.
   *
   * @defaultValue 1000
   */
  readonly sleepTimeBetweenTrials: number | ((lastTrialIndex: number) => number);
}
