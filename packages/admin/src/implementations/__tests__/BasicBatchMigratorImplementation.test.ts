import type { firestore } from 'firebase-admin';
import { createTraverser } from '../../api';
import { app } from '../../../__tests__/app';
import { BasicBatchMigratorImpl } from '../BasicBatchMigratorImpl';
import { runBasicMigratorTests, TestItemDoc } from './runBasicMigratorTests';

describe('BasicBatchMigratorImpl', () => {
  const itemsColRef = app()
    .admin.firestore()
    .collection('items') as firestore.CollectionReference<TestItemDoc>;
  const migrator = new BasicBatchMigratorImpl(createTraverser(itemsColRef, { batchSize: 10 }));
  runBasicMigratorTests(migrator, itemsColRef);
});
