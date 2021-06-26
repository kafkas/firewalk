import { firestore } from 'firebase-admin';
import { createBatchMigrator } from '../../src';

type PostDoc = {
  text: string;
  postedAt?: firestore.Timestamp;
};
const postsColGroup = firestore().collectionGroup('posts') as firestore.CollectionGroup<PostDoc>;
const migrator = createBatchMigrator(postsColGroup);
const { migratedDocCount } = await migrator
  .withPredicate(
    // Ignore if it doesn't have a `postedAt` field
    (snap) => snap.data().postedAt !== undefined
  )
  .update((snap) => {
    const { postedAt } = snap.data();
    return {
      publishedAt: postedAt!, // Safe to assert now
      postedAt: firestore.FieldValue.delete(),
    };
  });
console.log(`Updated ${migratedDocCount} posts!`);
