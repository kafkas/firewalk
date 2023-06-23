import { firestore } from 'firebase-admin';
import { cloneDeep } from 'lodash';
import type { Migrator } from '../../../../../api';
import type { TestItemDoc } from '../config';
import { migrationTester } from '../helpers';

/**
 * Assumes that the collection is initially empty.
 */
export function testUpdateWithDerivedData(
  migrator: Migrator<TestItemDoc>,
  colRef: firestore.CollectionReference<TestItemDoc>
): void {
  migrationTester(colRef).test(
    'correctly updates each doc with the provided data getter',
    async (initialData) => {
      await migrator.updateWithDerivedData((snap) => ({ docId: snap.id }));
      const { docs } = await migrator.traverser.traversable.get();
      docs.forEach((snap) => {
        const data = snap.data();
        expect(data).toEqual({
          ...cloneDeep(initialData),
          docId: snap.id,
        });
      });
    }
  );
}
