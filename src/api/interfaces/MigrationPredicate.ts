import type { firestore } from 'firebase-admin';

/**
 * A function that takes a document snapshot and returns a boolean indicating whether to migrate it.
 */
export type MigrationPredicate<
  AppModelType = firestore.DocumentData,
  DbModelType extends firestore.DocumentData = firestore.DocumentData
> = (doc: firestore.QueryDocumentSnapshot<AppModelType, DbModelType>) => boolean;
