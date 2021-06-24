import { firestore } from 'firebase-admin';
import { createBatchMigrator, createFastTraverser } from '../src';

const projects = firestore().collection('projects');

const defaultTraverser = createFastTraverser(projects);
const fastTraverser = createFastTraverser(projects);

const defaultMigrator1 = createBatchMigrator(defaultTraverser);
const defaultMigrator2 = createBatchMigrator(projects, { batchSize: 250 });

const fastMigrator = createBatchMigrator(fastTraverser);
