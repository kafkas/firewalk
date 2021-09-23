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

  test('dequeues all correctly', () => {
    const q = new SLLQueue<number>();

    q.enqueue(1);
    q.enqueue(2);
    q.enqueue(3);

    q.dequeueAll();

    expect(q.isEmpty()).toBe(true);
  });

  test('dequeues all to array in FIFO order', () => {
    const q = new SLLQueue<number>();

    expect(q.dequeueAll()).toEqual([]);

    q.enqueue(1);
    q.enqueue(2);
    q.enqueue(3);

    expect(q.dequeueAll()).toEqual([1, 2, 3]);

    q.enqueue(2);
    q.enqueue(1);

    expect(q.dequeueAll()).toEqual([2, 1]);
  });
});
