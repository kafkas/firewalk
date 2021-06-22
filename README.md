# Firecode

Firecode is a Node.js library that lets you efficiently traverse Firestore collections.

When you have millions of documents in a collection, you can't just get all of them at once as your machine's memory will explode. Firecode's configurable traverser objects let you do this in a simple, intuitive and memory-efficient way using batching.

Firecode is an extremely light, well-typed, zero-dependency library that is useful in a variety of scenarios. You can use it in database migration scripts (e.g. when you need to add a new field to all docs) or a scheduled Cloud Function that needs to check every doc in a collection periodically or a locally run script that retrieves some data from a collection.

<p>
    <a href="https://npmjs.com/package/@firecode/admin" alt="Version">
        <img src="https://img.shields.io/npm/v/@firecode/admin" /></a>
    <a href="https://npmjs.com/package/@firecode/admin" alt="Size">
        <img src="https://img.shields.io/bundlephobia/min/@firecode/admin" /></a>
    <a href="https://npmjs.com/package/@firecode/admin" alt="Downloads">
        <img src="https://img.shields.io/npm/dm/@firecode/admin" /></a>
    <a href="https://" alt="Types">
        <img src="https://img.shields.io/npm/types/@firecode/admin" /></a>
    <a href="https://github.com/kafkas/firecode" alt="Activity">
        <img src="https://img.shields.io/github/commit-activity/m/kafkas/firecode" /></a>
    <a href="https://" alt="Last Commit">
        <img src="https://img.shields.io/github/last-commit/kafkas/firecode" /></a>
    <a href="https://lerna.js.org/" alt="Framework">
        <img src="https://img.shields.io/badge/maintained%20with-lerna-cc00ff.svg" /></a>
</p>

## Overview

1. [Installation](#Installation)
2. [Quick Start](#Quick-Start)
3. [More Examples](#More-Examples)
4. [API](#API)
5. [License](#License)

## Installation

Firecode is designed to work with the [Firebase Admin SDK](https://github.com/firebase/firebase-admin-node) so if you haven't already installed it, run

```
npm install firebase-admin
```

Then run

```
npm install @firecode/admin
```

## Quick Start

Suppose we want to send an email to all our users. We have a `users` collection that needs to be traversed. The following piece of code uses a Firecode traverser to do this simply and efficiently.

```ts
import { firestore } from 'firebase-admin';
import { createTraverser } from '@firecode/admin';

const usersCollection = firestore().collection('users');

const traverser = createTraverser(usersCollection, {
  // We want each batch to have 500 docs. Obviously, the size of the very last batch may be less than 500
  batchSize: 500,
  // We want to wait before moving to the next batch
  sleepBetweenBatches: true,
  // We'll wait 500ms before moving to the next batch
  sleepTimeBetweenBatches: 500,
});

const { batchCount, docCount } = await traverser.traverse(async (snapshots) => {
  const batchSize = snapshots.length;

  const sendEmailToEachUserInBatch = () =>
    Promise.all(
      snapshots.map(async (snapshot) => {
        const { email, firstName } = snapshot.data();
        await sendEmail({ to: email, content: `Hello ${firstName}!` });
      })
    );

  await sendEmailToEachUserInBatch();

  console.log(`Successfully emailed ${batchSize} users in this batch.`);
});

console.log(`Traversal done! We emailed ${docCount} users in ${batchCount} batches!`);
```

We are doing 3 things here:

1. Create a reference to the `users` collection
2. Pass that reference to the `createTraverser()` function and create the traverser with our desired configuration
3. Invoke `.traverse()` with an async callback that is called for each batch of document snapshots

This pretty much sums up the core functionality of this library! The `.traverse()` method returns a Promise that resolves when the entire traversal finishes, which can take a while if you have millions of docs. The Promise resolves with an object containing the traversal details e.g. the number of docs you touched.

## More Examples

### Add a new field

```ts
const projectsCollection = firestore().collection('projects');
const migrator = createBatchMigrator(projectsCollection, { batchSize: 250 });

const { migratedDocCount } = await migrator.update('isCompleted', false);
console.log(`Successfully updated ${migratedDocCount} projects!`);
```

### Add a new field derived from the previous fields

```ts
type UserDoc = {
  firstName: string;
  lastName: string;
};

const usersCollection = firestore().collection('users') as firestore.CollectionReference<UserDoc>;
const migrator = createBatchMigrator(usersCollection, { batchSize: 250 });

const { migratedDocCount } = await migrator.update((snap) => {
  const { firstName, lastName } = snap.data();
  return {
    fullName: `${firstName} ${lastName}`,
  };
});
console.log(`Successfully updated ${migratedDocCount} users!`);
```

### Rename an optional field

```ts
type UserPostDoc = {
  text: string;
  postedAt?: firestore.Timestamp;
};

const userPostsCollectionGroup = firestore().collectionGroup(
  'posts'
) as firestore.CollectionGroup<UserPostDoc>;
const migrator = createBatchMigrator(userPostsCollectionGroup, { batchSize: 250 });

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
console.log(`Successfully updated ${migratedDocCount} users!`);
```

## [API](./packages/admin/docs/API.md)

You can find the full API reference for `@firecode/admin` [here](./packages/admin/docs/API.md).

## License

This project is made available under the MIT License.
