import { firestore } from 'firebase-admin';
import { createMigrator } from '../src';

const projectsColRef = firestore().collection('projects');
const migrator = createMigrator(projectsColRef);
const { migratedDocCount } = await migrator.update('isCompleted', false);
console.log(`Updated ${migratedDocCount} projects!`);
