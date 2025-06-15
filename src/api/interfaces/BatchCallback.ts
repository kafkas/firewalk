import type { firestore } from 'firebase-admin';

/**
 * A function that takes batch doc snapshots and the 0-based batch index as its arguments.
 */
export type BatchCallback<
  AppModelType = firestore.DocumentData,
  DbModelType extends firestore.DocumentData = firestore.DocumentData,
> = (
  batchDocs: firestore.QueryDocumentSnapshot<AppModelType, DbModelType>[],
  batchIndex: number
) => void | Promise<void>;
