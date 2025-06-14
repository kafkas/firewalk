import type { firestore } from 'firebase-admin';
import { isTraverser } from '../internal/utils';
import { BasicBatchMigratorImpl } from '../internal/implementations';
import type { InvalidConfigError } from '../errors'; /* eslint-disable-line */
import type { BatchMigrator, Traversable, TraversalConfig, Traverser } from './interfaces';
import { createTraverser } from './createTraverser';

/**
 * Creates a migrator that facilitates database migrations. Accepts a custom traverser object as argument which the
 * migrator will use when traversing the collection and writing to documents. This migrator uses atomic batch writes
 * when writing to docs so the entire operation will fail if a single write isn't successful.
 *
 * @remarks
 *
 * Note that the {@link TraversalConfig.batchSize} config value must not exceed 500 for a traverser used in a {@link BatchMigrator}.
 * This is because in Firestore, each write batch can write to a maximum of 500 documents.
 *
 * @param traverser - The traverser object that this migrator will use when traversing the collection and writing to documents.
 * @returns A new {@link BatchMigrator} object.
 * @throws {@link InvalidConfigError} Thrown if the traversal config of the specified traverser is not compatible with this migrator.
 */
export function createBatchMigrator<
  AppModelType = firestore.DocumentData,
  DbModelType extends firestore.DocumentData = firestore.DocumentData,
>(traverser: Traverser<AppModelType, DbModelType>): BatchMigrator<AppModelType, DbModelType>;

/**
 * Creates a migrator that facilitates database migrations. The migrator creates a default traverser that
 * it uses when traversing the collection and writing to documents. This migrator uses atomic batch writes when writing
 * to docs so the entire operation will fail if a single write isn't successful.
 *
 * @remarks
 *
 * Note that the {@link TraversalConfig.batchSize} config value must not exceed 500 for a traverser used in a {@link BatchMigrator}.
 * This is because in Firestore, each write batch can write to a maximum of 500 documents.
 *
 * @param traversable - A collection-like traversable group of documents.
 * @param traversalConfig - Optional. The traversal configuration with which the default traverser will be created.
 * @returns A new {@link BatchMigrator} object.
 * @throws {@link InvalidConfigError} Thrown if the specified `traversalConfig` is invalid or incompatible with this migrator.
 */
export function createBatchMigrator<
  AppModelType = firestore.DocumentData,
  DbModelType extends firestore.DocumentData = firestore.DocumentData,
>(
  traversable: Traversable<AppModelType, DbModelType>,
  traversalConfig?: Partial<TraversalConfig>
): BatchMigrator<AppModelType, DbModelType>;

export function createBatchMigrator<
  AppModelType = firestore.DocumentData,
  DbModelType extends firestore.DocumentData = firestore.DocumentData,
>(
  traversableOrTraverser:
    | Traverser<AppModelType, DbModelType>
    | Traversable<AppModelType, DbModelType>,
  traversalConfig?: Partial<TraversalConfig>
): BatchMigrator<AppModelType, DbModelType> {
  const traverser = isTraverser(traversableOrTraverser)
    ? (traversableOrTraverser as Traverser<AppModelType, DbModelType>)
    : createTraverser(
        traversableOrTraverser as Traversable<AppModelType, DbModelType>,
        traversalConfig
      );
  return new BasicBatchMigratorImpl(traverser);
}
