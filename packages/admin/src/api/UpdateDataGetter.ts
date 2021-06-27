import type { firestore } from 'firebase-admin';

export type UpdateDataGetter<D> = (
  snapshot: firestore.QueryDocumentSnapshot<D>
) => firestore.UpdateData;
