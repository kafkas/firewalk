import type { firestore } from 'firebase-admin';

/**
 * A function that takes a document snapshot and derives the data with which to set that document.
 */
export type SetDataGetter<D = firestore.DocumentData> = (
  doc: firestore.QueryDocumentSnapshot<D>
) => D;
