import type { TraversalConfig, Traverser } from '../../api';

export function isTraverser<C extends TraversalConfig, D>(
  candidate: Traverser<C, D> | unknown
): candidate is Traverser<C, D> {
  const t = candidate as Traverser<C, D>;
  return (
    !!t &&
    typeof t.traverse === 'function' &&
    typeof t.traverseEach === 'function' &&
    t.traversable !== null &&
    typeof t.traversable === 'object'
  );
}
