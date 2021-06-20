import { firestore } from 'firebase-admin';
import { createTraverser } from '../src';

const users = firestore().collection('users');

const traverser = createTraverser(users, {
  batchSize: 500, // The (maximum) number of documents in each batch. Obviously, the size of the very last batch may be less than 500
  sleepBetweenBatches: true, // Whether to wait before moving to the next batch
  sleepTimeBetweenBatches: 2000, // Time to wait before moving to the next batch
});

const { batchCount, docCount } = await traverser.traverse(async (snapshots) => {
  const batchSize = snapshots.length;
  const sendEmailToUsers = snapshots.map(async (snapshot) => {
    const { email } = snapshot.data();
    await sendEmail(email, 'Hello!');
  });

  await Promise.all(sendEmailToUsers);
  console.log(`Sent email to ${batchSize} users in this batch.`);
});

console.log(`Traversal done! We touched ${docCount} documents in ${batchCount} batches!`);

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
