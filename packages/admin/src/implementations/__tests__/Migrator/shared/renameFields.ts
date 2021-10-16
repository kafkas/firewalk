import { firestore } from 'firebase-admin';
import { cloneDeep } from 'lodash';
import { collectionPopulator } from '../../../../../__tests__/utils';
import type { Migrator, TraversalConfig } from '../../../../api';
import { TestItemDoc, DEFAULT_TIMEOUT, INITIAL_DATA, DEFAULT_TRAVERSABLE_SIZE } from '../config';

/**
 * Assumes that the collection is initially empty.
 */
export function testRenameFields<C extends TraversalConfig>(
  migrator: Migrator<C, TestItemDoc>,
  colRef: firestore.CollectionReference<TestItemDoc>
): void {
  test(
    'correctly renames multiple fields in each doc',
    async () => {
      await collectionPopulator(colRef)
        .withData(INITIAL_DATA)
        .populate({ count: DEFAULT_TRAVERSABLE_SIZE });
      await migrator.renameFields(
        [new firestore.FieldPath('map1', 'num1'), new firestore.FieldPath('map1', 'num2')],
        ['timestamp1', 'timestamp2']
      );
      const { docs } = await migrator.traverser.traversable.get();
      docs.forEach((snap) => {
        const data = snap.data();
        const expected = (() => {
          const copy = { ...cloneDeep(INITIAL_DATA) };
          delete copy.map1.num1;
          delete copy.timestamp1;
          copy['map1']['num2'] = INITIAL_DATA.map1.num1;
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
