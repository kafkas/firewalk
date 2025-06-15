import type { firestore } from 'firebase-admin';
import type { Traverser } from '../../api';

export function isTraverser<
  AppModelType = firestore.DocumentData,
  DbModelType extends firestore.DocumentData = firestore.DocumentData,
>(candidate: unknown): candidate is Traverser<AppModelType, DbModelType> {
  const t = candidate as Traverser<AppModelType, DbModelType>;
  return (
    !!t &&
    typeof t === 'object' &&
    t.traversable !== null &&
    typeof t.traversable === 'object' &&
    t.traversalConfig !== null &&
    typeof t.traversalConfig === 'object' &&
    typeof t.withConfig === 'function' &&
    typeof t.withExitEarlyPredicate === 'function' &&
    typeof t.traverseEach === 'function' &&
    typeof t.traverse === 'function'
  );
}
