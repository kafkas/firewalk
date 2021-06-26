import type { firestore } from 'firebase-admin';
import type { Traversable, BaseTraversalConfig } from '../types';
import { SlowTraverser } from './SlowTraverser';

/**
 * Creates a traverser object that facilitates Firestore collection traversals. When traversing the collection,
 * this traverser invokes a specified async callback for each batch of document snapshots and waits for the callback
 * Promise to resolve before moving to the next batch.
 *
 * @param traversable A collection-like traversable group of documents.
 * @param config Optional. The traversal configuration with which the traverser will be created.
 * @returns A default (slow) traverser object.
 */
export function createTraverser<D extends firestore.DocumentData>(
  traversable: Traversable<D>,
  config?: Partial<BaseTraversalConfig>
): SlowTraverser<D> {
  return new SlowTraverser(traversable, config);
}

export { SlowTraverser };
