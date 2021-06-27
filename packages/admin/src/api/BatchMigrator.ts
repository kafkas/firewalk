import type { firestore } from 'firebase-admin';
import type { MigrationPredicate, Migrator, TraversalConfig, Traverser } from '.';

/**
 * A batch migrator object that uses atomic batch writes.
 */
export interface BatchMigrator<D extends firestore.DocumentData, C extends TraversalConfig>
  extends Migrator<D, C> {
  /**
   * Applies a migration predicate that returns a boolean indicating whether to migrate the current document.
   * If this is not provided, all documents will be migrated.
   *
   * @param predicate A function that takes a document snapshot and returns a boolean indicating whether to migrate it.
   * @returns A new BatchMigrator object.
   */
  withPredicate(predicate: MigrationPredicate<D>): BatchMigrator<D, C>;

  /**
   * Applies a new traverser that will be used by the migrator.
   *
   * @param traverser The new traverser that the migrator will use.
   * @returns A new BatchMigrator object.
   */
  withTraverser<C2 extends TraversalConfig>(traverser: Traverser<D, C2>): BatchMigrator<D, C2>;
}
