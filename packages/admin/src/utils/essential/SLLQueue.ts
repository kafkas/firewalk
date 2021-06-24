import { SLLNode } from './SLLNode';

/**
 * A FIFO queue implemented with a singly-linked list.
 */
export class SLLQueue<E> {
  private top: SLLNode<E> | null;
  private bottom: SLLNode<E> | null;
  private itemCount: number;

  public constructor() {
    this.top = null;
    this.bottom = null;
    this.itemCount = 0;
  }

  public get size(): number {
    return this.itemCount;
  }

  public isEmpty(): boolean {
    return this.size === 0;
  }

  public extractToArray(): E[] {
    const len = this.size;
    const items = new Array<E>(len);

    for (let i = 0; i < len; i++) {
      items[i] = this.dequeue();
    }

    return items;
  }

  /**
   * Pushes an item to the queue.
   */
  public enqueue(item: E): void {
    // Items are enqueued from the top
    const newNode = new SLLNode<E>(item);
    if (this.isEmpty()) {
      this.top = newNode;
      this.bottom = newNode;
    } else {
      this.validateNode(this.top);
      this.top.next = newNode;
      this.top = this.top.next;
    }
    this.itemCount++;
  }

  /**
   * Removes an item from the queue.
   */
  public dequeue(): E {
    // Items are dequeued from the bottom
    this.validateNonEmptyQueue();
    this.validateNode(this.bottom);
    const bottomItem = this.bottom.data;
    this.bottom = this.bottom.next;
    this.itemCount--;
    return bottomItem;
  }

  private validateNode(node: SLLNode<E> | null): asserts node {
    if (node === null) {
      throw new Error(
        'Node does not exist. This indicates an expected error which is likely caused by an incorrect implementation of this data structure.'
      );
    }
  }

  public peek(): E {
    this.validateNonEmptyQueue();
    this.validateNode(this.bottom);
    return this.bottom.data;
  }

  private validateNonEmptyQueue(): void {
    if (this.isEmpty()) {
      throw new Error('The queue is empty.');
    }
  }
}
