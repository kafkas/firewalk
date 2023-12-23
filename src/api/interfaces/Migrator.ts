import type { firestore } from 'firebase-admin';
import type {
  BatchCallback,
  MigrationPredicate,
  MigrationResult,
  SetDataGetter,
  SetOptions,
  SetPartialDataGetter,
  Traverser,
  UpdateDataGetter,
  UpdateFieldValueGetter,
} from '.';

/**
 * Represents the general interface of a migrator.
 */
export interface Migrator<D = firestore.DocumentData> {
  /**
   * The underlying traverser.
   */
  readonly traverser: Traverser<D>;

  /**
   * Applies a migration predicate that indicates whether to migrate the current document or not. By default, all
   * documents are migrated.
   *
   * @remarks
   *
   * If you have already applied other migration predicates to this migrator, this and all the other predicates will be
   * evaluated and the resulting booleans will be AND'd to get the boolean that indicates whether to migrate the document
   * or not. This is consistent with the intuitive default behavior that all documents are migrated.
   *
   * @example
   *
   * ```ts
   * const newMigrator = migrator
   *   .withPredicate((doc) => doc.get('name') !== undefined)
   *   .withPredicate((doc) => doc.ref.path.startsWith('users/'));
   * ```
   *
   * In the above case `newMigrator` will migrate only the documents whose `name` field is not missing AND whose path
   * starts with `"users/"`.
   *
   * @param predicate - A function that takes a document snapshot and returns a boolean indicating whether to migrate it.
   * @returns A new {@link Migrator} object.
   */
  withPredicate(predicate: MigrationPredicate<D>): Migrator<D>;

  /**
   * Applies a new traverser that will be used by the migrator.
   *
   * @param traverser - The new traverser that the migrator will use.
   * @returns A new {@link Migrator} object.
   */
  withTraverser(traverser: Traverser<D>): Migrator<D>;

  /**
   * Registers a callback function that fires right before a batch starts processing. You can register at most 1
   * callback. If you call this function multiple times, only the last callback will be registered.
   *
   * @param callback - A synchronous callback that takes batch doc snapshots and the 0-based batch index as its arguments.
   */
  onBeforeBatchStart(callback: BatchCallback<D>): void;

  /**
   * Registers a callback function that fires after a batch is processed. You can register at most 1 callback. If you call
   * this function multiple times, only the last callback will be registered.
   *
   * @param callback - A synchronous callback that takes batch doc snapshots and the 0-based batch index as its arguments.
   */
  onAfterBatchComplete(callback: BatchCallback<D>): void;

  /**
   * Deletes the specified field from all documents in this collection.
   *
   * @remarks
   *
   * **Complexity:**
   *
   * - Time complexity: _TC_(`traverser`) where _C_(`batchSize`) = _W_(`batchSize`)
   * - Space complexity: _SC_(`traverser`) where _S_ = _O_(`batchSize`)
   * - Billing: _max_(1, _N_) reads, _K_ writes
   *
   * where:
   *
   * - _N_: number of docs in the traversable
   * - _K_: number of docs that passed the migration predicate (_K_<=_N_)
   * - _W_(`batchSize`): average batch write time
   * - _TC_(`traverser`): time complexity of the underlying traverser
   * - _SC_(`traverser`): space complexity of the underlying traverser
   *
   * @param field - The field to delete.
   * @returns A Promise resolving to an object representing the details of the migration.
   */
  deleteField(field: string | firestore.FieldPath): Promise<MigrationResult>;

