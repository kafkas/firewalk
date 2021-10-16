import type { firestore } from 'firebase-admin';
import { createTraverser } from '../../api';
import { app } from '../../../__tests__/app';
import { BasicBatchMigratorImpl } from '../BasicBatchMigratorImpl';
import { runBasicMigratorTests, TestItemDoc } from './runBasicMigratorTests';

describe('BasicBatchMigratorImpl', () => {
  const colRef = app()
    .admin.firestore()
    .collection('BasicBatchMigratorImpl') as firestore.CollectionReference<TestItemDoc>;
  const migrator = new BasicBatchMigratorImpl(createTraverser(colRef, { batchSize: 10 }));
  runBasicMigratorTests(migrator, colRef);
});
