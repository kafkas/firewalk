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
