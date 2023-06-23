import { expectType } from 'tsd';
import { createMigrator, createTraverser, DefaultMigrator } from '../../src';
import { collectionRef, D } from './_helpers';

// Signature 1

const traverser = createTraverser(collectionRef);
const defaultMigrator = createMigrator(traverser);
expectType<DefaultMigrator<D>>(defaultMigrator);

// Signature 2

const defaultMigrator2 = createMigrator(collectionRef, {
  batchSize: 0,
  sleepTimeBetweenBatches: 0,
  maxDocCount: 0,
  maxConcurrentBatchCount: 0,
});
expectType<DefaultMigrator<D>>(defaultMigrator2);
