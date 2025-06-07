import type { firestore } from 'firebase-admin';
import { isTraverser } from '../internal/utils';
import { BasicDefaultMigratorImpl } from '../internal/implementations';
import type { InvalidConfigError } from '../errors'; /* eslint-disable-line */
import type { DefaultMigrator, Traversable, TraversalConfig, Traverser } from './interfaces';
import { createTraverser } from './createTraverser';

/**
 * Creates a migrator that facilitates database migrations. Accepts a custom traverser object as argument which the
 * migrator will use when traversing the collection and writing to documents. This migrator does not use atomic batch
 * writes so it is possible that when a write fails other writes go through.
 *
 * @param traverser - The traverser object that this migrator will use when traversing the collection and writing to documents.
 * @returns A new {@link DefaultMigrator} object.
 */
export function createMigrator<
  AppModelType = firestore.DocumentData,
  DbModelType extends firestore.DocumentData = firestore.DocumentData
>(traverser: Traverser<AppModelType, DbModelType>): DefaultMigrator<AppModelType, DbModelType>;

/**
 * Creates a migrator that facilitates database migrations. The migrator creates a default traverser that
 * it uses when traversing the collection and writing to documents. This migrator does not use atomic batch writes
 * so it is possible that when a write fails other writes go through.
 *
 * @param traversable - A collection-like traversable group of documents to migrate.
 * @param traversalConfig - Optional. The traversal configuration with which the default traverser will be created.
 * @returns A new {@link DefaultMigrator} object.
 * @throws {@link InvalidConfigError} Thrown if the specified `traversalConfig` is invalid.
 */
export function createMigrator<
  AppModelType = firestore.DocumentData,
  DbModelType extends firestore.DocumentData = firestore.DocumentData
>(
  traversable: Traversable<AppModelType, DbModelType>,
  traversalConfig?: Partial<TraversalConfig>
): DefaultMigrator<AppModelType, DbModelType>;

export function createMigrator<
  AppModelType = firestore.DocumentData,
  DbModelType extends firestore.DocumentData = firestore.DocumentData
>(
  traversableOrTraverser:
    | Traverser<AppModelType, DbModelType>
    | Traversable<AppModelType, DbModelType>,
  traversalConfig?: Partial<TraversalConfig>
): DefaultMigrator<AppModelType, DbModelType> {
  const traverser = isTraverser(traversableOrTraverser)
    ? (traversableOrTraverser as Traverser<AppModelType, DbModelType>)
    : createTraverser(
        traversableOrTraverser as Traversable<AppModelType, DbModelType>,
        traversalConfig
      );
  return new BasicDefaultMigratorImpl(traverser);
}
