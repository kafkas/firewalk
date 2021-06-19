/**
 * Represents an object that contains the details of a migration.
 */
export interface MigrationResult {
  /**
   * The number of batches that have been retrieved in this traversal.
   */
  batchCount: number;

  /**
   * The number of documents that have been retrieved in this traversal.
   */
  traversedDocCount: number;

  /**
   * The number of documents that have been migrated.
   */
  migratedDocCount: number;
}
