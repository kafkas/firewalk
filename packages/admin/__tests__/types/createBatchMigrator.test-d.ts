import { expectType } from 'tsd';
import {
  createFastTraverser,
  createBatchMigrator,
  createTraverser,
  BatchMigrator,
  FastTraversalConfig,
  TraversalConfig,
} from '../../src';
import { collectionRef, D } from './_helpers';

// Signature 1

// i. With SlowTraverser

const slowTraverser = createTraverser(collectionRef);
const slowBatchMigrator = createBatchMigrator(slowTraverser);
expectType<BatchMigrator<TraversalConfig, D>>(slowBatchMigrator);

// ii. With FastTraverser

const fastTraverser = createFastTraverser(collectionRef);
const fastBatchMigrator = createBatchMigrator(fastTraverser);
expectType<BatchMigrator<FastTraversalConfig, D>>(fastBatchMigrator);

// Signature 2

const slowBatchMigrator2 = createBatchMigrator(collectionRef, {
  batchSize: 0,
  sleepBetweenBatches: false,
  sleepTimeBetweenBatches: 0,
  maxDocCount: 0,
});
expectType<BatchMigrator<TraversalConfig, D>>(slowBatchMigrator2);
