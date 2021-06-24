import { firestore } from 'firebase-admin';
import { createBatchMigrator, createFastTraverser } from '../src';

const projects = firestore().collection('projects').limit(200);

const defaultTraverser = createFastTraverser(projects);
const fastTraverser = createFastTraverser(projects);

fastTraverser.traversable; // Should be typed as a Query

const defaultMigrator1 = createBatchMigrator(defaultTraverser);
const defaultMigrator2 = createBatchMigrator(projects, { batchSize: 250 });

const fastMigrator = createBatchMigrator(fastTraverser);
