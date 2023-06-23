import type { TraversalResult } from '.';

/**
 * Represents an object that contains the details of a migration.
 */
export interface MigrationResult {
  /**
   * The traversal result of the underlying traverser.
   */
  readonly traversalResult: TraversalResult;

  /**
   * The number of documents that have been migrated.
   */
  readonly migratedDocCount: number;
}
