import type { firestore } from 'firebase-admin';
import { app } from '../../../../__tests__/app';
import { createTraverser, Migrator, TraversalConfig, Traverser } from '../../../api';
import { TestItemDoc, MigratorMethodTester, TRAVERSAL_CONFIG } from './config';

export type MigratorImplClass = {
  new <C extends TraversalConfig, D>(traverser: Traverser<C, D>): Migrator<C, D>;
};

export function describeMigratorMethodTest(
  migratorImplClass: MigratorImplClass,
  methodName: string,
  methodTester: MigratorMethodTester
): void {
  const description = `${migratorImplClass.name}.${methodName}`;
  const colRef = app()
    .admin.firestore()
    .collection(description) as firestore.CollectionReference<TestItemDoc>;
  const slowTraverser = createTraverser(colRef, TRAVERSAL_CONFIG);
  const migrator = new migratorImplClass(slowTraverser);
  describe(description, () => {
    methodTester(migrator, colRef);
  });
}
