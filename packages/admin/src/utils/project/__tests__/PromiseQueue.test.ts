import { sleep } from '../../essential';
import { PromiseQueue } from '../PromiseQueue';

describe('PromiseQueue', () => {
  const runTask = (): Promise<void> => sleep(0);

  test('correctly processes all items', async () => {
    const q = new PromiseQueue<void>();

    expect(q.size).toBe(0);

    q.enqueue(runTask());
    q.enqueue(runTask());
    q.enqueue(runTask());

    expect(q.size).toBe(3);

    await q.processAll();

    expect(q.size).toBe(0);
  });

  test('correctly processes the first `n` items', async () => {
    const q = new PromiseQueue<void>();

    q.enqueue(runTask());
    q.enqueue(runTask());
    q.enqueue(runTask());

    await q.processFirst(0);

    expect(q.size).toBe(3);

    await q.processFirst(1);

    expect(q.size).toBe(2);

    await q.processFirst(2);

    expect(q.size).toBe(0);
  });
});
