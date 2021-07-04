import type { firestore } from 'firebase-admin';
import type { MigrationPredicate, Migrator, TraversalConfig, Traverser } from '.';

/**
 * A batch migrator object that uses atomic batch writes.
 */
export interface BatchMigrator<
  C extends TraversalConfig = TraversalConfig,
  D = firestore.DocumentData
> extends Migrator<C, D> {
  /**
   * Applies a migration predicate that indicates whether to migrate the current document. If this is not provided,
   * all documents will be migrated.
   *
   * @param predicate - A function that takes a document snapshot and returns a boolean indicating whether to migrate it.
   * @returns A new {@link BatchMigrator} object.
   */
  withPredicate(predicate: MigrationPredicate<D>): BatchMigrator<C, D>;

  /**
   * Applies a new traverser that will be used by the migrator.
   *
   * @param traverser - The new traverser that the migrator will use.
   * @returns A new {@link BatchMigrator} object.
   */
  withTraverser<C2 extends TraversalConfig>(traverser: Traverser<C2, D>): BatchMigrator<C2, D>;
}
