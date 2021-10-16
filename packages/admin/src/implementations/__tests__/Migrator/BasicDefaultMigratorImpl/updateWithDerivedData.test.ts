import type { firestore } from 'firebase-admin';
import { app } from '../../../../../__tests__/app';
import { TestItemDoc } from '../config';
import { testUpdateWithDerivedData } from '../shared/updateWithDerivedData';
import { IMPL_CLASS_NAME } from './config';
import { createBasicDefaultMigratorImpl } from './helpers';

const METHOD_NAME = 'updateWithDerivedData';
const DESCRIPTION = `${IMPL_CLASS_NAME}.${METHOD_NAME}`;

describe(DESCRIPTION, () => {
  const colRef = app()
    .admin.firestore()
    .collection(DESCRIPTION) as firestore.CollectionReference<TestItemDoc>;
  const migrator = createBasicDefaultMigratorImpl(colRef);
  testUpdateWithDerivedData(migrator, colRef);
});
