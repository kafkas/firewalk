import type { firestore } from 'firebase-admin';
import { app } from '../../../../../__tests__/app';
import { TestItemDoc } from '../config';
import { testRenameFields } from '../shared/renameFields';
import { IMPL_CLASS_NAME } from './config';
import { createBasicBatchMigratorImpl } from './helpers';

const METHOD_NAME = 'renameFields';
const DESCRIPTION = `${IMPL_CLASS_NAME}.${METHOD_NAME}`;

describe(DESCRIPTION, () => {
  const colRef = app()
    .admin.firestore()
    .collection(DESCRIPTION) as firestore.CollectionReference<TestItemDoc>;
  const migrator = createBasicBatchMigratorImpl(colRef);
  testRenameFields(migrator, colRef);
});
