import type { Traverser } from './Traverser';

export function sleep(duration: number): Promise<void> {
  return new Promise((r) => setTimeout(r, duration));
}

export function isPositiveInteger(num: number): boolean {
  return Number.isInteger(num) && num > 0;
}

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
