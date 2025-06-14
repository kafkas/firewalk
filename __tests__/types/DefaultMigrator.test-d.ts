/* eslint-disable import/no-unresolved */

import { firestore } from 'firebase-admin';
import { expectError, expectType } from 'tsd';
import { DefaultMigrator, Traverser, createMigrator, createTraverser } from '../../src';
import { TestAppModelType, TestDbModelType, collectionRef } from './_helpers';

const defaultMigrator = createMigrator(collectionRef);

expectType<Traverser<TestAppModelType, TestDbModelType>>(defaultMigrator.traverser);

(() => {
  const modifiedMigrator = defaultMigrator.withPredicate((doc) => {
    expectType<firestore.QueryDocumentSnapshot<TestAppModelType, TestDbModelType>>(doc);
    return false;
  });
  expectType<DefaultMigrator<TestAppModelType, TestDbModelType>>(modifiedMigrator);
})();

(() => {
  const traverser = createTraverser(collectionRef);
  const modifiedMigrator = defaultMigrator.withTraverser(traverser);
  expectType<DefaultMigrator<TestAppModelType, TestDbModelType>>(modifiedMigrator);
})();

defaultMigrator.onBeforeBatchStart((batchDocs, batchIndex) => {
  expectType<firestore.QueryDocumentSnapshot<TestAppModelType, TestDbModelType>[]>(batchDocs);
  expectType<number>(batchIndex);
});

defaultMigrator.onAfterBatchComplete((batchDocs, batchIndex) => {
  expectType<firestore.QueryDocumentSnapshot<TestAppModelType, TestDbModelType>[]>(batchDocs);
  expectType<number>(batchIndex);
});

defaultMigrator.deleteField('oldField');
defaultMigrator.deleteField(new firestore.FieldPath('nested', 'field'));

defaultMigrator.deleteFields(new firestore.FieldPath('nested', 'field'), 'field2', 'field3');

defaultMigrator.renameField('oldField', new firestore.FieldPath('new', 'field'));
defaultMigrator.renameField(new firestore.FieldPath('old', 'field'), 'newField');

defaultMigrator.renameFields(
  ['field1', new firestore.FieldPath('nested', 'field2')],
  ['field1', 'field2']
);

expectError(defaultMigrator.set({ num: 0 }));
defaultMigrator.set({ num: 0, text: '' });
defaultMigrator.set({ num: 0 }, { merge: true });

expectError(
  defaultMigrator.setWithDerivedData((doc) => {
    expectType<firestore.QueryDocumentSnapshot<TestAppModelType, TestDbModelType>>(doc);
    return { num: 0 };
  })
);
defaultMigrator.setWithDerivedData((doc) => {
  expectType<firestore.QueryDocumentSnapshot<TestAppModelType, TestDbModelType>>(doc);
  return { num: 0, text: '' };
});
defaultMigrator.setWithDerivedData(
  (doc) => {
    expectType<firestore.QueryDocumentSnapshot<TestAppModelType, TestDbModelType>>(doc);
    return { num: 0 };
  },
  { merge: true }
);

expectError(
  defaultMigrator.update({
    anyField: '',
  })
);

defaultMigrator.update('anyField', 'anyValue');

expectError(
  defaultMigrator.updateWithDerivedData((doc) => {
    expectType<firestore.QueryDocumentSnapshot<TestAppModelType, TestDbModelType>>(doc);
    return { anyField: '' };
  })
);

expectError(
  defaultMigrator.updateWithDerivedData((doc) => {
    expectType<firestore.QueryDocumentSnapshot<TestAppModelType, TestDbModelType>>(doc);
    return ['anyField', 'anyValue'];
  })
);

// TODO: We need to expect an error here if the return type of the callback is not a plain object or an array
// expectError(
//   defaultMigrator.updateWithDerivedData((doc) => {
//     expectType<firestore.QueryDocumentSnapshot<D>>(doc);
//     return new Map([]);
//   })
// );
