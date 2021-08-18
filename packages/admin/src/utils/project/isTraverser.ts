import type { TraversalConfig, Traverser } from '../../api';

export function isTraverser<C extends TraversalConfig, D>(
  candidate: Traverser<C, D> | unknown
): candidate is Traverser<C, D> {
  const t = candidate as Traverser<C, D>;
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
