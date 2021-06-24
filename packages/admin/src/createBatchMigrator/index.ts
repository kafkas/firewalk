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
export function createBatchMigrator<T = firestore.DocumentData>(
  traverser: Traverser<T>
): Migrator<T>;

/**
 * Creates a migrator that facilitates database migrations. The migrator creates a default (slow) traverser that
 * it uses when traversing the collection and writing to documents.
 *
 * This migrator uses batch writes when writing to docs so the entire operation will fail if a single write isn't successful.
 * @param traversable A collection-like traversable group of documents to migrate.
 * @param traversalConfig Optional. The traversal configuration with which the default traverser will be created.
 */
export function createBatchMigrator<T = firestore.DocumentData>(
  traversable: Traversable<T>,
  traversalConfig?: Partial<BaseTraversalConfig>
): Migrator<T>;

export function createBatchMigrator<T = firestore.DocumentData>(
  traversableOrTraverser: Traverser<T> | Traversable<T>,
  traversalConfig?: Partial<BaseTraversalConfig>
): Migrator<T> {
  return new BatchMigrator(traversableOrTraverser, traversalConfig);
}