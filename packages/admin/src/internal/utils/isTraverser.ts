import type { Traverser } from '../../api';

export function isTraverser<D>(candidate: Traverser<D> | unknown): candidate is Traverser<D> {
  const t = candidate as Traverser<D>;
  return (
    !!t &&
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
