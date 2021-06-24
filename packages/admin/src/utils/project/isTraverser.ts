import type { Traverser } from '../../Traverser';

export function isTraverser<T>(candidate: Traverser<T> | unknown): candidate is Traverser<T> {
  const t = candidate as Traverser<T>;
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
