import { expectType } from 'tsd';
import { createTraverser, SlowTraverser } from '../../src';
import { collectionRef, D } from './_helpers';

const slowTraverser = createTraverser(collectionRef, {
  batchSize: 0,
  sleepBetweenBatches: false,
  sleepTimeBetweenBatches: 0,
  maxDocCount: 0,
});

expectType<SlowTraverser<D>>(slowTraverser);
