import type { firestore } from 'firebase-admin';
import { isTraverser } from '../utils';
import { BasicBatchMigratorImplementation } from '../implementations';
import type { BatchMigrator, Traversable, TraversalConfig, Traverser } from './interfaces';
import { createTraverser } from './createTraverser';

/**
 * Creates a migrator that facilitates database migrations. Accepts a custom traverser object as argument which the
 * migrator will use when traversing the collection and writing to documents. This migrator uses atomic batch writes
 * when writing to docs so the entire operation will fail if a single write isn't successful.
 *
 * @param traverser The traverser object that this migrator will use when traversing the collection and writing to documents.
 * @returns A new {@link BatchMigrator} object.
 */
export function createBatchMigrator<D extends firestore.DocumentData, C extends TraversalConfig>(
  traverser: Traverser<D, C>
): BatchMigrator<D, C>;

/**
 * Creates a migrator that facilitates database migrations. The migrator creates a default (slow) traverser that
 * it uses when traversing the collection and writing to documents. This migrator uses atomic batch writes when writing
 * to docs so the entire operation will fail if a single write isn't successful.
 *
 * @param traversable A collection-like traversable group of documents.
 * @param traversalConfig Optional. The traversal configuration with which the default traverser will be created.
 * @returns A new {@link BatchMigrator} object.
 */
export function createBatchMigrator<D extends firestore.DocumentData>(
  traversable: Traversable<D>,
  traversalConfig?: Partial<TraversalConfig>
): BatchMigrator<D, TraversalConfig>;

export function createBatchMigrator<D extends firestore.DocumentData, C extends TraversalConfig>(
  traversableOrTraverser: Traverser<D, C> | Traversable<D>,
  traversalConfig?: Partial<TraversalConfig>
): BatchMigrator<D, C> | BatchMigrator<D, TraversalConfig> {
  const traverser = isTraverser(traversableOrTraverser)
    ? traversableOrTraverser
    : createTraverser(traversableOrTraverser, traversalConfig);
  return new BasicBatchMigratorImplementation(traverser);
}
