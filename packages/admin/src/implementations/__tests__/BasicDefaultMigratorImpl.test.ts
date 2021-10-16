import type { firestore } from 'firebase-admin';
import { createTraverser } from '../../api';
import { app } from '../../../__tests__/app';
import { BasicDefaultMigratorImpl } from '../BasicDefaultMigratorImpl';
import { runBasicMigratorTests, TestItemDoc } from './runBasicMigratorTests';

describe('BasicDefaultMigratorImpl', () => {
  const colRef = app()
    .admin.firestore()
    .collection('BasicDefaultMigratorImpl') as firestore.CollectionReference<TestItemDoc>;
  const migrator = new BasicDefaultMigratorImpl(createTraverser(colRef, { batchSize: 10 }));
  runBasicMigratorTests(migrator, colRef);
});
