import type { firestore } from 'firebase-admin';
import type { Traverser } from '../Traverser';
import { createTraverser } from '../createTraverser';
import type { Traversable, BaseTraversalConfig } from '../types';
import { isTraverser } from '../utils';
import { BatchMigrator } from './BatchMigrator';

/**
 * Creates a migrator that facilitates database migrations. Accepts a custom traverser object as argument which the
 * migrator will use when traversing the collection and writing to documents.
 *
 * This migrator uses batch writes when writing to docs so the entire operation will fail if a single write isn't successful.
 *
 * @param traverser The traverser object that this migrator will use when traversing the collection and writing to documents.
 * @returns A batch migrator object.
 */
export function createBatchMigrator<
  D extends firestore.DocumentData,
  C extends BaseTraversalConfig
>(traverser: Traverser<D, C>): BatchMigrator<D, C>;

/**
 * Creates a migrator that facilitates database migrations. The migrator creates a default (slow) traverser that
 * it uses when traversing the collection and writing to documents.
 *
 * This migrator uses batch writes when writing to docs so the entire operation will fail if a single write isn't successful.
 *
 * @param traversable A collection-like traversable group of documents.
 * @param traversalConfig Optional. The traversal configuration with which the default traverser will be created.
 * @returns A batch migrator object.
 */
export function createBatchMigrator<D extends firestore.DocumentData>(
  traversable: Traversable<D>,
  traversalConfig?: Partial<BaseTraversalConfig>
): BatchMigrator<D, BaseTraversalConfig>;

export function createBatchMigrator<
  D extends firestore.DocumentData,
  C extends BaseTraversalConfig
>(
  traversableOrTraverser: Traverser<D, C> | Traversable<D>,
  traversalConfig?: Partial<BaseTraversalConfig>
): BatchMigrator<D, C> | BatchMigrator<D, BaseTraversalConfig> {
  const traverser = isTraverser(traversableOrTraverser)
    ? traversableOrTraverser
    : createTraverser(traversableOrTraverser, traversalConfig);
  return new BatchMigrator(traverser);
}

export { BatchMigrator };
