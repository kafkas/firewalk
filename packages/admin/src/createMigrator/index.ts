import type { firestore } from 'firebase-admin';
import type { Traverser } from '../Traverser';
import { createTraverser, SlowTraverser } from '../createTraverser';
import type { Traversable, BaseTraversalConfig } from '../types';
import { isTraverser } from '../utils';
import { DefaultMigrator } from './DefaultMigrator';

/**
 * Creates a migrator that facilitates database migrations. Accepts a custom traverser object as argument which the
 * migrator will use when traversing the collection and writing to documents.
 *
 * This migrator does not use atomic writes so it is possible that when a write fails other writes go through.
 * @param traverser The traverser object that this migrator will use when traversing the collection and writing to documents.
 */
export function createMigrator<
  D extends firestore.DocumentData,
  C extends BaseTraversalConfig,
  T extends Traverser<D, C>
>(traverser: Traverser<D, C>): DefaultMigrator<D, C, T>;

/**
 * Creates a migrator that facilitates database migrations. The migrator creates a default (slow) traverser that
 * it uses when traversing the collection and writing to documents.
 *
 * This migrator does not use atomic writes so it is possible that when a write fails other writes go through.
 * @param traversable A collection-like traversable group of documents to migrate.
 * @param traversalConfig Optional. The traversal configuration with which the default traverser will be created.
 */
export function createMigrator<D extends firestore.DocumentData>(
  traversable: Traversable<D>,
  traversalConfig?: Partial<BaseTraversalConfig>
): DefaultMigrator<D, BaseTraversalConfig, SlowTraverser<D>>;

export function createMigrator<
  D extends firestore.DocumentData,
  C extends BaseTraversalConfig,
  T extends Traverser<D, C>
>(
  traversableOrTraverser: T | Traversable<D>,
  traversalConfig?: Partial<BaseTraversalConfig>
): DefaultMigrator<D, C, T> | DefaultMigrator<D, BaseTraversalConfig, SlowTraverser<D>> {
  const traverser = isTraverser(traversableOrTraverser)
    ? traversableOrTraverser
    : createTraverser(traversableOrTraverser, traversalConfig);
  return new DefaultMigrator(traverser);
}

export { DefaultMigrator };
