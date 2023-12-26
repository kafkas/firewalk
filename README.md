<h1 align="center">
  <a href="https://kafkas.github.io/firewalk">
    Firewalk
  </a>
</h1>

<p align="center">
  A light, fast, and memory-efficient collection traversal library for Firestore and Node.js.
</p>

---

<p align="center">
    <a href="https://github.com/kafkas/firewalk/blob/main/LICENSE">
    <img src="https://img.shields.io/badge/license-MIT-blue.svg" alt="Firewalk is released under the MIT license." /></a>
    <a href="https://npmjs.com/package/firewalk" alt="Version">
        <img src="https://img.shields.io/npm/v/firewalk" /></a>
    <a href="https://npmjs.com/package/firewalk" alt="Size">
        <img src="https://img.shields.io/bundlephobia/min/firewalk" /></a>
    <a href="https://npmjs.com/package/firewalk" alt="Downloads">
        <img src="https://img.shields.io/npm/dm/firewalk" /></a>
    <a href="https://" alt="Types">
        <img src="https://img.shields.io/npm/types/firewalk" /></a>
    <a href="https://github.com/kafkas/firewalk">
    <img src="https://img.shields.io/badge/PRs-welcome-brightgreen.svg" alt="PRs welcome!" /></a>
</p>

Firewalk is a Node.js library that _walks_ you through Firestore collections.

When you have millions of documents in a collection and you need to make changes to them or just read them, you can't just retrieve all of them at once as your program's memory usage will explode. Firewalk's configurable traverser objects let you do this in a simple, intuitive and memory-efficient way using batch processing with concurrency control.

Firewalk is an extremely light and well-typed library that is useful in a variety of scenarios. You can use it in database migration scripts (e.g. when you need to add a new field to all docs) or a scheduled Cloud Function that needs to check every doc in a collection periodically or even a locally run script that retrieves some data from a collection.

**Note**: This library was previously known as Firecode. We're currently in the process of porting over the documentation from the
previous site.

