import { firestore } from 'firebase-admin';
import { createBatchMigrator } from '../src';

const userPostsCollectionGroup = firestore().collection('projects');
const migrator = createBatchMigrator(userPostsCollectionGroup, { batchSize: 250 });

const { migratedDocCount } = await migrator.update('isCompleted', false);
console.log(`Successfully updated ${migratedDocCount} projects!`);

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
