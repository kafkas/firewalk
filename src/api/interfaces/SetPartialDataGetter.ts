import type { firestore } from 'firebase-admin';

/**
 * A function that takes a document snapshot and derives the data with which to partially set that document.
 */
export type SetPartialDataGetter<
  AppModelType = firestore.DocumentData,
  DbModelType extends firestore.DocumentData = firestore.DocumentData,
> = (
  doc: firestore.QueryDocumentSnapshot<AppModelType, DbModelType>
) => firestore.PartialWithFieldValue<AppModelType>;
