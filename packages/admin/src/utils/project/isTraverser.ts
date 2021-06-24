import type { Traverser } from '../../Traverser';

export function isTraverser<D>(candidate: Traverser<D> | unknown): candidate is Traverser<D> {
  const t = candidate as Traverser<D>;
  return (
    !!t &&
    typeof t.withConfig === 'function' &&
    typeof t.onBeforeBatchStart === 'function' &&
    typeof t.onAfterBatchComplete === 'function' &&
    typeof t.traverse === 'function' &&
    typeof t.traverseEach === 'function' &&
    t.traversable !== null &&
    typeof t.traversable === 'object'
  );
}
