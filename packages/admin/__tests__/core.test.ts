import { firestore } from 'firebase-admin';
import { createTraverser, createBatchMigrator } from '../src';

function doStuff(cb: (nowTimestamp: number) => void): void;

function doStuff(obj: Record<string, number>, condition: string): void;

function doStuff(
  param1: ((nowTimestamp: number) => void) | Record<string, number>,
  condition?: string
): void {
  // ...
}

doStuff({}, '');

doStuff((now) => {
  //
});

const traverser = createTraverser(firestore().collection('users'), {
  batchSize: 500,
  sleepTimeBetweenBatches: 1000,
});

traverser.setConfig({ maxDocCount: 5 });

const migrator = createBatchMigrator(firestore().collection('users'));

(async () => {
  // S1

  await migrator.update((snap) => {
    console.log(snap.data());
    return snap.exists;
  });

  await migrator.update(
    (snap) => {
      console.log(snap.data());
      return snap.exists;
    },
    (snap) => snap.exists
  );

  // S2

  await migrator.update({
    test: 'abc',
  });

  await migrator.update(
    {
      isAdmin: false,
    },
    (snap) => snap.data().isAdmin
  );

  // S3

  await migrator.update('some_field', 123, (snap) => snap.data().isAdmin);

  await migrator.update('some_field', 123);
})();
