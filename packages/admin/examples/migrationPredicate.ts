import { firestore } from 'firebase-admin';
import { createMigrator } from '@firecode/admin';

const projectsColRef = firestore().collectionGroup('projects');
const migrator = createMigrator(projectsColRef);
const newMigrator = migrator
  .withPredicate((doc) => doc.get('name') !== undefined)
  .withPredicate((doc) => doc.ref.path.startsWith('users/'));
