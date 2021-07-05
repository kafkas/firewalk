import { expectType } from 'tsd';
import { createFastTraverser, FastTraverser } from '../../src';
import { collectionRef, D } from './_helpers';

const fastTraverser = createFastTraverser(collectionRef, {
  batchSize: 0,
  sleepBetweenBatches: false,
  sleepTimeBetweenBatches: 0,
  maxDocCount: 0,
  maxConcurrentBatchCount: 0,
});

expectType<FastTraverser<D>>(fastTraverser);
