import type { firestore } from 'firebase-admin';

/**
 * A function that takes a document snapshot and returns an alternating list of field paths and
 * values to update within that document, optionally followed by a Precondition to enforce on
 * the update.
 */
export type UpdateFieldValueGetter<
  AppModelType = firestore.DocumentData,
  DbModelType extends firestore.DocumentData = firestore.DocumentData,
> = (
  doc: firestore.QueryDocumentSnapshot<AppModelType, DbModelType>
) => [string | firestore.FieldPath, any, ...any[]];
