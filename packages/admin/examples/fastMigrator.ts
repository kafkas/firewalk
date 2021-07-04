import { firestore } from 'firebase-admin';
import { createBatchMigrator, createFastTraverser } from '../src';

const projectsColRef = firestore().collection('projects');
const fastTraverser = createFastTraverser(projectsColRef, { maxConcurrentBatchCount: 25 });
const fastMigrator = createBatchMigrator(fastTraverser);
const { migratedDocCount } = await fastMigrator.update('isCompleted', false);
console.log(`Updated ${migratedDocCount} projects super-fast!`);
