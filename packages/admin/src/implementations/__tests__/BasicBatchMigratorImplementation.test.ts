import type { firestore } from 'firebase-admin';
import { createTraverser } from '../../api';
import { app } from '../../../__tests__/app';
import { BasicBatchMigratorImplementation } from '../BasicBatchMigratorImplementation';
import { runBasicMigratorTests, TestItemDoc } from './runBasicMigratorTests';

describe('BasicBatchMigratorImplementation', () => {
  const itemsColRef = app()
    .admin.firestore()
    .collection('items') as firestore.CollectionReference<TestItemDoc>;
  const migrator = new BasicBatchMigratorImplementation(
    createTraverser(itemsColRef, { batchSize: 10 })
  );
  runBasicMigratorTests(migrator, itemsColRef);
});
