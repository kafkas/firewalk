import { registerInterval } from '../registerInterval';
import { sleep } from '../sleep';

describe('registerInterval', () => {
  test('runs interval enough times', async () => {
    let processCount = 0;

    const unsubscribe = registerInterval(async () => {
      processCount++;
    }, 100);

    await sleep(500);
    unsubscribe();

    expect(processCount).toBeGreaterThanOrEqual(5);
  });
});
