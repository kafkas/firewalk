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

To create traversers and migrators, you will be using factory functions provided by this library. We also provide you with the TypeScript types for the important objects that you will be interacting with. The generic parameter `T` that we use throughout the docs refers to the shape of the documents in the traversable and defaults to [FirebaseFirestore.DocumentData](https://github.com/googleapis/nodejs-firestore/blob/28d645bd3e368abde592bfa2611de3378ca175a6/types/firestore.d.ts#L28).

Please note that although the Github docs for this project are work-in-progress, the JSDocs and TypeScript types are solid and I'm sure you'll find them useful!

### createBatchMigrator

Creates a batch migrator object that facilitates Firestore collection migrations. Uses batch writes when writing to docs so the entire operation will fail if a single write isn't successful.

##### Signature

```
createBatchMigrator<T>(traversable: Traversable<T>, config?: TraversalConfig): Migrator<T>
```

##### Arguments

1. `traversable` ([Traversable](#Traversable)): A collection-like traversable object.
2. `config` ([TraversalConfig](#TraversalConfig)): Optional. The traversal configuration with which the migrator is created.

##### Returns

([Migrator](#Migrator)) A batch migrator object.

### createTraverser

Creates a traverser object that facilitates Firestore collection traversals.

##### Signature

```
createTraverser<T>(traversable: Traversable<T>, config?: TraversalConfig): Traverser<T>
```

##### Arguments

1. `traversable` ([Traversable](#Traversable)): A collection-like traversable object.
2. `config` ([TraversalConfig](#TraversalConfig)): Optional. The traversal configuration with which the traverser is created.

##### Returns

([Traverser](#Traverser)) A traverser object.

### MigrationResult

A plain object representing the details of a migration. Contains the following keys:

- `batchCount` (number): The number of batches that have been retrieved in this traversal.
- `traversedDocCount` (number): The number of documents that have been retrieved in this traversal.
- `migratedDocCount` (number): The number of documents that have been migrated.

### Migrator

A migrator object responsible for efficiently traversing collection-like document groups (collections, queries, collection groups) and writing to the docs retrieved in each batch. Batch migrators rely on a traverser internally to traverse the entire collection.

#### .setConfig(config)

Updates the specified keys of the traversal configuration.

##### Arguments

1. `config` (Partial\<[TraversalConfig](#TraversalConfig)\>): Partial traversal configuration.

##### Returns

([Migrator](#Migrator)) The migrator object itself.

#### .set(getData, options, predicate)

Sets all documents in this collection with the provided data.

##### Arguments

1. `getData` ((snapshot: QueryDocumentSnapshot) => object): A function that returns the data with which to set each document.
2. `options` (object) Optional. An object to configure the set behavior.
3. `predicate` ((snapshot: QueryDocumentSnapshot) => boolean): Optional. A function that returns a boolean indicating whether to migrate the current document. If this is not provided, all documents will be migrated.

##### Returns

(Promise\<[MigrationResult](#MigrationResult)\>) A Promise resolving to an object representing the details of the migration.

#### .set(data, options, predicate)

Sets all documents in this collection with the provided data.

##### Arguments

1. `data` (object): The data with which to set each document.
2. `options` (object) Optional. An object to configure the set behavior.
3. `predicate` ((snapshot: QueryDocumentSnapshot) => boolean): Optional. A function that returns a boolean indicating whether to migrate the current document. If this is not provided, all documents will be migrated.

##### Returns

(Promise\<[MigrationResult](#MigrationResult)\>) A Promise resolving to an object representing the details of the migration.

#### .update(getData, predicate)

Updates all documents in this collection with the provided data.

##### Arguments

1. `getData` ((snapshot: QueryDocumentSnapshot) => object): A function that returns the data with which to update each document.
2. `predicate` ((snapshot: QueryDocumentSnapshot) => boolean): Optional. A function that returns a boolean indicating whether to migrate the current document. If this is not provided, all documents will be migrated.

##### Returns

(Promise\<[MigrationResult](#MigrationResult)\>) A Promise resolving to an object representing the details of the migration.

#### .update(data, predicate)

Updates all documents in this collection with the provided data.

##### Arguments

1. `data` (object): The data with which to update each document. Must be a non-empty object.
2. `predicate` ((snapshot: QueryDocumentSnapshot) => boolean): Optional. A function that returns a boolean indicating whether to migrate the current document. If this is not provided, all documents will be migrated.

##### Returns

(Promise\<[MigrationResult](#MigrationResult)\>) A Promise resolving to an object representing the details of the migration.

#### .update(field, value, predicate)

Updates all documents in this collection with the provided field-value pair.

##### Arguments

1. `field` (string | firestore.FieldPath): The field to update in each document.
2. `value` (any): The value with which to update the specified field in each document. Must not be `undefined`.
3. `predicate` ((snapshot: QueryDocumentSnapshot) => boolean): Optional. A function that returns a boolean indicating whether to migrate the current document. If this is not provided, all documents will be migrated.

##### Returns

(Promise\<[MigrationResult](#MigrationResult)\>) A Promise resolving to an object representing the details of the migration.

### Traversable

A collection-like traversable object. Can be one of [CollectionReference](https://googleapis.dev/nodejs/firestore/latest/CollectionReference.html), [CollectionGroup](https://googleapis.dev/nodejs/firestore/latest/CollectionGroup.html) and [Query](https://googleapis.dev/nodejs/firestore/latest/Query.html).

### TraversalConfig

A plain object representing traversal configuration. The keys allowed are:

- `batchSize` (number): The number of documents that will be traversed in each batch. Defaults to 100.
- `sleepBetweenBatches` (boolean): Whether to sleep between batches. Defaults to `true`.
- `sleepTimeBetweenBatches` (number): The amount of time (in ms) to "sleep" before moving on to the next batch. Defaults to 1000.
- `maxDocCount` (number): The maximum number of documents that will be traversed. Defaults to `Infinity`.

### TraversalResult

A plain object representing the details of a traversal. Contains the following keys:

- `batchCount` (number): The number of batches that have been retrieved in this traversal.
- `docCount` (number): The number of documents that have been retrieved in this traversal.

### TraverseEachConfig

A plain object representing sequential traversal configuration. The keys allowed are:

- `sleepBetweenDocs` (boolean): Whether to sleep before moving to the next doc. Defaults to `false`.
- `sleepTimeBetweenDocs` (number): The amount of time (in ms) to "sleep" before moving to the next doc. Defaults to 500.

### Traverser

A traverser object responsible for efficiently traversing collection-like document groups (collections, queries, collection groups).

#### .setConfig(config)

Updates the specified keys of the traversal configuration.

##### Arguments

1. `config` (Partial\<[TraversalConfig](#TraversalConfig)\>): Partial traversal configuration.

##### Returns

([Traverser](#Traverser)) The traverser object itself.

#### .traverse(callback)

Traverses the entire collection in batches of the size specified in traversal config. Invokes the specified callback for each batch of document snapshots.

##### Arguments

1. `callback` ((batchSnapshots: QueryDocumentSnapshot[]) => Promise\<void\>): An asynchronous callback function to invoke for each batch of document snapshots.

##### Returns

(Promise\<[TraversalResult](#TraversalResult)\>) A Promise resolving to an object representing the details of the traversal.

#### .traverseEach(callback, config)

Traverses the entire collection in batches of the size specified in traversal config. Invokes the specified callback sequentially for each document snapshot in each batch.

##### Arguments

1. `callback` ((snapshot: QueryDocumentSnapshot) => Promise\<void\>): An asynchronous callback function to invoke for each document snapshot in each batch.
2. `config` ([TraverseEachConfig](#TraverseEachConfig)): Optional. The sequential traversal configuration.

##### Returns

(Promise\<[TraversalResult](#TraversalResult)\>) A Promise resolving to an object representing the details of the traversal.

## License

This project is made available under the MIT License.
