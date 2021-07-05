import { expectType } from 'tsd';
import {
  createFastTraverser,
  createMigrator,
  createTraverser,
  DefaultMigrator,
  FastTraversalConfig,
  TraversalConfig,
} from '../../src';
import { collectionRef, D } from './_helpers';

// Signature 1

// i. With SlowTraverser

const slowTraverser = createTraverser(collectionRef);
const slowDefaultMigrator = createMigrator(slowTraverser);
expectType<DefaultMigrator<TraversalConfig, D>>(slowDefaultMigrator);

// ii. With FastTraverser

const fastTraverser = createFastTraverser(collectionRef);
const fastDefaultMigrator = createMigrator(fastTraverser);
expectType<DefaultMigrator<FastTraversalConfig, D>>(fastDefaultMigrator);

// Signature 2

const slowDefaultMigrator2 = createMigrator(collectionRef, {
  batchSize: 0,
  sleepBetweenBatches: false,
  sleepTimeBetweenBatches: 0,
  maxDocCount: 0,
});
expectType<DefaultMigrator<TraversalConfig, D>>(slowDefaultMigrator2);
