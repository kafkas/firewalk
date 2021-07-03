import type { firestore } from 'firebase-admin';
import type { Migrator, TraversalConfig } from '../../../src';
import { populateCollection } from '../../../__tests__/utils';

export interface TestItemDoc {
  number: number;
  text: string;
}

export function runBasicMigratorTests<C extends TraversalConfig>(
  migrator: Migrator<TestItemDoc, C>,
  collectionRef: firestore.CollectionReference<TestItemDoc>
): void {
  describe('basic migrator tests', () => {
    let collectionDocIds: string[] = [];

    async function initItemsCollection(): Promise<firestore.DocumentReference<TestItemDoc>[]> {
      return await populateCollection(collectionRef, { number: 0, text: 'abc' }, 100);
    }

    async function clearItemsCollection(): Promise<void> {
      const { docs } = await collectionRef.get();
      await Promise.all(docs.map((snap) => snap.ref.delete()));
    }

    beforeAll(async () => {
      const docRefs = await initItemsCollection();
      collectionDocIds = docRefs.map((docRef) => docRef.id);
    });

    afterAll(async () => {
      await clearItemsCollection();
      collectionDocIds = [];
    });

    test('correctly updates each document with the provided data', async () => {
      const updateData: Partial<TestItemDoc> = { number: 2 };
      await migrator.update(updateData);
      const { docs: updatedDocs } = await collectionRef.get();
      const updatedDocIds = new Set(updatedDocs.map((doc) => doc.id));
      expect(updatedDocIds).toEqual(new Set(collectionDocIds));
      updatedDocs.forEach((snap) => {
        const data = snap.data();
        expect(data.number).toBe(2);
        expect(data.text).toBe('abc');
      });
    });
  });
}
