import { SLLQueue } from '../SLLQueue';

describe('SLLQueue', () => {
  test('always shows correct size', () => {
    const q = new SLLQueue<string>();

    expect(q.size).toBe(0);
    expect(q.isEmpty()).toStrictEqual(true);

    q.enqueue('a');
    q.enqueue('b');
    q.enqueue('c');

    expect(q.size).toBe(3);
    expect(q.isEmpty()).toStrictEqual(false);

    q.dequeue();
    q.dequeue();

    expect(q.size).toBe(1);
    expect(q.isEmpty()).toStrictEqual(false);

    q.dequeue();

    expect(q.size).toBe(0);
    expect(q.isEmpty()).toStrictEqual(true);
  });

  test('throws if dequeued while empty', () => {
    const q = new SLLQueue<string>();
    expect(() => q.dequeue()).toThrow();
  });

  test('respects FIFO order when dequeued', () => {
    const q = new SLLQueue<number | string>();
    q.enqueue(1);
    q.enqueue(2);
    q.enqueue('3');

    expect(q.dequeue()).toStrictEqual(1);
    expect(q.dequeue()).toStrictEqual(2);

    q.enqueue(4);
    q.enqueue(5);

    expect(q.dequeue()).toStrictEqual('3');
    expect(q.dequeue()).toStrictEqual(4);
    expect(q.dequeue()).toStrictEqual(5);
  });

  test('dequeues first `n` items correctly', () => {
    const q = new SLLQueue<number>();

    q.enqueue(1);
    q.enqueue(2);
    q.enqueue(3);
    q.enqueue(4);
    q.enqueue(5);

    expect(q.dequeueFirst(0)).toEqual([]);
    expect(q.dequeueFirst(1)).toEqual([1]);
    expect(q.size).toBe(4);
    expect(q.dequeueFirst(2)).toEqual([2, 3]);
    expect(q.size).toBe(2);
    expect(q.dequeueFirst(2)).toEqual([4, 5]);
    expect(q.size).toBe(0);
    expect(q.dequeueFirst(0)).toEqual([]);
  });

  test('throws if dequeued `itemCount` argument is invalid', () => {
    const q = new SLLQueue<number>();
    q.enqueue(1);
    q.enqueue(2);
    q.enqueue(3);

    expect(() => q.dequeueFirst(-2)).toThrow();
    expect(() => q.dequeueFirst(-1)).toThrow();
    expect(() => q.dequeueFirst(1.01)).toThrow();
    expect(() => q.dequeueFirst(2.5)).toThrow();
    expect(() => q.dequeueFirst(4)).toThrow();
    expect(() => q.dequeueFirst(5)).toThrow();

    expect(() => q.dequeueFirst(0)).not.toThrow();
    expect(() => q.dequeueFirst(1)).not.toThrow();
    expect(() => q.dequeueFirst(2)).not.toThrow();
  });

  test('dequeues all items correctly', () => {
    const q = new SLLQueue<number>();

    expect(q.dequeueAll()).toEqual([]);

    q.enqueue(1);
    q.enqueue(2);
    q.enqueue(3);

    expect(q.dequeueAll()).toEqual([1, 2, 3]);
    expect(q.isEmpty()).toBe(true);

    q.enqueue(2);
    q.enqueue(1);

    expect(q.dequeueAll()).toEqual([2, 1]);
    expect(q.isEmpty()).toBe(true);
  });
});
