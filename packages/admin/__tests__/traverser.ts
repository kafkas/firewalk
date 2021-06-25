import { firestore } from 'firebase-admin';
import { createBatchMigrator, createTraverser, createFastTraverser, FastTraverser } from '../src';

type ProjectDoc = {
  isCompleted: boolean;
  completedAt: Date;
};

const projects = firestore().collection('projects') as firestore.CollectionReference<ProjectDoc>;

const fastTraverser = createFastTraverser(projects);
const fastTraverserCI = new FastTraverser(projects);
const slowTraverser = createTraverser(projects);

fastTraverserCI.traverse(async (docs) => {
  //
});

const ssss = fastTraverserCI.withConfig({}).withConfig({});

fastTraverser.traverse(async (docs) => {
  //
});

slowTraverser.traverse(async (docs) => {
  //
});

const sss = slowTraverser.someWeirdStuff({});

const slowTraversable = slowTraverser.traversable;

fastTraverser.traversable; // Should be typed as a Query

const defaultMigrator1 = createBatchMigrator(fastTraverser);
const defaultMigrator2 = createBatchMigrator(projects, { batchSize: 250 });

const fastMigrator = createBatchMigrator(fastTraverser);
