import type { firestore } from 'firebase-admin';

/**
 * A function that takes a document snapshot and derives the data with which to partially set that document.
 */
export type SetPartialDataGetter<D = firestore.DocumentData> = (
  doc: firestore.QueryDocumentSnapshot<D>
) => firestore.PartialWithFieldValue<D>;
