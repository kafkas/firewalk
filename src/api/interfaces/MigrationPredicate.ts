import type { firestore } from 'firebase-admin';

/**
 * A function that takes a document snapshot and returns a boolean indicating whether to migrate it.
 */
export type MigrationPredicate<D = firestore.DocumentData> = (
  doc: firestore.QueryDocumentSnapshot<D>
) => boolean;
