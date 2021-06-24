import type { firestore } from 'firebase-admin';
import type { Traverser } from '../Traverser';
import type { Migrator } from '../Migrator';
import type { Traversable, BaseTraversalConfig } from '../types';
import { BatchMigrator } from './BatchMigrator';

/**
 * Creates a migrator that facilitates database migrations. Accepts a custom traverser object as argument which the
 * migrator will use when traversing the collection and writing to documents.
 *
 * This migrator uses batch writes when writing to docs so the entire operation will fail if a single write isn't successful.
 * @param traverser The traverser object that this migrator will use when traversing the collection and writing to documents.
 */
export function createBatchMigrator<D = firestore.DocumentData>(
  traverser: Traverser<D>
): Migrator<D>;

/**
 * Creates a migrator that facilitates database migrations. The migrator creates a default (slow) traverser that
 * it uses when traversing the collection and writing to documents.
 *
 * This migrator uses batch writes when writing to docs so the entire operation will fail if a single write isn't successful.
 * @param traversable A collection-like traversable group of documents to migrate.
 * @param traversalConfig Optional. The traversal configuration with which the default traverser will be created.
 */
export function createBatchMigrator<D = firestore.DocumentData>(
  traversable: Traversable<D>,
  traversalConfig?: Partial<BaseTraversalConfig>
): Migrator<D>;

export function createBatchMigrator<D = firestore.DocumentData>(
  traversableOrTraverser: Traverser<D> | Traversable<D>,
  traversalConfig?: Partial<BaseTraversalConfig>
): Migrator<D> {
  return new BatchMigrator(traversableOrTraverser, traversalConfig);
}
