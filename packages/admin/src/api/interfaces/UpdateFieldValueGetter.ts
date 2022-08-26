import type { firestore } from 'firebase-admin';

export type UpdateFieldValueArray = [string | firestore.FieldPath, any, ...any[]];

/**
 * A function that takes a document snapshot and returns an alternating list of field paths and
 * values to update within that document, optionally followed by a Precondition to enforce on
 * the update.
 */
export type UpdateFieldValueGetter<D = firestore.DocumentData> = (
  doc: firestore.QueryDocumentSnapshot<D>
) => UpdateFieldValueArray;
