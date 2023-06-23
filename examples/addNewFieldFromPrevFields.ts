import { firestore } from 'firebase-admin';
import { createMigrator } from 'firewalk';

type UserDoc = {
  firstName: string;
  lastName: string;
};
const usersColRef = firestore().collection('users') as firestore.CollectionReference<UserDoc>;
const migrator = createMigrator(usersColRef);
const { migratedDocCount } = await migrator.updateWithDerivedData((snap) => {
  const { firstName, lastName } = snap.data();
  return {
    fullName: `${firstName} ${lastName}`,
  };
});
console.log(`Updated ${migratedDocCount} users!`);
