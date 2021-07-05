import { firestore } from 'firebase-admin';
import { expectType } from 'tsd';
import { app } from '../__tests__/app';
import { createFastTraverser, FastTraverser } from '../src';

type D = {
  text: string;
  num: number;
};

const projectsColRef = app()
  .admin.firestore()
  .collection('projects') as firestore.CollectionReference<D>;

const fastTraverser = createFastTraverser(projectsColRef, { maxDocCount: 0 });

expectType<FastTraverser<D>>(fastTraverser);
