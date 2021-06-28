import type { firestore } from 'firebase-admin';

/**
 * A function that takes a document snapshot and derives the data with which to set that document.
 */
export type SetDataGetter<D> = (snapshot: firestore.QueryDocumentSnapshot<D>) => D;
