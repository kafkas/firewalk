import { firestore } from 'firebase-admin';
import { cloneDeep } from 'lodash';
import { collectionPopulator } from '../../../../../__tests__/utils';
import type { Migrator, TraversalConfig } from '../../../../api';
import { TestItemDoc, DEFAULT_TIMEOUT, INITIAL_DATA, DEFAULT_TRAVERSABLE_SIZE } from '../config';

/**
 * Assumes that the collection is initially empty.
 */
export function testUpdate<C extends TraversalConfig>(
  migrator: Migrator<C, TestItemDoc>,
  colRef: firestore.CollectionReference<TestItemDoc>
): void {
  test(
    'correctly updates each doc with the provided data',
    async () => {
      await collectionPopulator(colRef)
        .withData(INITIAL_DATA)
        .populate({ count: DEFAULT_TRAVERSABLE_SIZE });
      const updateData = { string2: 'a' };
      await migrator.update(updateData);
      const { docs } = await migrator.traverser.traversable.get();
      docs.forEach((snap) => {
        const data = snap.data();
        expect(data).toEqual({
          ...cloneDeep(INITIAL_DATA),
          ...updateData,
        });
      });
      await Promise.all(docs.map((snap) => snap.ref.delete()));
    },
    DEFAULT_TIMEOUT
  );
}
