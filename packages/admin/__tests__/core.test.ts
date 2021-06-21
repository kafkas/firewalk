import { firestore } from 'firebase-admin';
import { createTraverser, createBatchMigrator } from '../src';

const users = firestore().collection('users');

const traverser = createTraverser(users, {
  batchSize: 500,
  sleepTimeBetweenBatches: 1000,
});

const migrator = createBatchMigrator(users);

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
