import { firestore } from 'firebase-admin';
import { createBatchMigrator } from '../../src';

type PostDoc = {
  text: string;
  postedAt?: firestore.Timestamp;
};
const postsColGroup = firestore().collectionGroup('posts') as firestore.CollectionGroup<PostDoc>;
const migrator = createBatchMigrator(postsColGroup);
const { migratedDocCount } = await migrator.update(
  (snap) => {
    const { postedAt } = snap.data();
    return {
      publishedAt: postedAt!, // Safe to assert
      postedAt: firestore.FieldValue.delete(),
    };
  },
  (snap) => snap.data().postedAt !== undefined // Ignore if it doesn't have a `postedAt` field
);
console.log(`Updated ${migratedDocCount} posts!`);
