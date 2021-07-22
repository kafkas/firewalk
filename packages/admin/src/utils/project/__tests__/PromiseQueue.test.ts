import { sleep } from '../../essential';
import { PromiseQueue } from '../PromiseQueue';

describe('PromiseQueue', () => {
  const runTask = (): Promise<void> => sleep(0);

  test('always shows correct size', async () => {
    const q = new PromiseQueue<void>();

    expect(q.size).toBe(0);

    q.enqueue(runTask());
    q.enqueue(runTask());

    expect(q.size).toBe(2);

    await q.process();

    expect(q.size).toBe(0);
  });
});
