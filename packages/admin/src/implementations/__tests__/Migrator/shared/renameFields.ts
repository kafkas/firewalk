import { firestore } from 'firebase-admin';
import { cloneDeep } from 'lodash';
import type { Migrator } from '../../../../api';
import type { TestItemDoc } from '../config';
import { migrationTester } from '../helpers';

/**
 * Assumes that the collection is initially empty.
 */
export function testRenameFields(
  migrator: Migrator<TestItemDoc>,
  colRef: firestore.CollectionReference<TestItemDoc>
): void {
  migrationTester(colRef).test(
    'correctly renames multiple fields in each doc',
    async (initialData) => {
      await migrator.renameFields(
        [new firestore.FieldPath('map1', 'num1'), new firestore.FieldPath('map1', 'num2')],
        ['timestamp1', 'timestamp2']
      );
      const { docs } = await migrator.traverser.traversable.get();
      docs.forEach((snap) => {
        const data = snap.data();
        const expected = (() => {
          const copy = { ...cloneDeep(initialData) };
          delete copy.map1.num1;
          delete copy.timestamp1;
          copy['map1']['num2'] = initialData.map1.num1;
          copy['timestamp2'] = initialData.timestamp1;
          return copy;
        })();
        expect(data).toEqual(expected);
      });
    }
  );
}
