# Firecode

Firecode is a Node.js library that lets you efficiently traverse Firestore collections.

When you have millions of documents in a collection, you can't just get all of them at once as your machine's memory will explode. Firecode's configurable traverser objects let you do this in a simple, intuitive and memory-efficient way using batching.

Firecode is an extremely light, well-typed, zero-dependency library that is useful in a variety of scenarios. You can use it in database migration scripts (e.g. when you need add a new field to all docs) or a scheduled Cloud Function that needs to check every doc in a collection periodically.

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

const users = firestore().collection('users');

const traverser = createTraverser(users, {
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

## API

### createBatchMigrator

Creates a batch migrator object that facilitates Firestore collection migrations. Uses batch writes when writing to docs so the entire operation will fail if a single write isn't successful.

#### Signature

createBatchMigrator\<T\>(traversable, traversalConfig)

#### Arguments

1. traversable ([Traversable\<T\>](#Traversable<T>)): A collection-like traversable object.
2. traversalConfig ([TraversalConfig](#TraversalConfig)): Optional. The traversal configuration with which the migrator is created.

#### Returns

([CollectionMigrator\<T\>](#CollectionMigrator<T>)) A batch migrator object.

### createTraverser

Creates a traverser object that facilitates Firestore collection traversals.

#### Signature

createTraverser\<T\>(traversable, traversalConfig)

#### Arguments

1. traversable ([Traversable\<T\>](#Traversable<T>)): A collection-like traversable object.
2. traversalConfig ([TraversalConfig](#TraversalConfig)): Optional. The traversal configuration with which the traverser is created.

#### Returns

([CollectionTraverser\<T\>](#CollectionTraverser<T>)) A traverser object.

### Traversable\<T\>

A collection-like traversable object. Can be one of [CollectionReference\<T\>](https://googleapis.dev/nodejs/firestore/latest/CollectionReference.html), [CollectionGroup\<T\>](https://googleapis.dev/nodejs/firestore/latest/CollectionGroup.html) and [Query\<T\>](https://googleapis.dev/nodejs/firestore/latest/Query.html)

### TraversalConfig

A plain object representing traversal configuration. The keys allowed are:

- `batchSize` (number): The number of documents that will be traversed in each batch. Defaults to 100.
- `sleepBetweenBatches` (boolean): Whether to sleep between batches. Defaults to `true`.
- `sleepTimeBetweenBatches` (number): The amount of time (in ms) to "sleep" before moving on to the next batch. Defaults to 1000.
- `maxDocCount` (number): The maximum number of documents that will be traversed. Defaults to `Infinity`.

### CollectionMigrator\<T\>

A migrator object responsible for efficiently traversing collection-like document groups (collections, queries, collection groups) and writing to the docs retrieved in each batch. Batch migrators rely on a traverser internally to traverse entire collection.

#### TODO: Methods

### CollectionTraverser\<T\>

A traverser object responsible for efficiently traversing collection-like document groups (collections, queries, collection groups).

#### TODO: Methods

## License

This project is made available under the MIT License.