  /**
   * Deletes the specified fields from all documents in this collection.
   *
   * @remarks
   *
   * **Complexity:**
   *
   * - Time complexity: _TC_(`traverser`) where _C_(`batchSize`) = _W_(`batchSize`)
   * - Space complexity: _SC_(`traverser`) where _S_ = _O_(`batchSize`)
   * - Billing: _max_(1, _N_) reads, _K_ writes
   *
   * where:
   *
   * - _N_: number of docs in the traversable
   * - _K_: number of docs that passed the migration predicate (_K_<=_N_)
   * - _W_(`batchSize`): average batch write time
   * - _TC_(`traverser`): time complexity of the underlying traverser
   * - _SC_(`traverser`): space complexity of the underlying traverser
   *
   * @example
   *
   * ```ts
   * const field1 = new firestore.FieldPath('name', 'last');
   * const field2 = 'lastModifiedAt';
   * await migrator.deleteFields(field1, field2);
   * ```
   *
   * @param fields - A list of fields to delete.
   * @returns A Promise resolving to an object representing the details of the migration.
   */
  deleteFields(...fields: (string | firestore.FieldPath)[]): Promise<MigrationResult>;

  /**
   * Renames the specified field in all documents in this collection. Ignores the fields that are missing.
   *
   * @remarks
   *
   * **Complexity:**
   *
   * - Time complexity: _TC_(`traverser`) where _C_(`batchSize`) = _W_(`batchSize`)
   * - Space complexity: _SC_(`traverser`) where _S_ = _O_(`batchSize`)
   * - Billing: _max_(1, _N_) reads, _K_ writes
   *
   * where:
   *
   * - _N_: number of docs in the traversable
   * - _K_: number of docs that passed the migration predicate (_K_<=_N_)
   * - _W_(`batchSize`): average batch write time
   * - _TC_(`traverser`): time complexity of the underlying traverser
   * - _SC_(`traverser`): space complexity of the underlying traverser
   *
   * @param oldField - The old field.
   * @param newField - The new field.
   * @returns A Promise resolving to an object representing the details of the migration.
   */
  renameField(
    oldField: string | firestore.FieldPath,
    newField: string | firestore.FieldPath
  ): Promise<MigrationResult>;

  /**
   * Renames the specified fields in all documents in this collection. Ignores the fields that are missing.
   *
   * @remarks
   *
   * **Complexity:**
   *
   * - Time complexity: _TC_(`traverser`) where _C_(`batchSize`) = _W_(`batchSize`)
   * - Space complexity: _SC_(`traverser`) where _S_ = _O_(`batchSize`)
   * - Billing: _max_(1, _N_) reads, _K_ writes
   *
   * where:
   *
   * - _N_: number of docs in the traversable
   * - _K_: number of docs that passed the migration predicate (_K_<=_N_)
   * - _W_(`batchSize`): average batch write time
   * - _TC_(`traverser`): time complexity of the underlying traverser
   * - _SC_(`traverser`): space complexity of the underlying traverser
   *
   * @example
   *
   * ```ts
   * const change1 = [new firestore.FieldPath('name', 'last'), 'lastName'];
   * const change2 = ['lastModifiedAt', 'lastUpdatedAt'];
   * await migrator.renameFields(change1, change2);
   * ```
   *
   * @param changes - A list of `[oldField, newField]` tuples. Each tuple is an array of 2 elements:
   * the old field to rename and the new field.
   * @returns A Promise resolving to an object representing the details of the migration.
   */
  renameFields(
    ...changes: [oldField: string | firestore.FieldPath, newField: string | firestore.FieldPath][]
  ): Promise<MigrationResult>;

  /**
   * Sets all documents in this collection with the provided data.
   *
   * @remarks
   *
   * **Complexity:**
   *
   * - Time complexity: _TC_(`traverser`) where _C_(`batchSize`) = _W_(`batchSize`)
   * - Space complexity: _SC_(`traverser`) where _S_ = _O_(`batchSize`)
   * - Billing: _max_(1, _N_) reads, _K_ writes
   *
   * where:
   *
   * - _N_: number of docs in the traversable
   * - _K_: number of docs that passed the migration predicate (_K_<=_N_)
   * - _W_(`batchSize`): average batch write time
   * - _TC_(`traverser`): time complexity of the underlying traverser
   * - _SC_(`traverser`): space complexity of the underlying traverser
   *
   * @param data - A data object with which to set each document.
   * @param options - An object to configure the set behavior.
   * @returns A Promise resolving to an object representing the details of the migration.
   */
  set(data: firestore.PartialWithFieldValue<D>, options: SetOptions): Promise<MigrationResult>;

