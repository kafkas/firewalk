import { PromiseQueue, registerInterval, sleep } from '../../admin/src/utils';

const callback = (): Promise<void> => sleep(2_000);

const MAX_QUEUE_SIZE = 10;
const DB_BATCH_COUNT = 100;

async function main(): Promise<void> {
  const callbackPromiseQueue = new PromiseQueue<void>();

  const unregister1 = registerInterval(async () => {
    console.log('Process Interval:', Date.now());

    if (!callbackPromiseQueue.isProcessing()) {
      console.log('Gonna process queue now. Queue size=', callbackPromiseQueue.size);
      await callbackPromiseQueue.process();
      console.log('Done processing!. Queue size=', callbackPromiseQueue.size);
    }
  }, 500);

  let curBatchIndex = 0;

  while (curBatchIndex++ < DB_BATCH_COUNT) {
    callbackPromiseQueue.enqueue(callback());
    console.log('Added to callback queue. Queue size:', callbackPromiseQueue.size);

    while (callbackPromiseQueue.size >= MAX_QUEUE_SIZE) {
      console.log('Queue too large. Have to wait.', callbackPromiseQueue.size);
      await sleep(250);
    }

    await sleep(100);
  }

  unregister1();

  console.log('Final process. Queue size:', callbackPromiseQueue.size);
  await callbackPromiseQueue.process();

  console.log('All done. Queue size:', callbackPromiseQueue.size);
}

main();
