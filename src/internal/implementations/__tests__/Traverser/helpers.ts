import type { firestore } from 'firebase-admin';
import { app } from '../../../../../__tests__/app';
import { collectionPopulator } from '../../../../../__tests__/utils';
import type { Traversable, Traverser } from '../../../../api';
import {
  TestItemDoc,
  TraverserMethodTester,
  DEFAULT_TIMEOUT,
  INITIAL_DATA,
  DEFAULT_TRAVERSABLE_SIZE,
} from './config';

export type TraverserImplClass = {
  new <
    AppModelType = firestore.DocumentData,
    DbModelType extends firestore.DocumentData = firestore.DocumentData,
  >(
    traversable: Traversable<AppModelType, DbModelType>
  ): Traverser<AppModelType, DbModelType>;
};

export function describeTraverserMethodTest(
  traverserImplClass: TraverserImplClass,
  methodName: string,
  methodTester: TraverserMethodTester
): void {
  const description = `${traverserImplClass.name}.${methodName}`;
  const colRef = app().firestore.collection(
    description
  ) as firestore.CollectionReference<TestItemDoc>;
  const traverser = new traverserImplClass(colRef);
  describe(description, () => {
    methodTester(traverser, colRef);
  });
}

interface TraversalTester {
  test(
    name: string,
    testFn: (
      initialData: TestItemDoc,
      docRefs: firestore.DocumentReference<TestItemDoc>[]
    ) => Promise<void>,
    timeout?: number
  ): void;
}

export function traversalTester(
  colRef: firestore.CollectionReference<TestItemDoc>
): TraversalTester {
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
