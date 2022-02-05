import { firestore } from 'firebase-admin';
import type { Traverser } from '../../../../../api';
import type { TestItemDoc } from '../config';
import { traversalTester } from '../helpers';

export function testTraverse(
  traverser: Traverser<TestItemDoc>,
  colRef: firestore.CollectionReference<TestItemDoc>
): void {
  traversalTester(colRef).test(
    'processes each document exactly once w/o external interference',
    async (_, docRefs) => {
      const collectionDocIds = docRefs.map((doc) => doc.id);
      const expectedProcessCountMap = new Map(collectionDocIds.map((id) => [id, 1]));
      const processCountMap = new Map<string, number>();

      await traverser.traverse(async (batchDocs) => {
        batchDocs.forEach((doc) => {
          const id = doc.id;
          processCountMap.set(id, (processCountMap.get(id) ?? 0) + 1);
        });
      });

      expect(processCountMap).toEqual(expectedProcessCountMap);
    }
  );
}
