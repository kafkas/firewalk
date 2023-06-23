import type { firestore } from 'firebase-admin';

/**
 * An asynchronous function that takes a document snapshot, its 0-based index within the batch, and
 * the 0-based index of the batch as arguments.
 */
export type TraverseEachCallback<D = firestore.DocumentData> = (
  doc: firestore.QueryDocumentSnapshot<D>,
  docIndex: number,
  batchIndex: number
) => void | Promise<void>;
