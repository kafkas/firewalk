import type { firestore } from 'firebase-admin';
import { isTraverser } from '../utils';
import { BasicDefaultMigratorImplementation } from '../implementations';
import type { DefaultMigrator, Traversable, TraversalConfig, Traverser } from './interfaces';
import { createTraverser } from './createTraverser';

/**
 * Creates a migrator that facilitates database migrations. Accepts a custom traverser object as argument which the
 * migrator will use when traversing the collection and writing to documents.
 *
 * This migrator does not use atomic batch writes so it is possible that when a write fails other writes go through.
 * @param traverser The traverser object that this migrator will use when traversing the collection and writing to documents.
 * @returns A new {@link DefaultMigrator} object.
 */
export function createMigrator<D extends firestore.DocumentData, C extends TraversalConfig>(
  traverser: Traverser<D, C>
): DefaultMigrator<D, C>;

/**
 * Creates a migrator that facilitates database migrations. The migrator creates a default (slow) traverser that
 * it uses when traversing the collection and writing to documents.
 *
 * This migrator does not use atomic batch writes so it is possible that when a write fails other writes go through.
 * @param traversable A collection-like traversable group of documents to migrate.
 * @param traversalConfig Optional. The traversal configuration with which the default traverser will be created.
 * @returns A new {@link DefaultMigrator} object.
 */
export function createMigrator<D extends firestore.DocumentData>(
  traversable: Traversable<D>,
  traversalConfig?: Partial<TraversalConfig>
): DefaultMigrator<D, TraversalConfig>;

export function createMigrator<D extends firestore.DocumentData, C extends TraversalConfig>(
  traversableOrTraverser: Traverser<D, C> | Traversable<D>,
  traversalConfig?: Partial<TraversalConfig>
): DefaultMigrator<D, C> | DefaultMigrator<D, TraversalConfig> {
  const traverser = isTraverser(traversableOrTraverser)
    ? traversableOrTraverser
    : createTraverser(traversableOrTraverser, traversalConfig);
  return new BasicDefaultMigratorImplementation(traverser);
}
