import { firestore } from 'firebase-admin';
import { cloneDeep } from 'lodash';
import { collectionPopulator } from '../../../../../__tests__/utils';
import type { Migrator, TraversalConfig } from '../../../../api';
import { TestItemDoc, DEFAULT_TIMEOUT, INITIAL_DATA, DEFAULT_TRAVERSABLE_SIZE } from '../config';

/**
 * Assumes that the collection is initially empty.
 */
export function testRenameField<C extends TraversalConfig>(
  migrator: Migrator<C, TestItemDoc>,
  colRef: firestore.CollectionReference<TestItemDoc>
): void {
  test(
    'correctly renames a single field in each doc',
    async () => {
      await collectionPopulator(colRef)
        .withData(INITIAL_DATA)
        .populate({ count: DEFAULT_TRAVERSABLE_SIZE });
      await migrator.renameField('timestamp1', 'timestamp2');
      const { docs } = await colRef.get();
      docs.forEach((snap) => {
        const data = snap.data();
        const expected = (() => {
          const copy = { ...cloneDeep(INITIAL_DATA) };
          delete copy.timestamp1;
          copy['timestamp2'] = INITIAL_DATA.timestamp1;
          return copy;
        })();
        expect(data).toEqual(expected);
      });
      await Promise.all(docs.map((snap) => snap.ref.delete()));
    },
    DEFAULT_TIMEOUT
  );
}
