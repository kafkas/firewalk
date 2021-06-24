import type { firestore } from 'firebase-admin';

export type BatchCallback<D = firestore.DocumentData> = (
  batchSnapshots: firestore.QueryDocumentSnapshot<D>[],
  batchIndex: number
) => void;

export type BatchCallbackAsync<D = firestore.DocumentData> = (
  batchSnapshots: firestore.QueryDocumentSnapshot<D>[],
  batchIndex: number
) => Promise<void>;
