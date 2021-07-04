import type { firestore } from 'firebase-admin';

/**
 * A synchronous function that takes batch doc snapshots and the 0-based batch index as its arguments.
 */
export type BatchCallback<D = firestore.DocumentData> = (
  batchSnapshots: firestore.QueryDocumentSnapshot<D>[],
  batchIndex: number
) => void;
