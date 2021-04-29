import { firestore } from 'firebase-admin';
import { CollectionMigrator } from '../src';

type UserDoc = {
  email: string;
  name: string;
  firstName?: string;
  lastName?: string;
  dob?: firestore.Timestamp;
  createdAt: firestore.Timestamp;
};

const usersCollection = firestore().collection(
  'users'
) as FirebaseFirestore.CollectionReference<UserDoc>;

const migrator = new CollectionMigrator(usersCollection);

migrator.set(
  (snap) => {
    const sss = snap.data();
    return {};
  },
  {
    merge: true,
  },
  (snap) => snap.data().dob !== undefined
);
