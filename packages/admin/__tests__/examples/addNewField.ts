import { firestore } from 'firebase-admin';
import { createBatchMigrator } from '../../src';

const projectsColRef = firestore().collection('projects');
const migrator = createBatchMigrator(projectsColRef);
const { migratedDocCount } = await migrator.update('isCompleted', false);
console.log(`Updated ${migratedDocCount} projects!`);
