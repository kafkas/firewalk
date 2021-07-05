import { firestore } from 'firebase-admin';
import { expectType } from 'tsd';
import { app } from '../__tests__/app';
import {
  createTraverser,
  SlowTraverser,
  Traversable,
  TraversalConfig,
  TraversalResult,
} from '../src';

type D = {
  text: string;
  num: number;
};

const projectsColRef = app()
  .admin.firestore()
  .collection('projects') as firestore.CollectionReference<D>;

const slowTraverser = createTraverser(projectsColRef, { maxDocCount: 0 });

// TODO: Ideally we want to expect a firestore.CollectionReference<D> here
expectType<Traversable<D>>(slowTraverser.traversable);

expectType<TraversalConfig>(slowTraverser.traversalConfig);

(() => {
  // TODO: See if there is a better way to check inferred parameters
  const modifiedTraverser = slowTraverser.withConfig({
    batchSize: 0,
    maxDocCount: 0,
    sleepBetweenBatches: false,
    sleepTimeBetweenBatches: 0,
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
