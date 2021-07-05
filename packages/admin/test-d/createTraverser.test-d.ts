import { firestore } from 'firebase-admin';
import { expectType } from 'tsd';
import { app } from '../__tests__/app';
import { createTraverser, SlowTraverser } from '../src';

type D = {
  text: string;
  num: number;
};

const projectsColRef = app()
  .admin.firestore()
  .collection('projects') as firestore.CollectionReference<D>;

const slowTraverser = createTraverser(projectsColRef, { maxDocCount: 0 });

expectType<SlowTraverser<D>>(slowTraverser);
