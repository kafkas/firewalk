import type { firestore } from 'firebase-admin';
import type { Traverser, TraversalConfig } from '../../src';
import { populateCollection } from '../utils';

export function runBasicTraverserTests<D extends firestore.DocumentData, C extends TraversalConfig>(
  traverser: Traverser<D, C>,
  collectionRef: firestore.CollectionReference<D>,
  getInitialData: () => D
): void {
  describe('basic traverser tests', () => {
    async function initItemsCollection(): Promise<void> {
      await populateCollection(collectionRef, getInitialData(), 100);
    }

    async function clearItemsCollection(): Promise<void> {
      const { docs } = await collectionRef.get();
      await Promise.all(docs.map((snap) => snap.ref.delete()));
    }

    beforeAll(async () => {
      await initItemsCollection();
    });

    afterAll(async () => {
      await clearItemsCollection();
    });

    test('processes each document exactly once w/o external interference', async () => {
      const processCountMap: Record<string, number> = {};

      await traverser.traverse(async (snapshots) => {
        snapshots.forEach((snapshot) => {
          const itemId = snapshot.id;
          processCountMap[itemId] = (processCountMap[itemId] ?? 0) + 1;
        });
      });
      const isEachProcessCountEqualTo1 = Object.keys(processCountMap).every(
        (key) => processCountMap[key] === 1
      );
      expect(isEachProcessCountEqualTo1).toBe(true);
    });
  });
}
