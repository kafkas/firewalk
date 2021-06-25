import type { firestore } from 'firebase-admin';
import type { Traversable, BaseTraversalConfig } from '../types';
import { SlowTraverser } from './SlowTraverser';

/**
 * Creates a traverser object that facilitates Firestore collection traversals. When traversing the collection,
 * this traverser invokes a specified async callback for each batch of document snapshots and waits for the callback
 * Promise to resolve before moving to the next batch.
 */
export function createTraverser<T extends Traversable<D>, D = firestore.DocumentData>(
  traversable: T,
  config?: Partial<BaseTraversalConfig>
): SlowTraverser<T, D> {
  return new SlowTraverser(traversable, config);
}

export { SlowTraverser };
