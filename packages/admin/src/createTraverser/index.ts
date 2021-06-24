import type { firestore } from 'firebase-admin';
import type { Traverser } from '../Traverser';
import type { Traversable, BaseTraversalConfig } from '../types';
import { DefaultTraverser } from './DefaultTraverser';

/**
 * Creates a traverser object that facilitates Firestore collection traversals. When traversing the collection,
 * this traverser invokes a specified async callback for each batch of document snapshots and waits for the callback
 * Promise to resolve before moving to the next batch.
 */
export function createTraverser<T = firestore.DocumentData>(
  traversable: Traversable<T>,
  config?: Partial<BaseTraversalConfig>
): Traverser<T> {
  return new DefaultTraverser(traversable, config);
}
