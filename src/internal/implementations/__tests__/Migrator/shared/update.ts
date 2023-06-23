import { firestore } from 'firebase-admin';
import { cloneDeep } from 'lodash';
import type { Migrator } from '../../../../../api';
import type { TestItemDoc } from '../config';
import { migrationTester } from '../helpers';

/**
 * Assumes that the collection is initially empty.
 */
export function testUpdate(
  migrator: Migrator<TestItemDoc>,
  colRef: firestore.CollectionReference<TestItemDoc>
): void {
  migrationTester(colRef).test(
    'correctly updates each doc with the provided data',
    async (initialData) => {
      const updateData = { string2: 'a' };
      await migrator.update(updateData);
      const { docs } = await migrator.traverser.traversable.get();
      docs.forEach((snap) => {
        const data = snap.data();
        expect(data).toEqual({
          ...cloneDeep(initialData),
          ...updateData,
        });
      });
    }
  );
}
