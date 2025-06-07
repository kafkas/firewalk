import { firestore } from 'firebase-admin';

export type TestAppModelType = {
  text: string;
  num: number;
};

export type TestDbModelType = {
  text: string;
  num: number;
};

export const collectionRef = firestore().collection('projects') as firestore.CollectionReference<
  TestAppModelType,
  TestDbModelType
>;
