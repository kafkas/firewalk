import type { firestore } from 'firebase-admin';
import { app } from '../../../../../__tests__/app';
import { TestItemDoc } from '../config';
import { testUpdate } from '../shared/update';
import { IMPL_CLASS_NAME } from './config';
import { createBasicDefaultMigratorImpl } from './helpers';

const METHOD_NAME = 'update';
const DESCRIPTION = `${IMPL_CLASS_NAME}.${METHOD_NAME}`;

describe(DESCRIPTION, () => {
  const colRef = app()
    .admin.firestore()
    .collection(DESCRIPTION) as firestore.CollectionReference<TestItemDoc>;
  const migrator = createBasicDefaultMigratorImpl(colRef);
  testUpdate(migrator, colRef);
});
