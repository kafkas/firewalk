import { sleep } from './sleep';

export function registerInterval(callback: () => Promise<void>, duration: number): () => void {
  let shouldRun = true;

  (async () => {
    while (shouldRun) {
      await callback();
      await sleep(duration);
    }
  })();

  return () => {
    shouldRun = false;
  };
}
