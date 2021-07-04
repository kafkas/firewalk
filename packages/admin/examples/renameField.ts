import { firestore } from 'firebase-admin';
import { createMigrator } from '../src';

const postsColGroup = firestore().collectionGroup('posts');
const migrator = createMigrator(postsColGroup);
const { migratedDocCount } = await migrator.renameField('postedAt', 'publishedAt');
console.log(`Updated ${migratedDocCount} posts!`);
