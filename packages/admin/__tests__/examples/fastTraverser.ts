import { firestore } from 'firebase-admin';
import { createFastTraverser } from '../../src';

const projectsColRef = firestore().collection('projects');
const traverser = createFastTraverser(projectsColRef, {
  batchSize: 500,
  maxConcurrentBatchCount: 20,
});
// This means we should expect to hold 500 * 20 = 10,000 projects in memory
const { docCount } = await traverser.traverse(async (_, batchIndex) => {
  console.log(`Gonna process batch ${batchIndex} now!`);
  // ...
});
console.log(`Traversed ${docCount} projects super-fast!`);
