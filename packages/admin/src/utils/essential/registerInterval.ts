import { sleep } from './sleep';

export function registerInterval(callback: () => Promise<void>, ms: number): () => void {
  let shouldRun = true;

  (async () => {
    while (shouldRun) {
      await callback();
      await sleep(ms);
    }
  })();

  return () => {
    shouldRun = false;
  };
}
