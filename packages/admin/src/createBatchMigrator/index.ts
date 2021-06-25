import type { firestore } from 'firebase-admin';
import type { Traverser } from '../Traverser';
import { createTraverser, SlowTraverser } from '../createTraverser';
import type { Traversable, BaseTraversalConfig } from '../types';
import { isTraverser } from '../utils';
import { BatchMigrator } from './BatchMigrator';

/**
 * Creates a migrator that facilitates database migrations. Accepts a custom traverser object as argument which the
 * migrator will use when traversing the collection and writing to documents.
 *
 * This migrator uses batch writes when writing to docs so the entire operation will fail if a single write isn't successful.
 * @param traverser The traverser object that this migrator will use when traversing the collection and writing to documents.
 */
export function createBatchMigrator<
  D extends firestore.DocumentData,
  T extends Traversable<D>,
  C extends BaseTraversalConfig,
  TR extends Traverser<D, T, C>
>(traverser: TR): BatchMigrator<D, T, C, TR>;

/**
 * Creates a migrator that facilitates database migrations. The migrator creates a default (slow) traverser that
 * it uses when traversing the collection and writing to documents.
 *
 * This migrator uses batch writes when writing to docs so the entire operation will fail if a single write isn't successful.
 * @param traversable A collection-like traversable group of documents to migrate.
 * @param traversalConfig Optional. The traversal configuration with which the default traverser will be created.
 */
export function createBatchMigrator<T extends Traversable<D>, D extends firestore.DocumentData>(
  traversable: T,
  traversalConfig?: Partial<BaseTraversalConfig>
): BatchMigrator<D, T, BaseTraversalConfig, SlowTraverser<D, T>>;

export function createBatchMigrator<
  D extends firestore.DocumentData,
  T extends Traversable<D>,
  C extends BaseTraversalConfig,
  TR extends Traverser<D, T, C>
>(
  traversableOrTraverser: TR | T,
  traversalConfig?: Partial<BaseTraversalConfig>
): BatchMigrator<D, T, C, TR> | BatchMigrator<D, T, BaseTraversalConfig, SlowTraverser<D, T>> {
  if (isTraverser(traversableOrTraverser)) {
    const traverser = traversableOrTraverser;
    return new BatchMigrator(traverser);
  } else {
    const traverser = createTraverser<D, T>(traversableOrTraverser, traversalConfig);
    return new BatchMigrator(traverser);
  }
}

export { BatchMigrator };
