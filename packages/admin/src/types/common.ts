import type { firestore } from 'firebase-admin';

export type BatchCallback<T = firestore.DocumentData> = (
  batchSnapshots: firestore.QueryDocumentSnapshot<T>[],
  batchIndex: number
) => void;
