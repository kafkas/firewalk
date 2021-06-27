import type { TraversalConfig } from '.';

/**
 * The configuration with which a fast traverser is created.
 */
export interface FastTraversalConfig extends TraversalConfig {
  /**
   * The maximum number of batches that can be held in memory and processed concurrently. Defaults to 10.
   */
  readonly maxConcurrentBatchCount: number;
}
