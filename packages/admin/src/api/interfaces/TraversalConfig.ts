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
   * Whether to sleep between batches.
   *
   * @defaultValue `false`
   */
  readonly sleepBetweenBatches: boolean;

  /**
   * The amount of time (in ms) to "sleep" before moving on to the next batch.
   *
   * @defaultValue 500
   */
  readonly sleepTimeBetweenBatches: number;

  /**
   * The maximum number of documents that will be traversed.
   *
   * @defaultValue `Infinity`
   */
  readonly maxDocCount: number;
}
