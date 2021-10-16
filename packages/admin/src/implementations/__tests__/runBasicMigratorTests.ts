import { firestore } from 'firebase-admin';
import { cloneDeep } from 'lodash';
import type { Migrator, TraversalConfig } from '../../../src';
import { collectionPopulator } from '../../../__tests__/utils';

export interface TestItemDoc {
  map1: {
    num1: number;
    string1: string;
  };
  num2: number;
  string2: string;
  string3: string;
  timestamp1: firestore.Timestamp;
}

const initialTestItemData = Object.freeze<TestItemDoc>({
  map1: {
    num1: 1,
    string1: 'abc',
  },
  num2: 2,
  string2: 'abc',
  string3: 'abc',
  timestamp1: firestore.Timestamp.fromDate(new Date()),
});

export function runBasicMigratorTests<C extends TraversalConfig>(
  migrator: Migrator<C, TestItemDoc>,
  collectionRef: firestore.CollectionReference<TestItemDoc>
): void {
  describe('basic migrator tests', () => {
    let collectionDocIds: string[] = [];

    beforeEach(async () => {
      const docRefs = await initItemsCollection();
      collectionDocIds = docRefs.map((docRef) => docRef.id);
    }, 15_000);

    async function initItemsCollection(): Promise<firestore.DocumentReference<TestItemDoc>[]> {
      return await collectionPopulator(collectionRef)
        .withData(initialTestItemData)
        .populate({ count: 40 });
    }

    afterEach(async () => {
      await clearItemsCollection();
      collectionDocIds = [];
    }, 15_000);

    async function clearItemsCollection(): Promise<void> {
      const { docs } = await collectionRef.get();
      await Promise.all(docs.map((snap) => snap.ref.delete()));
    }

    test('correctly updates each doc with the provided data getter', async () => {
      await migrator.updateWithDerivedData((snap) => ({ docId: snap.id }));
      const { docs: updatedDocs } = await collectionRef.get();
      const updatedDocIds = new Set(updatedDocs.map((doc) => doc.id));
      expect(updatedDocIds).toEqual(new Set(collectionDocIds));
      updatedDocs.forEach((snap) => {
        const data = snap.data();
        expect(data).toEqual({
          ...cloneDeep(initialTestItemData),
          docId: snap.id,
        });
      });
    }, 15_000);

    test('correctly updates each doc with the provided data', async () => {
      const updateData = { string2: 'a' };
      await migrator.update(updateData);
      const { docs: updatedDocs } = await collectionRef.get();
      const updatedDocIds = new Set(updatedDocs.map((doc) => doc.id));
      expect(updatedDocIds).toEqual(new Set(collectionDocIds));
      updatedDocs.forEach((snap) => {
        const data = snap.data();
        expect(data).toEqual({
          ...cloneDeep(initialTestItemData),
          ...updateData,
        });
      });
    }, 15_000);

    test('correctly deletes a single field from each doc', async () => {
      const { migratedDocCount } = await migrator.deleteField(
        new firestore.FieldPath('map1', 'string1')
      );
      const { docs } = await collectionRef.get();
      expect(migratedDocCount).toEqual(docs.length);
      docs.forEach((snap) => {
        const data = snap.data();
        const expected = (() => {
          const copy = cloneDeep(initialTestItemData);
          delete copy.map1.string1;
          return copy;
        })();
        expect(data).toEqual(expected);
      });
    }, 15_000);

    test('correctly renames a single field in each doc', async () => {
      const { migratedDocCount } = await migrator.renameField('timestamp1', 'timestamp2');
      const { docs } = await collectionRef.get();
      expect(migratedDocCount).toEqual(docs.length);
      docs.forEach((snap) => {
        const data = snap.data();
        const expected = (() => {
          const copy = { ...cloneDeep(initialTestItemData) };
          delete copy.timestamp1;
          copy['timestamp2'] = initialTestItemData.timestamp1;
          return copy;
        })();
        expect(data).toEqual(expected);
      });
    }, 15_000);

    test('correctly renames multiple fields in each doc', async () => {
      const { migratedDocCount } = await migrator.renameFields(
        [new firestore.FieldPath('map1', 'num1'), new firestore.FieldPath('map1', 'num2')],
        ['timestamp1', 'timestamp2']
      );
      const { docs } = await collectionRef.get();
      expect(migratedDocCount).toEqual(docs.length);
      docs.forEach((snap) => {
        const data = snap.data();
        const expected = (() => {
          const copy = { ...cloneDeep(initialTestItemData) };
          delete copy.map1.num1;
          delete copy.timestamp1;
          copy['map1']['num2'] = initialTestItemData.map1.num1;
          copy['timestamp2'] = initialTestItemData.timestamp1;
          return copy;
        })();
        expect(data).toEqual(expected);
      });
    }, 15_000);
  });
}
