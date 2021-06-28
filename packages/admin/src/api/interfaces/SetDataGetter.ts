import type { firestore } from 'firebase-admin';

export type SetDataGetter<D> = (snapshot: firestore.QueryDocumentSnapshot<D>) => D;
