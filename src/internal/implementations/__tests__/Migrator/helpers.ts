import type { firestore } from 'firebase-admin';
import { app } from '../../../../../__tests__/app';
import { collectionPopulator } from '../../../../../__tests__/utils';
import { createTraverser, Migrator, Traverser } from '../../../../api';
import {
  TestItemDoc,
  MigratorMethodTester,
  TRAVERSAL_CONFIG,
  DEFAULT_TIMEOUT,
  INITIAL_DATA,
  DEFAULT_TRAVERSABLE_SIZE,
} from './config';

export type MigratorImplClass = {
  new <
    AppModelType = firestore.DocumentData,
    DbModelType extends firestore.DocumentData = firestore.DocumentData,
  >(
    traverser: Traverser<AppModelType, DbModelType>
  ): Migrator<AppModelType, DbModelType>;
};

export function describeMigratorMethodTest(
  migratorImplClass: MigratorImplClass,
  methodName: string,
  methodTester: MigratorMethodTester
): void {
  const description = `${migratorImplClass.name}.${methodName}`;
  const colRef = app().firestore.collection(
    description
  ) as firestore.CollectionReference<TestItemDoc>;
  const traverser = createTraverser(colRef, TRAVERSAL_CONFIG);
  const migrator = new migratorImplClass(traverser);
  describe(description, () => {
    methodTester(migrator, colRef);
  });
}

interface MigrationTester {
  test(
    name: string,
    testFn: (
      initialData: TestItemDoc,
      docRefs: firestore.DocumentReference<TestItemDoc>[]
    ) => Promise<void>,
    timeout?: number
  ): void;
}

export function migrationTester(
  colRef: firestore.CollectionReference<TestItemDoc>
): MigrationTester {
  return {
    test: (name, testFn, timeout = DEFAULT_TIMEOUT) => {
      test(
        name,
        async () => {
          const docRefs = await collectionPopulator(colRef)
            .withData(INITIAL_DATA)
            .populate({ count: DEFAULT_TRAVERSABLE_SIZE });
          await testFn(INITIAL_DATA, docRefs);
          await Promise.all(docRefs.map((docRef) => docRef.delete()));
        },
        timeout
      );
    },
  };
}
