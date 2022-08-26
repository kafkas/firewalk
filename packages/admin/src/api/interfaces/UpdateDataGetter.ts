import type { firestore } from 'firebase-admin';

/**
 * A function that takes a document snapshot and derives the data with which to update that document.
 */
export type UpdateDataGetter<D = firestore.DocumentData> = (
  doc: firestore.QueryDocumentSnapshot<D>
) => firestore.UpdateData<D>;
