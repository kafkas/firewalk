import { firestore } from 'firebase-admin';
import { CollectionTraverser, CollectionMigrator } from '../src';

const traverser = new CollectionTraverser(firestore().collection('users'), {
  batchSize: 500,
  sleepTimeBetweenBatches: 1000,
});

const migrator = new CollectionMigrator(firestore().collection('users'));

(async () => {
  const { updatedDocCount } = await migrator.update(
    {
      isAdmin: false,
    },
    (snapshot) => snapshot.data().isAdmin === undefined
  );

  console.log(`Updated ${updatedDocCount} documents!`);
})();
