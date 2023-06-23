import { firestore } from 'firebase-admin';
import { expectError, expectType } from 'tsd';
import { createTraverser, createMigrator, DefaultMigrator, Traverser } from '../../src';
import { collectionRef, D } from './_helpers';

const defaultMigrator = createMigrator(collectionRef);

expectType<Traverser<D>>(defaultMigrator.traverser);

(() => {
  const modifiedMigrator = defaultMigrator.withPredicate((doc) => {
    expectType<firestore.QueryDocumentSnapshot<D>>(doc);
    return false;
  });
  expectType<DefaultMigrator<D>>(modifiedMigrator);
})();

(() => {
  const traverser = createTraverser(collectionRef);
  const modifiedMigrator = defaultMigrator.withTraverser(traverser);
  expectType<DefaultMigrator<D>>(modifiedMigrator);
})();

defaultMigrator.onBeforeBatchStart((batchDocs, batchIndex) => {
  expectType<firestore.QueryDocumentSnapshot<D>[]>(batchDocs);
  expectType<number>(batchIndex);
});

defaultMigrator.onAfterBatchComplete((batchDocs, batchIndex) => {
  expectType<firestore.QueryDocumentSnapshot<D>[]>(batchDocs);
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
    expectType<firestore.QueryDocumentSnapshot<D>>(doc);
    return { num: 0 };
  })
);
defaultMigrator.setWithDerivedData((doc) => {
  expectType<firestore.QueryDocumentSnapshot<D>>(doc);
  return { num: 0, text: '' };
});
defaultMigrator.setWithDerivedData(
  (doc) => {
    // TODO: We probably want firestore.QueryDocumentSnapshot<D> here
    expectType<firestore.QueryDocumentSnapshot<Partial<D>>>(doc);
    return { num: 0 };
  },
  { merge: true }
);

defaultMigrator.update({
  anyField: '',
});

defaultMigrator.update('anyField', 'anyValue');

defaultMigrator.updateWithDerivedData((doc) => {
  expectType<firestore.QueryDocumentSnapshot<D>>(doc);
  return { anyField: '' };
});

defaultMigrator.updateWithDerivedData((doc) => {
  expectType<firestore.QueryDocumentSnapshot<D>>(doc);
  return ['anyField', 'anyValue'];
});

// TODO: We need to expect an error here if the return type of the callback is not a plain object or an array
// expectError(
//   defaultMigrator.updateWithDerivedData((doc) => {
//     expectType<firestore.QueryDocumentSnapshot<D>>(doc);
//     return new Map([]);
//   })
// );
