import type { firestore } from 'firebase-admin';
import { expectType } from 'tsd';
import {
  createTraverser,
  SlowTraverser,
  Traversable,
  TraversalConfig,
  TraversalResult,
} from '../../src';
import { collectionRef, D } from './_helpers';

const slowTraverser = createTraverser(collectionRef);

// TODO: Ideally we want to expect a firestore.CollectionReference<D> here because
// we initialized the traverser with a collection reference.
expectType<Traversable<D>>(slowTraverser.traversable);

expectType<TraversalConfig>(slowTraverser.traversalConfig);

(() => {
  // TODO: See if there is a better way to check inferred parameters
  const modifiedTraverser = slowTraverser.withConfig({
    batchSize: 0,
    sleepBetweenBatches: false,
    sleepTimeBetweenBatches: 0,
    maxDocCount: 0,
  });
  expectType<SlowTraverser<D>>(modifiedTraverser);
})();

(() => {
  const modifiedTraverser = slowTraverser.withExitEarlyPredicate((batchDocs, batchIndex) => {
    expectType<firestore.QueryDocumentSnapshot<D>[]>(batchDocs);
    expectType<number>(batchIndex);
    return false;
  });
  expectType<SlowTraverser<D>>(modifiedTraverser);
})();

(async () => {
  const traversalResult1 = await slowTraverser.traverseEach(async (doc, docIndex, batchIndex) => {
    expectType<firestore.QueryDocumentSnapshot<D>>(doc);
    expectType<number>(docIndex);
    expectType<number>(batchIndex);
  });
  expectType<TraversalResult>(traversalResult1);
})();

(async () => {
  const traversalResult2 = await slowTraverser.traverse(async (batchDocs, batchIndex) => {
    expectType<firestore.QueryDocumentSnapshot<D>[]>(batchDocs);
    expectType<number>(batchIndex);
  });
  expectType<TraversalResult>(traversalResult2);
})();