/**
 * The configuration that a given traverser uses in sequential traversals.
 */
export interface TraverseEachConfig {
  /**
   * Whether to sleep before moving to the next doc.
   *
   * @defaultValue `false`
   */
  readonly sleepBetweenDocs: boolean;

  /**
   * The amount of time (in ms) to "sleep" before moving to the next doc.
   *
   * @defaultValue 500
   */
  readonly sleepTimeBetweenDocs: number;
}
