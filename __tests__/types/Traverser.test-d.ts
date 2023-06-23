import type { firestore } from 'firebase-admin';
import { expectType } from 'tsd';
import {
  createTraverser,
  Traversable,
  TraversalConfig,
  TraversalResult,
  Traverser,
} from '../../src';
import { collectionRef, D } from './_helpers';

const traverser = createTraverser(collectionRef);

// TODO: Ideally we want to expect a firestore.CollectionReference<D> here because
// we initialized the traverser with a collection reference.
expectType<Traversable<D>>(traverser.traversable);

expectType<TraversalConfig>(traverser.traversalConfig);

(() => {
  // TODO: See if there is a better way to check inferred parameters
  const modifiedTraverser = traverser.withConfig({
    batchSize: 0,
    sleepTimeBetweenBatches: 0,
    maxDocCount: 0,
    maxConcurrentBatchCount: 0,
  });
  expectType<Traverser<D>>(modifiedTraverser);
})();

(() => {
  const modifiedTraverser = traverser.withExitEarlyPredicate((batchDocs, batchIndex) => {
    expectType<firestore.QueryDocumentSnapshot<D>[]>(batchDocs);
    expectType<number>(batchIndex);
    return false;
  });
  expectType<Traverser<D>>(modifiedTraverser);
})();

(async () => {
  const traversalResult1 = await traverser.traverseEach(async (doc, docIndex, batchIndex) => {
    expectType<firestore.QueryDocumentSnapshot<D>>(doc);
    expectType<number>(docIndex);
    expectType<number>(batchIndex);
  });
  expectType<TraversalResult>(traversalResult1);
})();

(async () => {
  const traversalResult2 = await traverser.traverse(async (batchDocs, batchIndex) => {
    expectType<firestore.QueryDocumentSnapshot<D>[]>(batchDocs);
    expectType<number>(batchIndex);
  });
  expectType<TraversalResult>(traversalResult2);
})();
