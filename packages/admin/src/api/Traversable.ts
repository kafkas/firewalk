import type { firestore } from 'firebase-admin';

/**
 * A collection-like group of documents.
 */
export type Traversable<D extends firestore.DocumentData> =
  | firestore.CollectionReference<D>
  | firestore.CollectionGroup<D>
  | firestore.Query<D>;