  /**
   * Sets all documents in this collection with the provided data.
   *
   * @remarks
   *
   * **Complexity:**
   *
   * - Time complexity: _TC_(`traverser`) where _C_(`batchSize`) = _W_(`batchSize`)
   * - Space complexity: _SC_(`traverser`) where _S_ = _O_(`batchSize`)
   * - Billing: _max_(1, _N_) reads, _K_ writes
   *
   * where:
   *
   * - _N_: number of docs in the traversable
   * - _K_: number of docs that passed the migration predicate (_K_<=_N_)
   * - _W_(`batchSize`): average batch write time
   * - _TC_(`traverser`): time complexity of the underlying traverser
   * - _SC_(`traverser`): space complexity of the underlying traverser
   *
   * @param data - A data object with which to set each document.
   * @returns A Promise resolving to an object representing the details of the migration.
   */
  set(data: firestore.WithFieldValue<D>): Promise<MigrationResult>;

  /**
   * Sets all documents in this collection with the provided data.
   *
   * @remarks
   *
   * **Complexity:**
   *
   * - Time complexity: _TC_(`traverser`) where _C_(`batchSize`) = _W_(`batchSize`)
   * - Space complexity: _SC_(`traverser`) where _S_ = _O_(`batchSize`)
   * - Billing: _max_(1, _N_) reads, _K_ writes
   *
   * where:
   *
   * - _N_: number of docs in the traversable
   * - _K_: number of docs that passed the migration predicate (_K_<=_N_)
   * - _W_(`batchSize`): average batch write time
   * - _TC_(`traverser`): time complexity of the underlying traverser
   * - _SC_(`traverser`): space complexity of the underlying traverser
   *
   * @param getData - A function that takes a document snapshot and returns a data object with
   * which to set each document.
   * @param options - An object to configure the set behavior.
   * @returns A Promise resolving to an object representing the details of the migration.
   */
  setWithDerivedData(
    getData: SetPartialDataGetter<D>,
    options: SetOptions
  ): Promise<MigrationResult>;

  /**
   * Sets all documents in this collection with the provided data.
   *
   * @remarks
   *
   * **Complexity:**
   *
   * - Time complexity: _TC_(`traverser`) where _C_(`batchSize`) = _W_(`batchSize`)
   * - Space complexity: _SC_(`traverser`) where _S_ = _O_(`batchSize`)
   * - Billing: _max_(1, _N_) reads, _K_ writes
   *
   * where:
   *
   * - _N_: number of docs in the traversable
   * - _K_: number of docs that passed the migration predicate (_K_<=_N_)
   * - _W_(`batchSize`): average batch write time
   * - _TC_(`traverser`): time complexity of the underlying traverser
   * - _SC_(`traverser`): space complexity of the underlying traverser
   *
   * @param getData - A function that takes a document snapshot and returns a data object with
   * which to set each document.
   * @returns A Promise resolving to an object representing the details of the migration.
   */
  setWithDerivedData(getData: SetDataGetter<D>): Promise<MigrationResult>;

  /**
   * Updates all documents in this collection with the provided data.
   *
   * @remarks
   *
   * **Complexity:**
   *
   * - Time complexity: _TC_(`traverser`) where _C_(`batchSize`) = _W_(`batchSize`)
   * - Space complexity: _SC_(`traverser`) where _S_ = _O_(`batchSize`)
   * - Billing: _max_(1, _N_) reads, _K_ writes
   *
   * where:
   *
   * - _N_: number of docs in the traversable
   * - _K_: number of docs that passed the migration predicate (_K_<=_N_)
   * - _W_(`batchSize`): average batch write time
   * - _TC_(`traverser`): time complexity of the underlying traverser
   * - _SC_(`traverser`): space complexity of the underlying traverser
   *
   * @param data - A non-empty data object with which to update each document.
   * @param precondition - A Precondition to enforce on this update.
   * @returns A Promise resolving to an object representing the details of the migration.
   */
  update(
    data: firestore.UpdateData<D>,
    precondition?: firestore.Precondition
  ): Promise<MigrationResult>;

