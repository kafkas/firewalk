import { firestore } from 'firebase-admin';
import { createMigrator, createFastTraverser } from '@firecode/admin';

const projectsColRef = firestore().collection('projects');
const fastTraverser = createFastTraverser(projectsColRef, { maxConcurrentBatchCount: 25 });
const fastMigrator = createMigrator(fastTraverser);
const { migratedDocCount } = await fastMigrator.update('isCompleted', false);
console.log(`Updated ${migratedDocCount} projects super-fast!`);
