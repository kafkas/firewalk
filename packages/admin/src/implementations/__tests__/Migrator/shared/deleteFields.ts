import { firestore } from 'firebase-admin';
import { cloneDeep } from 'lodash';
import type { Migrator, TraversalConfig } from '../../../../api';
import type { TestItemDoc } from '../config';
import { migrationTester } from '../helpers';

/**
 * Assumes that the collection is initially empty.
 */
export function testDeleteFields<C extends TraversalConfig>(
  migrator: Migrator<C, TestItemDoc>,
  colRef: firestore.CollectionReference<TestItemDoc>
): void {
  migrationTester(colRef).test(
    'correctly deletes a single field from each doc',
    async (initialData) => {
      await migrator.deleteFields(
        new firestore.FieldPath('map1', 'num1'),
        new firestore.FieldPath('map1', 'string1'),
        'timestamp1'
      );
      const { docs } = await colRef.get();
      docs.forEach((snap) => {
        const data = snap.data();
        const expected = (() => {
          const copy = { ...cloneDeep(initialData) };
          delete copy.map1.num1;
          delete copy.map1.string1;
          delete copy.timestamp1;
          return copy;
        })();
        expect(data).toEqual(expected);
      });
    }
  );
}
