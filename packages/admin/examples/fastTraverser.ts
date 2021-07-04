import { firestore } from 'firebase-admin';
import { createFastTraverser } from '@firecode/admin';

const projectsColRef = firestore().collection('projects');
const traverser = createFastTraverser(projectsColRef, {
  batchSize: 500,
  // This means we are prepared to hold 500 * 20 = 10,000 docs in memory
  maxConcurrentBatchCount: 20,
});
const { docCount } = await traverser.traverse(async (_, batchIndex) => {
  console.log(`Gonna process batch ${batchIndex} now!`);
  // ...
});
console.log(`Traversed ${docCount} projects super-fast!`);