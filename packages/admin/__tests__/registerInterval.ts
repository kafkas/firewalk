import { registerInterval, sleep } from '../../admin/src/utils';

async function main(): Promise<void> {
  const queue: null[] = [];
  const queueState = {
    isEmptying: false,
  };

  const emptyQueue = async (): Promise<void> => {
    queueState.isEmptying = true;
    while (queue.length !== 0) {
      queue.pop();
    }
    queueState.isEmptying = false;
  };

  const unregister1 = registerInterval(async () => {
    console.log('Interval 1');

    if (!queueState.isEmptying) {
      console.log('Emptying Queue now');
      await emptyQueue();
    }
  }, 2_500);

  const unregister2 = registerInterval(async () => {
    console.log('Interval 2');
    if (Math.random() < 0.9) {
      queue.push(null);
    }
  }, 500);

  let totalQueryCount = 0;

  while (++totalQueryCount < 10) {
    console.log('Sending API request 1', totalQueryCount);
    await sleep(1000);

    console.log('Sending API request 2');
    await sleep(1000);

    let trialCount = 0;
    console.log('Queue.length=', queue.length);

    while (queue.length > 10) {
      trialCount++;

      await sleep(250);
      if (trialCount > 100) {
        console.log('Have to stop now sorry');
        break;
      }
    }

    console.log('Final request');
    await sleep(1000);
  }

  unregister1();
  unregister2();
}

main();