  /**
   * Updates all documents in this collection with the provided field-value pair.
   *
   * @remarks
   *
   * **Complexity:**
   *
   * - Time complexity: _TC_(`traverser`) where _C_(`batchSize`) = _W_(`batchSize`)
   * - Space complexity: _SC_(`traverser`) where _S_ = _O_(`batchSize`)
   * - Billing: _max_(1, _N_) reads, _K_ writes
   *
   * where:
   *
   * - _N_: number of docs in the traversable
   * - _K_: number of docs that passed the migration predicate (_K_<=_N_)
   * - _W_(`batchSize`): average batch write time
   * - _TC_(`traverser`): time complexity of the underlying traverser
   * - _SC_(`traverser`): space complexity of the underlying traverser
   *
   * @param field - The first field to update in each document.
   * @param value - The first value corresponding to the first field. Must not be `undefined`.
   * @param moreFieldsOrPrecondition - An alternating list of field paths and values to update,
   * optionally followed by a Precondition to enforce on this update.
   *
   * @returns A Promise resolving to an object representing the details of the migration.
   */
  update(
    field: string | firestore.FieldPath,
    value: any,
    ...moreFieldsOrPrecondition: any[]
  ): Promise<MigrationResult>;

  /**
   * Updates all documents in this collection with the provided data.
   *
   * @remarks
   *
   * **Complexity:**
   *
   * - Time complexity: _TC_(`traverser`) where _C_(`batchSize`) = _W_(`batchSize`)
   * - Space complexity: _SC_(`traverser`) where _S_ = _O_(`batchSize`)
   * - Billing: _max_(1, _N_) reads, _K_ writes
   *
   * where:
   *
   * - _N_: number of docs in the traversable
   * - _K_: number of docs that passed the migration predicate (_K_<=_N_)
   * - _W_(`batchSize`): average batch write time
   * - _TC_(`traverser`): time complexity of the underlying traverser
   * - _SC_(`traverser`): space complexity of the underlying traverser
   *
   * @param getData - A function that takes a document snapshot and returns a non-empty data object with
   * which to update each document.
   * @returns A Promise resolving to an object representing the details of the migration.
   */
  updateWithDerivedData(
    getData: UpdateDataGetter<D>,
    precondition?: firestore.Precondition
  ): Promise<MigrationResult>;

  /**
   * Updates all documents in this collection with the provided data.
   *
   * @remarks
   *
   * **Complexity:**
   *
   * - Time complexity: _TC_(`traverser`) where _C_(`batchSize`) = _W_(`batchSize`)
   * - Space complexity: _SC_(`traverser`) where _S_ = _O_(`batchSize`)
   * - Billing: _max_(1, _N_) reads, _K_ writes
   *
   * where:
   *
   * - _N_: number of docs in the traversable
   * - _K_: number of docs that passed the migration predicate (_K_<=_N_)
   * - _W_(`batchSize`): average batch write time
   * - _TC_(`traverser`): time complexity of the underlying traverser
   * - _SC_(`traverser`): space complexity of the underlying traverser
   *
   * @param getData - A function that takes a document snapshot and returns an alternating list of field
   * paths and values to update, optionally followed by a Precondition to enforce on this update.
   * @returns A Promise resolving to an object representing the details of the migration.
   */
  updateWithDerivedData(getData: UpdateFieldValueGetter<D>): Promise<MigrationResult>;
}
