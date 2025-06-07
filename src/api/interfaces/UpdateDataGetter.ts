import type { firestore } from 'firebase-admin';

/**
 * A function that takes a document snapshot and derives the data with which to update that document.
 */
export type UpdateDataGetter<
  AppModelType = firestore.DocumentData,
  DbModelType extends firestore.DocumentData = firestore.DocumentData
> = (
  doc: firestore.QueryDocumentSnapshot<AppModelType, DbModelType>
) => firestore.UpdateData<DbModelType>;
