import { firestore } from 'firebase-admin';
import { cloneDeep } from 'lodash';
import { collectionPopulator } from '../../../../../__tests__/utils';
import type { Migrator, TraversalConfig } from '../../../../api';
import { TestItemDoc, DEFAULT_TIMEOUT, INITIAL_DATA, DEFAULT_TRAVERSABLE_SIZE } from '../config';

/**
 * Assumes that the collection is initially empty.
 */
export function testDeleteField<C extends TraversalConfig>(
  migrator: Migrator<C, TestItemDoc>,
  colRef: firestore.CollectionReference<TestItemDoc>
): void {
  test(
    'correctly deletes a single field from each doc',
    async () => {
      await collectionPopulator(colRef)
        .withData(INITIAL_DATA)
        .populate({ count: DEFAULT_TRAVERSABLE_SIZE });
      await migrator.deleteField(new firestore.FieldPath('map1', 'string1'));
      const { docs } = await colRef.get();
      docs.forEach((snap) => {
        const data = snap.data();
        const expected = (() => {
          const copy = { ...cloneDeep(INITIAL_DATA) };
          delete copy.map1.string1;
          return copy;
        })();
        expect(data).toEqual(expected);
      });
      await Promise.all(docs.map((snap) => snap.ref.delete()));
    },
    DEFAULT_TIMEOUT
  );
}
