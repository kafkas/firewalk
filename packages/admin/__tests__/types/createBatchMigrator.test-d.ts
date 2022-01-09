import { expectType } from 'tsd';
import { createBatchMigrator, createTraverser, BatchMigrator } from '../../src';
import { collectionRef, D } from './_helpers';

// Signature 1

const traverser = createTraverser(collectionRef);
const batchMigrator = createBatchMigrator(traverser);
expectType<BatchMigrator<D>>(batchMigrator);

// Signature 2

const batchMigrator2 = createBatchMigrator(collectionRef, {
  batchSize: 0,
  sleepBetweenBatches: false,
  sleepTimeBetweenBatches: 0,
  maxDocCount: 0,
});
expectType<BatchMigrator<D>>(batchMigrator2);
