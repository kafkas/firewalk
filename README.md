# Firecode

Firecode is a Node.js library that lets you efficiently traverse Firestore collections.

When you have millions of documents in a collection, you can't just get all of them at once as your program's memory will explode. Firecode's configurable traverser objects let you do this in a simple, intuitive and memory-efficient way using batching.

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
2. [Core Concepts](#Core-Concepts)
3. [Quick Start](#Quick-Start)
4. [More Examples](#More-Examples)
5. [API](#API)
6. [Upgrading](#Upgrading)
7. [License](#License)

## Installation

Firecode is designed to work with the [Firebase Admin SDK](https://github.com/firebase/firebase-admin-node) so if you haven't already installed it, run

```
npm install firebase-admin
```

Then run

```
npm install @firecode/admin
```

## Core Concepts

There are only 2 kinds of objects you need to be familiar with when using this library:

1. **Traverser**: An object that walks you through a collection of documents (or more generally a [Traversable](./packages/admin/docs/API.md#Traversable)).

2. **Migrator**: A convenience object used for database migrations. It lets you easily write to the documents within a given traversable and uses a traverser to do that.

## Quick Start

Suppose we have a `users` collection and we want to send an email to each user. This is how easy it is to do that efficiently with a Firecode traverser:

```ts
import { firestore } from 'firebase-admin';
import { createTraverser } from '@firecode/admin';

const usersCollection = firestore().collection('users');
const traverser = createTraverser(usersCollection);

const { batchCount, docCount } = await traverser.traverse(async (batchDocs, batchIndex) => {
  const batchSize = batchDocs.length;
  await Promise.all(
    batchDocs.map(async (snapshot) => {
      const { email, firstName } = snapshot.data();
      await sendEmail({ to: email, content: `Hello ${firstName}!` });
    })
  );
  console.log(`Batch ${batchIndex} done! We emailed ${batchSize} users in this batch.`);
});

console.log(`Traversal done! We emailed ${docCount} users in ${batchCount} batches!`);
```

We are doing 3 things here:

1. Create a reference to the `users` collection
2. Pass that reference to the `createTraverser()` function
3. Invoke `.traverse()` with an async callback that is called for each batch of document snapshots

This pretty much sums up the core functionality of this library! The `.traverse()` method returns a Promise that resolves when the entire traversal finishes, which can take a while if you have millions of docs. The Promise resolves with an object containing the traversal details e.g. the number of docs you touched.

## More Examples

### Add a new field

```ts
const projectsColRef = firestore().collection('projects');
const migrator = createBatchMigrator(projectsColRef);
const { migratedDocCount } = await migrator.update('isCompleted', false);
console.log(`Updated ${migratedDocCount} projects!`);
```

### Add a new field derived from the previous fields

```ts
type UserDoc = {
  firstName: string;
  lastName: string;
};
const usersColRef = firestore().collection('users') as firestore.CollectionReference<UserDoc>;
const migrator = createBatchMigrator(usersColRef);
const { migratedDocCount } = await migrator.update((snap) => {
  const { firstName, lastName } = snap.data();
  return {
    fullName: `${firstName} ${lastName}`,
  };
});
console.log(`Updated ${migratedDocCount} users!`);
```

### Change traversal config

```ts
const walletsWithNegativeBalance = firestore().collection('wallets').where('money', '<', 0);
const migrator = createBatchMigrator(walletsWithNegativeBalance, {
  // We want each batch to have 500 docs. The size of the very last batch may be less than 500
  batchSize: 500,
  // We want to wait before moving to the next batch
  sleepBetweenBatches: true,
  // We want to wait 500ms before moving to the next batch
  sleepTimeBetweenBatches: 500,
});
// Wipe out their debts!
const { migratedDocCount } = await migrator.set({ money: 0 });
console.log(`Updated ${migratedDocCount} wallets!`);
```

### Rename an optional field

```ts
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
```

## [API](./packages/admin/docs/API.md)

You can find the full API reference for `@firecode/admin` [here](./packages/admin/docs/API.md). Here are some of the core functions that this library provides.

### [createTraverser](./packages/admin/docs/API.md#createTraverser)

Creates a traverser that facilitates Firestore collection traversals. When traversing the collection, this traverser invokes a specified async callback for each batch of document snapshots and waits for the callback Promise to resolve before moving to the next batch.

#### Traversal properties

- Time complexity: _O_((_N_ / `batchSize`) \* (_Q_(`batchSize`) + _C_))
- Space complexity: _O_(`batchSize` \* _D_ + _S_)
- Billing: _N_ reads

where:

- _N_: number of docs in the traversable
- _Q_(`batchSize`): average batch query time
- _C_: average processing time
- _D_: document size
- _S_: average extra space used by the callback

### [createFastTraverser](./packages/admin/docs/API.md#createFastTraverser) (coming in the next release)

Creates a fast traverser that facilitates Firestore collection traversals. When traversing the collection, this traverser invokes a specified async callback for each batch of document snapshots and immediately moves to the next batch. It does not wait for the callback Promise to resolve before moving to the next batch so there is no guarantee that any given batch will finish processing before a later batch. This traverser uses more memory but is significantly faster than the default traverser.

#### Traversal properties

- Time complexity: _O_(_C_ + (_N_ / `batchSize`) \* _Q_(`batchSize`))
- Space complexity: _O_(`maxConcurrentBatchCount` \* (`batchSize` \* _D_ + _S_))
- Billing: _N_ reads

where:

- _N_: number of docs in the traversable
- _Q_(`batchSize`): average batch query time
- _C_: average callback processing time
- _D_: document size
- _S_: average extra space used by the callback

### [createMigrator](./packages/admin/docs/API.md#createMigrator) (coming in v0.7)

Creates a migrator that facilitates database migrations. The migrator accepts a custom traverser to traverse the collection. Otherwise it will create a default traverser with your desired traversal config. This migrator does not use atomic writes so it is possible that when a write fails other writes go through.

#### Write properties

- Time complexity: _TC_(`traverser`) where _C_ = _W_(`batchSize`)
- Space complexity: _SC_(`traverser`) where _S_ = _O_(`batchSize`)
- Billing: _N_ reads, _K_ writes

where:

- _N_: number of docs in the traversable
- _K_: number of docs that passed the migration predicate (_K_<=_N_)
- _W_(`batchSize`): average batch write time
- _TC_(`traverser`): time complexity of the underlying traverser
- _SC_(`traverser`): space complexity of the underlying traverser

### [createBatchMigrator](./packages/admin/docs/API.md#createBatchMigrator)

Creates a migrator that facilitates database migrations. The migrator accepts a custom traverser to traverse the collection. Otherwise it will create a default traverser with your desired traversal config. This migrator uses batch writes so the entire operation will fail if a single write isn't successful.

#### Write properties

- Time complexity: _TC_(`traverser`) where _C_ = _W_(`batchSize`)
- Space complexity: _SC_(`traverser`) where _S_ = _O_(`batchSize`)
- Billing: _N_ reads, _K_ writes

where:

- _N_: number of docs in the traversable
- _K_: number of docs that passed the migration predicate (_K_<=_N_)
- _W_(`batchSize`): average batch write time
- _TC_(`traverser`): time complexity of the underlying traverser
- _SC_(`traverser`): space complexity of the underlying traverser

## Upgrading

This project is still very new and we have a lot to work on. We will be moving fast and until we release v1, there may be breaking changes between minor versions (e.g. when upgrading from 0.4 to 0.5). However, all breaking changes will be documented and you can always use our [Releases](https://github.com/kafkas/firecode/releases) page as a changelog.

## License

This project is made available under the MIT License.
