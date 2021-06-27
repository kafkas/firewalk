import type { firestore } from 'firebase-admin';

export type MigrationPredicate<D> = (snapshot: firestore.QueryDocumentSnapshot<D>) => boolean;
