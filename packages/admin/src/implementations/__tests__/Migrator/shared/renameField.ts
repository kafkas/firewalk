import { firestore } from 'firebase-admin';
import { cloneDeep } from 'lodash';
import type { Migrator, TraversalConfig } from '../../../../api';
import type { TestItemDoc } from '../config';
import { migrationTester } from '../helpers';

/**
 * Assumes that the collection is initially empty.
 */
export function testRenameField<C extends TraversalConfig>(
  migrator: Migrator<C, TestItemDoc>,
  colRef: firestore.CollectionReference<TestItemDoc>
): void {
  migrationTester(colRef).test(
    'correctly renames a single field in each doc',
    async (initialData) => {
      await migrator.renameField('timestamp1', 'timestamp2');
      const { docs } = await colRef.get();
      docs.forEach((snap) => {
        const data = snap.data();
        const expected = (() => {
          const copy = { ...cloneDeep(initialData) };
          delete copy.timestamp1;
          copy['timestamp2'] = initialData.timestamp1;
          return copy;
        })();
        expect(data).toEqual(expected);
      });
    }
  );
}
