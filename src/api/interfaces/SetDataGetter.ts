import type { firestore } from 'firebase-admin';

/**
 * A function that takes a document snapshot and derives the data with which to set that document.
 */
export type SetDataGetter<
  AppModelType = firestore.DocumentData,
  DbModelType extends firestore.DocumentData = firestore.DocumentData
> = (
  doc: firestore.QueryDocumentSnapshot<AppModelType, DbModelType>
) => firestore.WithFieldValue<AppModelType>;
