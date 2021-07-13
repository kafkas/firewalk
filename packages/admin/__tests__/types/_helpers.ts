import { firestore } from 'firebase-admin';

export type D = {
  text: string;
  num: number;
};

export const collectionRef = firestore().collection('projects') as firestore.CollectionReference<D>;
