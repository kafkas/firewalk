import type { firestore } from 'firebase-admin';
import { app } from '../../../../../__tests__/app';
import { createTraverser, TraversalConfig } from '../../../../api';
import { BasicDefaultMigratorImpl } from '../../../BasicDefaultMigratorImpl';
import { TestItemDoc, MigratorMethodTester, TRAVERSAL_CONFIG } from '../config';
import { IMPL_CLASS_NAME } from './config';

export function describeBasicDefaultMigratorMethodTest(
  methodName: string,
  tester: MigratorMethodTester<TraversalConfig>
): void {
  const description = `${IMPL_CLASS_NAME}.${methodName}`;
  const colRef = app()
    .admin.firestore()
    .collection(description) as firestore.CollectionReference<TestItemDoc>;
  const migrator = new BasicDefaultMigratorImpl(createTraverser(colRef, TRAVERSAL_CONFIG));
  describe(description, () => {
    tester(migrator, colRef);
  });
}
