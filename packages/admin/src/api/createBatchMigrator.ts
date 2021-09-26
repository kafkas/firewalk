import type { firestore } from 'firebase-admin';
import { isTraverser } from '../utils';
import { BasicBatchMigratorImpl } from '../implementations';
import type { BatchMigrator, Traversable, TraversalConfig, Traverser } from './interfaces';
import { createTraverser } from './createTraverser';

/**
 * Creates a migrator that facilitates database migrations. Accepts a custom traverser object as argument which the
 * migrator will use when traversing the collection and writing to documents. This migrator uses atomic batch writes
 * when writing to docs so the entire operation will fail if a single write isn't successful.
 *
 * @remarks
 *
 * Note that the {@link TraversalConfig.batchSize} config value must not exceed 500 for {@link BatchMigrator}. This is
 * because in Firestore, each write batch can write to a maximum of 500 documents. This function will throw an error if
 * you pass an incompatible traverser.
 *
 * @param traverser - The traverser object that this migrator will use when traversing the collection and writing to documents.
 * @returns A new {@link BatchMigrator} object.
 */
export function createBatchMigrator<
  C extends TraversalConfig = TraversalConfig,
  D = firestore.DocumentData
>(traverser: Traverser<C, D>): BatchMigrator<C, D>;

/**
 * Creates a migrator that facilitates database migrations. The migrator creates a default (slow) traverser that
 * it uses when traversing the collection and writing to documents. This migrator uses atomic batch writes when writing
 * to docs so the entire operation will fail if a single write isn't successful.
 *
 * @remarks
 *
 * Note that the {@link TraversalConfig.batchSize} config value must not exceed 500 for {@link BatchMigrator}. This is
 * because in Firestore, each write batch can write to a maximum of 500 documents. This function will throw an error if
 * you pass a traversal config that is incompatible with {@link BatchMigrator}.
 *
 * @param traversable - A collection-like traversable group of documents.
 * @param traversalConfig - Optional. The traversal configuration with which the default traverser will be created.
 * @returns A new {@link BatchMigrator} object.
 */
export function createBatchMigrator<D = firestore.DocumentData>(
  traversable: Traversable<D>,
  traversalConfig?: Partial<TraversalConfig>
): BatchMigrator<TraversalConfig, D>;

export function createBatchMigrator<
  C extends TraversalConfig = TraversalConfig,
  D = firestore.DocumentData
>(
  traversableOrTraverser: Traverser<C, D> | Traversable<D>,
  traversalConfig?: Partial<TraversalConfig>
): BatchMigrator<C, D> | BatchMigrator<TraversalConfig, D> {
  const traverser = isTraverser(traversableOrTraverser)
    ? traversableOrTraverser
    : createTraverser(traversableOrTraverser, traversalConfig);
  return new BasicBatchMigratorImpl(traverser);
}
