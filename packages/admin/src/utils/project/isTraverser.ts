import type { firestore } from 'firebase-admin';
import type { BaseTraversalConfig, Traversable } from '../../types';
import type { Traverser } from '../../Traverser';

export function isTraverser<
  D extends firestore.DocumentData,
  T extends Traversable<D>,
  C extends BaseTraversalConfig
>(candidate: Traverser<D, T, C> | unknown): candidate is Traverser<D, T, C> {
  const t = candidate as Traverser<D, T, C>;
  return (
    !!t &&
    typeof t.withConfig === 'function' &&
    typeof t.traverse === 'function' &&
    typeof t.traverseEach === 'function' &&
    t.traversable !== null &&
    typeof t.traversable === 'object'
  );
}
