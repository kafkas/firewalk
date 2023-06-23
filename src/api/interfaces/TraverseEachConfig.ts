/**
 * The configuration that a given traverser uses in sequential traversals.
 */
export interface TraverseEachConfig {
  /**
   * The amount of time (in ms) to "sleep" before moving to the next doc.
   *
   * @defaultValue 0
   */
  readonly sleepTimeBetweenDocs: number;
}
