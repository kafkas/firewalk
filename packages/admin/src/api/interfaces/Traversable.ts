import type { firestore } from 'firebase-admin';

/**
 * A collection-like group of documents. Can be one of [CollectionReference](https://googleapis.dev/nodejs/firestore/latest/CollectionReference.html),
 * [CollectionGroup](https://googleapis.dev/nodejs/firestore/latest/CollectionGroup.html) and [Query](https://googleapis.dev/nodejs/firestore/latest/Query.html).
 */
export type Traversable<D = firestore.DocumentData> =
  | firestore.CollectionReference<D>
  | firestore.CollectionGroup<D>
  | firestore.Query<D>;
