import { firestore } from 'firebase-admin';
import { createTraverser } from '@firecode/admin';

const projectsColRef = firestore().collection('projects');
const traverser = createTraverser(projectsColRef);
const newTraverser = traverser
  .withExitEarlyPredicate((batchDocs) => batchDocs.some((d) => d.get('name') === undefined))
  .withExitEarlyPredicate((_, batchIndex) => batchIndex === 100);
