/* eslint-disable import/no-unresolved */

import { expectType } from 'tsd';
import { createBatchMigrator, createTraverser, BatchMigrator } from '../../src';
import { collectionRef, TestAppModelType, TestDbModelType } from './_helpers';

// Signature 1

const traverser = createTraverser(collectionRef);
const batchMigrator = createBatchMigrator(traverser);
expectType<BatchMigrator<TestAppModelType, TestDbModelType>>(batchMigrator);

// Signature 2

const batchMigrator2 = createBatchMigrator(collectionRef, {
  batchSize: 0,
  sleepTimeBetweenBatches: 0,
  maxDocCount: 0,
});
expectType<BatchMigrator<TestAppModelType, TestDbModelType>>(batchMigrator2);
