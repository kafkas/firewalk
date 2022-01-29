import { firestore } from 'firebase-admin';
import { cloneDeep } from 'lodash';
import type { Migrator } from '../../../../api';
import type { TestItemDoc } from '../config';
import { migrationTester } from '../helpers';

/**
 * Assumes that the collection is initially empty.
 */
export function testDeleteField(
  migrator: Migrator<TestItemDoc>,
  colRef: firestore.CollectionReference<TestItemDoc>
): void {
  migrationTester(colRef).test(
    'correctly deletes a single field from each doc',
    async (initialData) => {
      await migrator.deleteField(new firestore.FieldPath('map1', 'string1'));
      const { docs } = await colRef.get();
      docs.forEach((snap) => {
        const data = snap.data();
        const expected = (() => {
          const copy = { ...cloneDeep(initialData) };
          delete copy.map1.string1;
          return copy;
        })();
        expect(data).toEqual(expected);
      });
    }
  );
}
