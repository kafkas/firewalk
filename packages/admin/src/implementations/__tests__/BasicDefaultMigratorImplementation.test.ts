import type { firestore } from 'firebase-admin';
import { createTraverser } from '../../api';
import { app } from '../../../__tests__/app';
import { BasicDefaultMigratorImpl } from '../BasicDefaultMigratorImpl';
import { runBasicMigratorTests, TestItemDoc } from './runBasicMigratorTests';

describe('BasicDefaultMigratorImpl', () => {
  const itemsColRef = app()
    .admin.firestore()
    .collection('items') as firestore.CollectionReference<TestItemDoc>;
  const migrator = new BasicDefaultMigratorImpl(createTraverser(itemsColRef, { batchSize: 10 }));
  runBasicMigratorTests(migrator, itemsColRef);
});
