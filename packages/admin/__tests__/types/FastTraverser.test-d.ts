import type { firestore } from 'firebase-admin';
import { expectType } from 'tsd';
import {
  createFastTraverser,
  FastTraversalConfig,
  FastTraverser,
  Traversable,
  TraversalResult,
} from '../../src';
import { collectionRef, D } from './_helpers';

const fastTraverser = createFastTraverser(collectionRef);

// TODO: Ideally we want to expect a firestore.CollectionReference<D> here because
// we initialized the traverser with a collection reference.
expectType<Traversable<D>>(fastTraverser.traversable);

expectType<FastTraversalConfig>(fastTraverser.traversalConfig);

(() => {
  // TODO: See if there is a better way to check inferred parameters
  const modifiedTraverser = fastTraverser.withConfig({
    batchSize: 0,
    sleepBetweenBatches: false,
    sleepTimeBetweenBatches: 0,
    maxDocCount: 0,
    maxConcurrentBatchCount: 0,
  });
  expectType<FastTraverser<D>>(modifiedTraverser);
})();

(() => {
  const modifiedTraverser = fastTraverser.withExitEarlyPredicate((batchDocs, batchIndex) => {
    expectType<firestore.QueryDocumentSnapshot<D>[]>(batchDocs);
    expectType<number>(batchIndex);
    return false;
  });
  expectType<FastTraverser<D>>(modifiedTraverser);
})();

(async () => {
  const traversalResult1 = await fastTraverser.traverseEach(async (doc, docIndex, batchIndex) => {
    expectType<firestore.QueryDocumentSnapshot<D>>(doc);
    expectType<number>(docIndex);
    expectType<number>(batchIndex);
  });
  expectType<TraversalResult>(traversalResult1);
})();

(async () => {
  const traversalResult2 = await fastTraverser.traverse(async (batchDocs, batchIndex) => {
    expectType<firestore.QueryDocumentSnapshot<D>[]>(batchDocs);
    expectType<number>(batchIndex);
  });
  expectType<TraversalResult>(traversalResult2);
})();
