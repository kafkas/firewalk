import { firestore } from 'firebase-admin';
import { CollectionTraverser } from '../src';

// TODO

const traverser = new CollectionTraverser(firestore().collection('users'), {
  batchSize: 500,
  sleepTimeBetweenBatches: 1000,
});

const aaa = new Array<number>().filter((val, idx) => {});
const { updatedDocCount } = await traverser.update(
  (snapshot) => ({
    isAdmin: false,
  }),
  (snapshot) => snapshot.data().isAdmin === undefined
);
