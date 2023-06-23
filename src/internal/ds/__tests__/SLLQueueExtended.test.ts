import { SLLQueueExtended } from '..';

describe('SLLQueueExtended', () => {
  describe('dequeueFirst(n)', () => {
    test('returns empty array if empty and n=0', () => {
      const q = new SLLQueueExtended<number>();
      expect(q.dequeueFirst(0)).toEqual([]);
    });

    test('returns empty array if n=0', () => {
      const q = new SLLQueueExtended<number>();
      q.enqueue(1);
      expect(q.dequeueFirst(0)).toEqual([]);
    });

    describe('throws if', () => {
      test('n is negative', () => {
        const q = new SLLQueueExtended<number>();
        expect(() => q.dequeueFirst(-1)).toThrow();
      });

      test('n is not an integer', () => {
        const q = new SLLQueueExtended<number>();
        q.enqueue(1);
        q.enqueue(2);
        expect(() => q.dequeueFirst(1.5)).toThrow();
      });

      test('n is greater than queue size', () => {
        const q = new SLLQueueExtended<number>();
        q.enqueue(1);
        q.enqueue(2);
        expect(() => q.dequeueFirst(3)).toThrow();
      });
    });

    test('returns correct number of items in FIFO order', () => {
      const q = new SLLQueueExtended<number>();
      q.enqueue(1);
      q.enqueue(2);
      q.enqueue(3);
      q.enqueue(4);
      expect(q.dequeueFirst(3)).toEqual([1, 2, 3]);
    });
  });
});
