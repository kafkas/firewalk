import type { firestore } from 'firebase-admin';
import type { TraversalConfig, Traverser } from '../../api';

export function isTraverser<D extends firestore.DocumentData, C extends TraversalConfig>(
  candidate: Traverser<D, C> | unknown
): candidate is Traverser<D, C> {
  const t = candidate as Traverser<D, C>;
  return (
    !!t &&
    typeof t.traverse === 'function' &&
    typeof t.traverseEach === 'function' &&
    t.traversable !== null &&
    typeof t.traversable === 'object'
  );
}
