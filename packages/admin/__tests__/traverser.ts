import { firestore } from 'firebase-admin';
import { createBatchMigrator, createFastTraverser } from '../src';

type ProjectDoc = {
  isCompleted: boolean;
  completedAt: Date;
};

const projects = firestore().collection('projects') as firestore.CollectionReference<ProjectDoc>;

const slowTraverser = createFastTraverser(projects);
const fastTraverser = createFastTraverser(projects);

slowTraverser.traverse((docs) => {
  //
});

fastTraverser.traverse((docs) => {
  //
});

fastTraverser.traversable; // Should be typed as a Query

const defaultMigrator1 = createBatchMigrator(slowTraverser);
const defaultMigrator2 = createBatchMigrator(projects, { batchSize: 250 });

const fastMigrator = createBatchMigrator(fastTraverser);
