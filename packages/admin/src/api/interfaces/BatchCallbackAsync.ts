import type { firestore } from 'firebase-admin';

/**
 * An asynchronous function that takes batch doc snapshots and the 0-based batch index as its arguments.
 */
export type BatchCallbackAsync<D = firestore.DocumentData> = (
  batchSnapshots: firestore.QueryDocumentSnapshot<D>[],
  batchIndex: number
) => Promise<void>;
