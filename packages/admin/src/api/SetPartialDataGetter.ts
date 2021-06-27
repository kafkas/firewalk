import type { firestore } from 'firebase-admin';

export type SetPartialDataGetter<D> = (snapshot: firestore.QueryDocumentSnapshot<D>) => Partial<D>;
