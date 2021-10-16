import type { firestore } from 'firebase-admin';
import type { Traverser, TraversalConfig } from '../../../src';
import { collectionPopulator } from '../../../__tests__/utils';

export function runBasicTraverserTests<C extends TraversalConfig, D>(
  traverser: Traverser<C, D>,
  collectionRef: firestore.CollectionReference<D>,
  getInitialData: () => D
): void {
  describe('basic traverser tests', () => {
    let collectionDocIds: string[] = [];

    async function initItemsCollection(): Promise<firestore.DocumentReference<D>[]> {
      return await collectionPopulator(collectionRef)
        .withData(getInitialData())
        .populate({ count: 100 });
    }

    async function clearItemsCollection(): Promise<void> {
      const { docs } = await collectionRef.get();
      await Promise.all(docs.map((snap) => snap.ref.delete()));
    }

    beforeAll(async () => {
      const docRefs = await initItemsCollection();
      collectionDocIds = docRefs.map((docRef) => docRef.id);
    }, 15_000);

    afterAll(async () => {
      await clearItemsCollection();
      collectionDocIds = [];
    }, 15_000);

    test('exits early when instructed as such', async () => {
      const t = traverser
        .withConfig({ batchSize: 10 } as Partial<C>)
        .withExitEarlyPredicate((_, batchIndex) => batchIndex === 5);

      let processedBatchIndices: number[] = [];

      await t.traverse(async (_, batchIndex) => {
        processedBatchIndices.push(batchIndex);
      });

      expect(processedBatchIndices).toEqual([0, 1, 2, 3, 4, 5]);

      processedBatchIndices = [];

      await t
        .withExitEarlyPredicate((_, batchIndex) => batchIndex === 3)
        .traverse(async (_, batchIndex) => {
          processedBatchIndices.push(batchIndex);
        });

      expect(processedBatchIndices).toEqual([0, 1, 2, 3]);
    });

    test('processes each document exactly once w/o external interference', async () => {
      const expectedProcessCountMap = new Map(collectionDocIds.map((id) => [id, 1]));
      const processCountMap = new Map<string, number>();

      await traverser.traverse(async (batchDocs) => {
        batchDocs.forEach((doc) => {
          const id = doc.id;
          processCountMap.set(id, (processCountMap.get(id) ?? 0) + 1);
        });
      });

      expect(processCountMap).toEqual(expectedProcessCountMap);
    });
  });
}
