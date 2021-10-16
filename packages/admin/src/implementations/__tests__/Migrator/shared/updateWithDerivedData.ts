import { firestore } from 'firebase-admin';
import { cloneDeep } from 'lodash';
import { collectionPopulator } from '../../../../../__tests__/utils';
import type { Migrator, TraversalConfig } from '../../../../api';
import { TestItemDoc, DEFAULT_TIMEOUT, INITIAL_DATA, DEFAULT_TRAVERSABLE_SIZE } from '../config';

/**
 * Assumes that the collection is initially empty.
 */
export function testUpdateWithDerivedData<C extends TraversalConfig>(
  migrator: Migrator<C, TestItemDoc>,
  colRef: firestore.CollectionReference<TestItemDoc>
): void {
  test(
    'correctly updates each doc with the provided data getter',
    async () => {
      await collectionPopulator(colRef)
        .withData(INITIAL_DATA)
        .populate({ count: DEFAULT_TRAVERSABLE_SIZE });
      await migrator.updateWithDerivedData((snap) => ({ docId: snap.id }));
      const { docs } = await migrator.traverser.traversable.get();
      docs.forEach((snap) => {
        const data = snap.data();
        expect(data).toEqual({
          ...cloneDeep(INITIAL_DATA),
          docId: snap.id,
        });
      });
      await Promise.all(docs.map((snap) => snap.ref.delete()));
    },
    DEFAULT_TIMEOUT
  );
}
