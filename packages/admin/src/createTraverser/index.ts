import type { firestore } from 'firebase-admin';
import type { Traversable, BaseTraversalConfig } from '../types';
import { SlowTraverser } from './SlowTraverser';

/**
 * Creates a traverser object that facilitates Firestore collection traversals. When traversing the collection,
 * this traverser invokes a specified async callback for each batch of document snapshots and waits for the callback
 * Promise to resolve before moving to the next batch.
 */
export function createTraverser<D extends firestore.DocumentData, T extends Traversable<D>>(
  traversable: T,
  config?: Partial<BaseTraversalConfig>
): SlowTraverser<D, T> {
  return new SlowTraverser(traversable, config);
}

export { SlowTraverser };
