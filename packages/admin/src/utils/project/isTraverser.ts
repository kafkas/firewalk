import type { firestore } from 'firebase-admin';
import type { BaseTraversalConfig, Traversable } from '../../types';
import type { Traverser } from '../../Traverser';

export function isTraverser<
  T extends Traversable<D>,
  C extends BaseTraversalConfig,
  D = firestore.DocumentData
>(candidate: Traverser<T, C, D> | unknown): candidate is Traverser<T, C, D> {
  const t = candidate as Traverser<T, C, D>;
  return (
    !!t &&
    typeof t.withConfig === 'function' &&
    typeof t.traverse === 'function' &&
    typeof t.traverseEach === 'function' &&
    t.traversable !== null &&
    typeof t.traversable === 'object'
  );
}
