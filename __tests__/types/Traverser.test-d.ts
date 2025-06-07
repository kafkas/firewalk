/* eslint-disable import/no-unresolved */

import type { firestore } from 'firebase-admin';
import { expectType } from 'tsd';
import {
  createTraverser,
  Traversable,
  TraversalConfig,
  TraversalResult,
  Traverser,
} from '../../src';
import { collectionRef, TestAppModelType, TestDbModelType } from './_helpers';

const traverser = createTraverser(collectionRef);

// TODO: Ideally we want to expect a firestore.CollectionReference<TestAppModelType, TestDbModelType> here because
// we initialized the traverser with a collection reference.
expectType<Traversable<TestAppModelType, TestDbModelType>>(traverser.traversable);

expectType<TraversalConfig>(traverser.traversalConfig);

(() => {
  // TODO: See if there is a better way to check inferred parameters
  const modifiedTraverser = traverser.withConfig({
    batchSize: 0,
    sleepTimeBetweenBatches: 0,
    maxDocCount: 0,
    maxConcurrentBatchCount: 0,
  });
  expectType<Traverser<TestAppModelType, TestDbModelType>>(modifiedTraverser);
})();

(() => {
  const modifiedTraverser = traverser.withExitEarlyPredicate((batchDocs, batchIndex) => {
    expectType<firestore.QueryDocumentSnapshot<TestAppModelType, TestDbModelType>[]>(batchDocs);
    expectType<number>(batchIndex);
    return false;
  });
  expectType<Traverser<TestAppModelType, TestDbModelType>>(modifiedTraverser);
})();

(async () => {
  const traversalResult1 = await traverser.traverseEach(async (doc, docIndex, batchIndex) => {
    expectType<firestore.QueryDocumentSnapshot<TestAppModelType, TestDbModelType>>(doc);
    expectType<number>(docIndex);
    expectType<number>(batchIndex);
  });
  expectType<TraversalResult>(traversalResult1);
})();

(async () => {
  const traversalResult2 = await traverser.traverse(async (batchDocs, batchIndex) => {
    expectType<firestore.QueryDocumentSnapshot<TestAppModelType, TestDbModelType>[]>(batchDocs);
    expectType<number>(batchIndex);
  });
  expectType<TraversalResult>(traversalResult2);
})();
