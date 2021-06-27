import type { firestore } from 'firebase-admin';
import type { BaseTraversalConfig, MigrationPredicate, Migrator, Traverser } from '.';

export interface DefaultMigrator<D extends firestore.DocumentData, C extends BaseTraversalConfig>
  extends Migrator<D, C> {
  /**
   * Applies a migration predicate that returns a boolean indicating whether to migrate the current document.
   * If this is not provided, all documents will be migrated.
   *
   * @param predicate A function that takes a document snapshot and returns a boolean indicating whether to migrate it.
   * @returns A new DefaultMigrator object.
   */
  withPredicate(predicate: MigrationPredicate<D>): DefaultMigrator<D, C>;

  /**
   * Applies a new traverser that will be used by the migrator.
   *
   * @param traverser The new traverser that the migrator will use.
   * @returns A new DefaultMigrator object.
   */
  withTraverser<C2 extends BaseTraversalConfig>(
    traverser: Traverser<D, C2>
  ): DefaultMigrator<D, C2>;
}
