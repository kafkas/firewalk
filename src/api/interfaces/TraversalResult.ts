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
