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