[**Read the introductory blog post ▸**](https://anarkafkas.medium.com/traversing-firestore-collections-efficiently-6e43cea1eefd)

[**View the full documentation (docs) ▸**](https://kafkas.github.io/firewalk)

## Overview

1. [Prerequisites](#Prerequisites)
   1. [Compatibility Map](#Compatibility-Map)
1. [Installation](#Installation)
1. [Core Concepts](#Core-Concepts)
1. [Quick Start](#Quick-Start)
1. [More Examples](#More-Examples)
1. [API](#API)
1. [Upgrading](#Upgrading)
1. [License](#License)

## Prerequisites

Firewalk is designed to work with the [Firebase Admin SDK](https://github.com/firebase/firebase-admin-node) so if you haven't already installed it, you'll need add it as a dependency to your project.

```bash
npm install firebase-admin
```

### Compatibility Map

Make sure to install the right version of Firewalk depending on the `firebase-admin` version your project is on.

| firewalk | firebase-admin |
| -------- | -------------- |
| v1       | v9, v10        |
| v2       | v11, v12       |

## Installation

You can add Firewalk to your project with npm or yarn.

```bash
npm install firewalk
```

## Core Concepts

There are only 2 kinds of objects you need to be familiar with when using this library:

1. **Traverser**: An object that walks you through a collection of documents (or more generally a [Traversable](https://kafkas.github.io/firewalk/types/Traversable.html)).

2. **Migrator**: A convenience object used for database migrations. It lets you easily write to the documents within a given traversable and uses a traverser to do that. You can easily write your own migration logic in the traverser callback if you don't want to use a migrator.

## Quick Start

Suppose we have a `users` collection and we want to send an email to each user. This is how easy it is to do that efficiently with a Firewalk traverser:

```ts
import { firestore } from 'firebase-admin';
import { createTraverser } from 'firewalk';

const usersCollection = firestore().collection('users');
const traverser = createTraverser(usersCollection);

const { batchCount, docCount } = await traverser.traverse(async (batchDocs, batchIndex) => {
  const batchSize = batchDocs.length;
  await Promise.all(
    batchDocs.map(async (doc) => {
      const { email, firstName } = doc.data();
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

### Traverse faster by increasing concurrency

```ts
const projectsColRef = firestore().collection('projects');
const traverser = createTraverser(projectsColRef, {
  batchSize: 500,
  // This means we are prepared to hold 500 * 20 = 10,000 docs in memory.
  // We sacrifice some memory to traverse faster.
  maxConcurrentBatchCount: 20,
});
const { docCount } = await traverser.traverse(async (_, batchIndex) => {
  console.log(`Gonna process batch ${batchIndex} now!`);
  // ...
});
console.log(`Traversed ${docCount} projects super-fast!`);
```

### Add a new field using a migrator

```ts
const projectsColRef = firestore().collection('projects');
const migrator = createMigrator(projectsColRef);
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
const migrator = createMigrator(usersColRef);
const { migratedDocCount } = await migrator.updateWithDerivedData((snap) => {
  const { firstName, lastName } = snap.data();
  return {
    fullName: `${firstName} ${lastName}`,
  };
});
console.log(`Updated ${migratedDocCount} users!`);
```

### Migrate faster by increasing concurrency

```ts
const projectsColRef = firestore().collection('projects');
const migrator = createMigrator(projectsColRef, { maxConcurrentBatchCount: 25 });
const { migratedDocCount } = await migrator.update('isCompleted', false);
console.log(`Updated ${migratedDocCount} projects super-fast!`);
```

### Change traversal config

```ts
const walletsWithNegativeBalance = firestore().collection('wallets').where('money', '<', 0);
const migrator = createMigrator(walletsWithNegativeBalance, {
  // We want each batch to have 500 docs. The size of the very last batch may be less than 500
  batchSize: 500,
  // We want to wait 500ms before moving to the next batch
  sleepTimeBetweenBatches: 500,
});
// Wipe out their debts!
const { migratedDocCount } = await migrator.set({ money: 0 });
console.log(`Set ${migratedDocCount} wallets!`);
```

### Rename a field

```ts
const postsColGroup = firestore().collectionGroup('posts');
const migrator = createMigrator(postsColGroup);
const { migratedDocCount } = await migrator.renameField('postedAt', 'publishedAt');
console.log(`Updated ${migratedDocCount} posts!`);
```

## [API](https://kafkas.github.io/firewalk)

You can find the full API reference for Firewalk [here](https://kafkas.github.io/firewalk). We maintain detailed docs for each major version. Here are some of the core functions that this library provides.

### [createTraverser](https://kafkas.github.io/firewalk/functions/createTraverser.html)

Creates an object which can be used to traverse a Firestore collection or, more generally, a [Traversable](https://kafkas.github.io/firewalk/types/Traversable.html).

For each batch of document snapshots in the traversable, the traverser invokes a specified async callback and immediately moves to the next batch. It does not wait for the callback Promise to resolve before moving to the next batch. That is, when `maxConcurrentBatchCount` > 1, there is no guarantee that any given batch will finish processing before a later batch.

The traverser becomes faster as you increase `maxConcurrentBatchCount`, but this will consume more memory. You should increase concurrency when you want to trade some memory for speed.

#### Complexity:

- Time complexity: _O_((_N_ / `batchSize`) \* (_Q_(`batchSize`) + _C_(`batchSize`) / `maxConcurrentBatchCount`))
- Space complexity: _O_(`maxConcurrentBatchCount` \* (`batchSize` \* _D_ + _S_))
- Billing: _max_(1, _N_) reads

where:

- _N_: number of docs in the traversable
- _Q_(`batchSize`): average batch query time
- _C_(`batchSize`): average callback processing time
- _D_: average document size
- _S_: average extra space used by the callback

### [createMigrator](https://kafkas.github.io/firewalk/functions/createMigrator.html)

Creates a migrator that facilitates database migrations. The migrator accepts a custom traverser to traverse the collection. Otherwise it will create a default traverser with your desired traversal config. This migrator does not use atomic batch writes so it is possible that when a write fails other writes go through.

#### Complexity:

- Time complexity: _TC_(`traverser`) where _C_(`batchSize`) = _W_(`batchSize`)
- Space complexity: _SC_(`traverser`) where _S_ = _O_(`batchSize`)
- Billing: _max_(1, _N_) reads, _K_ writes

where:

- _N_: number of docs in the traversable
- _K_: number of docs that passed the migration predicate (_K_<=_N_)
- _W_(`batchSize`): average batch write time
- _TC_(`traverser`): time complexity of the underlying traverser
- _SC_(`traverser`): space complexity of the underlying traverser

### [createBatchMigrator](https://kafkas.github.io/firewalk/functions/createBatchMigrator.html)

Creates a migrator that facilitates database migrations. The migrator accepts a custom traverser to traverse the collection. Otherwise it will create a default traverser with your desired traversal config. This migrator uses atomic batch writes so the entire operation will fail if a single write isn't successful.

#### Complexity:

- Time complexity: _TC_(`traverser`) where _C_(`batchSize`) = _W_(`batchSize`)
- Space complexity: _SC_(`traverser`) where _S_ = _O_(`batchSize`)
- Billing: _max_(1, _N_) reads, _K_ writes

where:

- _N_: number of docs in the traversable
- _K_: number of docs that passed the migration predicate (_K_<=_N_)
- _W_(`batchSize`): average batch write time
- _TC_(`traverser`): time complexity of the underlying traverser
- _SC_(`traverser`): space complexity of the underlying traverser

## Upgrading

This project adheres to [SemVer](https://semver.org). Before upgrading to a new major version, make sure to check out the [Releases](https://github.com/kafkas/firewalk/releases) page to view all the breaking changes.

## License

This project is made available under the MIT License.
