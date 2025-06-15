import type { firestore } from 'firebase-admin';
import type { MigrationPredicate, Migrator, Traverser } from '.';

/**
 * A batch migrator object that does not use atomic batch writes.
 */
export interface DefaultMigrator<
  AppModelType = firestore.DocumentData,
  DbModelType extends firestore.DocumentData = firestore.DocumentData,
> extends Migrator<AppModelType, DbModelType> {
  /**
   * Applies a migration predicate that indicates whether to migrate the current document or not. By default, all
   * documents are migrated.
   *
   * @remarks
   *
   * If you have already applied other migration predicates to this migrator, this and all the other predicates will be
   * evaluated and the resulting booleans will be AND'd to get the boolean that indicates whether to migrate the document
   * or not. This is consistent with the intuitive default behavior that all documents are migrated.
   *
   * @example
   *
   * ```ts
   * const newMigrator = migrator
   *   .withPredicate((doc) => doc.get('name') !== undefined)
   *   .withPredicate((doc) => doc.ref.path.startsWith('users/'));
   * ```
   *
   * In the above case `newMigrator` will migrate only the documents whose `name` field is not missing AND whose path
   * starts with `"users/"`.
   *
   * @param predicate - A function that takes a document snapshot and returns a boolean indicating whether to migrate it.
   * @returns A new {@link DefaultMigrator} object.
   */
  withPredicate(
    predicate: MigrationPredicate<AppModelType, DbModelType>
  ): DefaultMigrator<AppModelType, DbModelType>;

  /**
   * Applies a new traverser that will be used by the migrator.
   *
   * @param traverser - The new traverser that the migrator will use.
   * @returns A new {@link DefaultMigrator} object.
   */
  withTraverser(
    traverser: Traverser<AppModelType, DbModelType>
  ): DefaultMigrator<AppModelType, DbModelType>;
}
