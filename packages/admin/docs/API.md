# API Reference

## Core Concepts

There are only 2 kinds of objects you need to be familiar with when using this library:

1. **Traverser**: An object that walks you through a collection of documents (or more generally a [Traversable](./packages/admin/docs/API.md#Traversable)).

2. **Migrator**: A convenience object used for database migrations. It lets you easily write to the documents within a given traversable and uses a traverser to do that. You can easily write your own migration logic in the traverser callback if you don't want to use a migrator.

To create traversers and migrators, you will be using factory functions provided by this library. We also provide you with the TypeScript types for the important objects that you will be interacting with. The generic parameter `D` that we use throughout the docs refers to the shape of the documents in the traversable and defaults to [firestore.DocumentData](https://github.com/googleapis/nodejs-firestore/blob/28d645bd3e368abde592bfa2611de3378ca175a6/types/firestore.d.ts#L28).

Please note that although the Github docs for this project are work-in-progress, the JSDocs and TypeScript types that we provide are solid and I'm sure you'll find them useful!

## API Overview

- [BatchMigrator](#BatchMigrator)
- [createBatchMigrator](#createBatchMigrator)
- [createFastTraverser](#createFastTraverser)
- [createMigrator](#createMigrator)
- [createTraverser](#createTraverser)
- [DefaultMigrator](#DefaultMigrator)
- [FastTraversalConfig](#FastTraversalConfig)
- [FastTraverser](#FastTraverser)
- [MigrationResult](#MigrationResult)
- [Migrator](#Migrator)
- [SlowTraverser](#SlowTraverser)
- [Traversable](#Traversable)
- [TraversalConfig](#TraversalConfig)
- [TraversalResult](#TraversalResult)
- [TraverseEachConfig](#TraverseEachConfig)
- [Traverser](#Traverser)

## BatchMigrator

A migrator that uses batch Firestore batch writes when writing to documents.

Same interface as [Migrator](#Migrator).

## createBatchMigrator

#### Signature 1

Creates a migrator that facilitates database migrations. Accepts a custom traverser object as argument which the migrator will use when traversing the collection and writing to documents. This migrator uses batch writes when writing to docs so the entire operation will fail if a single write isn't successful.

```
createBatchMigrator(traverser: Traverser): BatchMigrator
```

#### Arguments

1. `traverser` ([Traverser](#Traverser)): The traverser object that this migrator will use when traversing the collection and writing to documents.

#### Returns

([BatchMigrator](#BatchMigrator)) A batch migrator object.

#### Signature 2

Creates a migrator that facilitates database migrations. The migrator creates a default (slow) traverser that it uses when traversing the collection and writing to documents.

```
createBatchMigrator(traversable: Traversable, traversalConfig?: Partial<TraversalConfig>): BatchMigrator
```

#### Arguments

1. `traversable` ([Traversable](#Traversable)): A collection-like traversable object.
2. `traversalConfig` (Partial\<[TraversalConfig](#TraversalConfig)\>): Optional. The traversal configuration with which the migrator is created.

#### Returns

([BatchMigrator](#BatchMigrator)) A batch migrator object.

## createFastTraverser

Creates a fast traverser object that facilitates Firestore collection traversals. When traversing the collection, this traverser invokes a specified async callback for each batch of document snapshots and immediately moves to the next batch. It does not wait for the callback Promise to resolve before moving to the next batch so there is no guarantee that any given batch will finish processing before a later batch. This traverser uses more memory but is significantly faster than the default traverser.

#### Signature

```
createFastTraverser(traversable: Traversable, config?: Partial<FastTraversalConfig>): FastTraverser
```

#### Arguments

1. `traversable` ([Traversable](#Traversable)): A collection-like traversable group of documents.
2. `config` (Partial\<[FastTraversalConfig](#FastTraversalConfig)\>): Optional. The traversal configuration with which the traverser will be created.

#### Returns

([FastTraverser](#FastTraverser)) A fast traverser object.

## createMigrator

#### Signature 1

Creates a migrator that facilitates database migrations. Accepts a custom traverser object as argument which the migrator will use when traversing the collection and writing to documents. This migrator does not use atomic writes so it is possible that when a write fails other writes go through.

```
createMigrator(traverser: Traverser): DefaultMigrator
```

#### Arguments

1. `traverser` ([Traverser](#Traverser)): The traverser object that this migrator will use when traversing the collection and writing to documents.

#### Returns

([DefaultMigrator](#DefaultMigrator)) A default migrator object.

#### Signature 2

Creates a migrator that facilitates database migrations. The migrator creates a default (slow) traverser that it uses when traversing the collection and writing to documents.

```
createMigrator(traversable: Traversable, traversalConfig?: Partial<TraversalConfig>): DefaultMigrator
```

#### Arguments

1. `traversable` ([Traversable](#Traversable)): A collection-like traversable object.
2. `traversalConfig` (Partial\<[TraversalConfig](#TraversalConfig)\>): Optional. The traversal configuration with which the migrator is created.

#### Returns

([DefaultMigrator](#DefaultMigrator)) A default migrator object.

## createTraverser

Creates a traverser object that facilitates Firestore collection traversals. When traversing the collection, this traverser invokes a specified async callback for each batch of document snapshots and waits for the callback Promise to resolve before moving to the next batch.

#### Signature

```
createTraverser(traversable: Traversable, config?: Partial<TraversalConfig>): SlowTraverser
```

#### Arguments

1. `traversable` ([Traversable](#Traversable)): A collection-like traversable group of documents.
2. `config` (Partial\<[TraversalConfig](#TraversalConfig)\>): Optional. The traversal configuration with which the traverser will be created.

#### Returns

([SlowTraverser](#SlowTraverser)) A default (slow) traverser object.

## DefaultMigrator

A migrator that does not use Firestore batch writes when writing to documents.

Same interface as [Migrator](#Migrator).

## FastTraversalConfig

A plain object representing fast traversal configuration. In addition to the keys in [TraversalConfig](#TraversalConfig), the following keys are accepted:

- `maxConcurrentBatchCount` (number): The maximum number of batches that can be held in memory and processed concurrently. Defaults to 10.

## FastTraverser

A fast traverser object that facilitates Firestore collection traversals.

### .withConfig(config)

Applies the specified config values to the traverser.

#### Arguments

1. `config` (Partial\<[FastTraversalConfig](#FastTraversalConfig)\>): Partial traversal configuration.

#### Returns

([FastTraverser](#FastTraverser)) A new FastTraverser object.

### .traverse(callback)

Traverses the entire collection in batches of the size specified in traversal config. Invokes the specified async callback for each batch of document snapshots and immediately moves to the next batch. Does not wait for the callback Promise to resolve before moving to the next batch so there is no guarantee that any given batch will finish processing before a later batch.

#### Properties

- Time complexity: _O_(_C_ + (_N_ / `batchSize`) \* _Q_(`batchSize`))
- Space complexity: _O_(`maxConcurrentBatchCount` \* (`batchSize` \* _D_ + _S_))
- Billing: _max_(1, _N_) reads

where:

- _N_: number of docs in the traversable
- _Q_(`batchSize`): average batch query time
- _C_: average callback processing time
- _D_: document size
- _S_: average extra space used by the callback

#### Arguments

1. `callback` ((batchSnapshots: QueryDocumentSnapshot[], batchIndex: number) => Promise\<void\>): An asynchronous callback function to invoke for each batch of document snapshots. Takes batch document snapshots and the 0-based batch index as its arguments.

#### Returns

(Promise<[TraversalResult](#TraversalResult)>) A Promise resolving to an object representing the details of the traversal. The Promise resolves when the entire traversal ends.

### .traverseEach(callback, config)

Traverses the entire collection in batches of the size specified in traversal config. Invokes the specified callback sequentially for each document snapshot in each batch.

#### Arguments

1. `callback` ((snapshot: QueryDocumentSnapshot) => Promise\<void\>): An asynchronous callback function to invoke for each document snapshot in each batch.
2. `config` ([TraverseEachConfig](#TraverseEachConfig)): Optional. The sequential traversal configuration.

#### Returns

(Promise\<[TraversalResult](#TraversalResult)\>) A Promise resolving to an object representing the details of the traversal. The Promise resolves when the entire traversal ends.

## MigrationResult

A plain object representing the details of a migration. Contains the following keys:

- `batchCount` (number): The number of batches that have been retrieved in this traversal.
- `traversedDocCount` (number): The number of documents that have been retrieved in this traversal.
- `migratedDocCount` (number): The number of documents that have been migrated.

## Migrator

Represents the general interface of a migrator.

#### Properties

The `set()` and `update()` methods of a migrator have the following properties:

- Time complexity: _TC_(`traverser`) where _C_ = _W_(`batchSize`)
- Space complexity: _SC_(`traverser`) where _S_ = _O_(`batchSize`)
- Billing: _max_(1, _N_) reads, _K_ writes

where:

- _N_: number of docs in the traversable
- _K_: number of docs that passed the migration predicate (_K_<=_N_)
- _W_(`batchSize`): average batch write time
- _TC_(`traverser`): time complexity of the underlying traverser
- _SC_(`traverser`): space complexity of the underlying traverser

### .set(data, options)

Sets all documents in this collection with the provided data.

#### Arguments

1. `data` (object): The data with which to set each document.
2. `options` (object) Optional. An object to configure the set behavior.

#### Returns

(Promise\<[MigrationResult](#MigrationResult)\>) A Promise resolving to an object representing the details of the migration.

### .set(getData, options)

Sets all documents in this collection with the provided data.

#### Arguments

1. `getData` ((snapshot: QueryDocumentSnapshot) => object): A function that returns the data with which to set each document.
2. `options` (object) Optional. An object to configure the set behavior.

#### Returns

(Promise\<[MigrationResult](#MigrationResult)\>) A Promise resolving to an object representing the details of the migration.

### .update(getData)

Updates all documents in this collection with the provided data.

#### Arguments

1. `getData` ((snapshot: QueryDocumentSnapshot) => object): A function that returns the data with which to update each document.

#### Returns

(Promise\<[MigrationResult](#MigrationResult)\>) A Promise resolving to an object representing the details of the migration.

### .update(data)

Updates all documents in this collection with the provided data.

#### Arguments

1. `data` (object): The data with which to update each document. Must be a non-empty object.

#### Returns

(Promise\<[MigrationResult](#MigrationResult)\>) A Promise resolving to an object representing the details of the migration.

### .update(field, value)

Updates all documents in this collection with the provided field-value pair.

#### Arguments

1. `field` (string | firestore.FieldPath): The field to update in each document.
2. `value` (any): The value with which to update the specified field in each document. Must not be `undefined`.

#### Returns

(Promise\<[MigrationResult](#MigrationResult)\>) A Promise resolving to an object representing the details of the migration.

## SlowTraverser

A slow traverser object that facilitates Firestore collection traversals.

### .withConfig(config)

Applies the specified config values to the traverser.

#### Arguments

1. `config` (Partial\<[TraversalConfig](#TraversalConfig)\>): Partial traversal configuration.

#### Returns

([SlowTraverser](#SlowTraverser)) A new SlowTraverser object.

### .traverse(callback)

Traverses the entire collection in batches of the size specified in traversal config. Invokes the specified async callback for each batch of document snapshots. Waits for the callback Promise to resolve before moving to the next batch.

#### Properties

- Time complexity: _O_((_N_ / `batchSize`) \* (_Q_(`batchSize`) + _C_))
- Space complexity: _O_(`batchSize` \* _D_ + _S_)
- Billing: max(1, _N_) reads

where:

- _N_: number of docs in the traversable
- _Q_(`batchSize`): average batch query time
- _C_: average processing time
- _D_: document size
- _S_: average extra space used by the callback

#### Arguments

1. `callback` ((batchSnapshots: QueryDocumentSnapshot[], batchIndex: number) => Promise\<void\>): An asynchronous callback function to invoke for each batch of document snapshots. Takes batch document snapshots and the 0-based batch index as its arguments.

#### Returns

(Promise<[TraversalResult](#TraversalResult)>) A Promise resolving to an object representing the details of the traversal. The Promise resolves when the entire traversal ends.

### .traverseEach(callback, config)

Traverses the entire collection in batches of the size specified in traversal config. Invokes the specified callback sequentially for each document snapshot in each batch.

#### Arguments

1. `callback` ((snapshot: QueryDocumentSnapshot) => Promise\<void\>): An asynchronous callback function to invoke for each document snapshot in each batch.
2. `config` ([TraverseEachConfig](#TraverseEachConfig)): Optional. The sequential traversal configuration.

#### Returns

(Promise\<[TraversalResult](#TraversalResult)\>) A Promise resolving to an object representing the details of the traversal. The Promise resolves when the entire traversal ends.

## Traversable

A collection-like group of documents. Can be one of [CollectionReference](https://googleapis.dev/nodejs/firestore/latest/CollectionReference.html), [CollectionGroup](https://googleapis.dev/nodejs/firestore/latest/CollectionGroup.html) and [Query](https://googleapis.dev/nodejs/firestore/latest/Query.html).

## TraversalConfig

A plain object representing traversal configuration. The keys allowed are:

- `batchSize` (number): The number of documents that will be traversed in each batch. Defaults to 250.
- `sleepBetweenBatches` (boolean): Whether to sleep between batches. Defaults to `false`.
- `sleepTimeBetweenBatches` (number): The amount of time (in ms) to "sleep" before moving on to the next batch. Defaults to 500.
- `maxDocCount` (number): The maximum number of documents that will be traversed. Defaults to `Infinity`.

## TraversalResult

A plain object representing the details of a traversal. Contains the following keys:

- `batchCount` (number): The number of batches that have been retrieved in this traversal.
- `docCount` (number): The number of documents that have been retrieved in this traversal.

## TraverseEachConfig

A plain object representing sequential traversal configuration. The keys allowed are:

- `sleepBetweenDocs` (boolean): Whether to sleep before moving to the next doc. Defaults to `false`.
- `sleepTimeBetweenDocs` (number): The amount of time (in ms) to "sleep" before moving to the next doc. Defaults to 500.

## Traverser

Represents the general interface of a traverser.
