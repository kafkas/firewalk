import type { firestore } from 'firebase-admin';
import { createTraverser } from '../../api';
import { app } from '../../../__tests__/app';
import { BasicDefaultMigratorImplementation } from '../BasicDefaultMigratorImplementation';
import { runBasicMigratorTests, TestItemDoc } from './runBasicMigratorTests';

describe('BasicDefaultMigratorImplementation', () => {
  const itemsColRef = app()
    .admin.firestore()
    .collection('items') as firestore.CollectionReference<TestItemDoc>;
  const migrator = new BasicDefaultMigratorImplementation(
    createTraverser(itemsColRef, { batchSize: 10 })
  );
  runBasicMigratorTests(migrator, itemsColRef);
});
