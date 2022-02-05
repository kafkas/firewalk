import { SLLQueue } from '@proficient/ds';
import { IllegalArgumentError } from '../errors';

export class SLLQueueExtended<E> extends SLLQueue<E> {
  /**
   * Dequeues the first `itemCount` items into an array.
   *
   * @param itemCount - The number of items to dequeue.
   * @returns The array of dequeued items.
   * @throws {@link IllegalArgumentError} Thrown if `itemCount` is invalid.
   */
  public dequeueFirst(itemCount: number): E[] {
    if (!Number.isInteger(itemCount) || itemCount < 0 || itemCount > this.count) {
      throw new IllegalArgumentError(
        'The `itemCount` argument must be a non-negative integer less than or equal to the size of the queue.'
      );
    }

    const items = new Array<E>(itemCount);

    for (let i = 0; i < itemCount; i++) {
      items[i] = this.dequeue();
    }

    return items;
  }
}
