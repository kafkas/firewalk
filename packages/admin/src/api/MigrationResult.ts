/**
 * Represents an object that contains the details of a migration.
 */
export interface MigrationResult {
  /**
   * The number of batches that have been retrieved in this traversal.
   */
  readonly batchCount: number;

  /**
   * The number of documents that have been retrieved in this traversal.
   */
  readonly traversedDocCount: number;

  /**
   * The number of documents that have been migrated.
   */
  readonly migratedDocCount: number;
}
