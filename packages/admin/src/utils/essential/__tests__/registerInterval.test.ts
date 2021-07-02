import { registerInterval } from '../registerInterval';
import { sleep } from '../sleep';

describe('registerInterval', () => {
  test('runs interval enough times', async () => {
    let processCount = 0;

    const unregister = registerInterval(async () => {
      processCount++;
    }, 100);

    await sleep(500);
    await unregister();

    expect(processCount).toBeGreaterThanOrEqual(5);
  });

  test('does not run interval after unsubscribing', async () => {
    let processCount = 0;

    const unregister = registerInterval(async () => {
      processCount++;
    }, 10);

    await sleep(100);
    await unregister();
    const processCountFinal = processCount;

    await sleep(100);

    expect(processCount).toBe(processCountFinal);
  });
});
