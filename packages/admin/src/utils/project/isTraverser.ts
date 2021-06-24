import type { firestore } from 'firebase-admin';
import type { Traversable } from '../../types';
import type { Traverser } from '../../Traverser';

export function isTraverser<T extends Traversable<D>, D = firestore.DocumentData>(
  candidate: Traverser<T, D> | unknown
): candidate is Traverser<T, D> {
  const t = candidate as Traverser<T, D>;
  return (
    !!t &&
    typeof t.withConfig === 'function' &&
    typeof t.traverse === 'function' &&
    typeof t.traverseEach === 'function' &&
    t.traversable !== null &&
    typeof t.traversable === 'object'
  );
}
