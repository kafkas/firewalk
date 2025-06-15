import { firestore } from 'firebase-admin';
import { createTraverser } from 'firewalk';

const projectsColRef = firestore().collection('projects');
const traverser = createTraverser(projectsColRef, {
  batchSize: 500,
  // This means we are prepared to hold 500 * 20 = 10,000 docs in memory.
  // We sacrifice some memory to traverse faster.
  maxConcurrentBatchCount: 20,
});
const { docCount } = await traverser.traverse(async (_, batchIndex) => {
  console.log(`Processing batch ${batchIndex} now!`);
  // Add batch processing logic here
});
console.log(`Traversed ${docCount} projects super-fast!`);
