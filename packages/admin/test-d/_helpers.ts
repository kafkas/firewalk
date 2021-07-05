import { firestore } from 'firebase-admin';
// import { app } from '../__tests__/app';

export type D = {
  text: string;
  num: number;
};

export const collectionRef = firestore().collection('projects') as firestore.CollectionReference<D>;
