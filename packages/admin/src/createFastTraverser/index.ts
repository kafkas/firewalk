import type { firestore } from 'firebase-admin';
import type { Traverser } from '../Traverser';
import type { Traversable, FastTraversalConfig } from '../types';
import { FastTraverser } from './FastTraverser';

/**
 * Creates a fast traverser object that facilitates Firestore collection traversals. When traversing
 * the collection, this traverser invokes a specified async callback for each batch of document
 * snapshots and immediately moves to the next batch. It does not wait for the callback Promise to resolve
 * before moving to the next batch so there is no guarantee that any given batch will finish processing
 * before a later batch. This traverser uses more memory but is significantly faster than the default traverser.
 */
export function createFastTraverser<D = firestore.DocumentData>(
  traversable: Traversable<D>,
  config?: Partial<FastTraversalConfig>
): Traverser<D> {
  return new FastTraverser(traversable, config);
}
