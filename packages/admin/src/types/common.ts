import type { firestore } from 'firebase-admin';

export type BatchCallback<D extends firestore.DocumentData> = (
  batchSnapshots: firestore.QueryDocumentSnapshot<D>[],
  batchIndex: number
) => void;

export type BatchCallbackAsync<D extends firestore.DocumentData> = (
  batchSnapshots: firestore.QueryDocumentSnapshot<D>[],
  batchIndex: number
) => Promise<void>;
