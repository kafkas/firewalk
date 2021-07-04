import type { firestore } from 'firebase-admin';
import type { Traverser } from './Traverser';
import type {
  BatchCallback,
  MigrationPredicate,
  MigrationResult,
  SetDataGetter,
  SetOptions,
  TraversalConfig,
  UpdateDataGetter,
} from '.';

/**
 * Represents the general interface of a migrator.
 */
export interface Migrator<D extends firestore.DocumentData, C extends TraversalConfig> {
  /**
   * The underlying traverser.
   */
  readonly traverser: Traverser<D, C>;

  /**
   * Applies a migration predicate that indicates whether to migrate the current document. If this is not provided,
   * all documents will be migrated.
   *
   * @param predicate - A function that takes a document snapshot and returns a boolean indicating whether to migrate it.
   * @returns A new {@link Migrator} object.
   */
  withPredicate(predicate: MigrationPredicate<D>): Migrator<D, C>;

  /**
   * Applies a new traverser that will be used by the migrator.
   *
   * @param traverser - The new traverser that the migrator will use.
   * @returns A new {@link Migrator} object.
   */
  withTraverser<C2 extends TraversalConfig>(traverser: Traverser<D, C2>): Migrator<D, C2>;

  /**
   * Registers a callback function that fires right before a batch starts processing.
   * @param callback - A synchronous callback that takes batch doc snapshots and the 0-based batch index as its arguments.
   */
  onBeforeBatchStart(callback: BatchCallback<D>): void;

  /**
   * Registers a callback function that fires after a batch is processed.
   * @param callback - A synchronous callback that takes batch doc snapshots and the 0-based batch index as its arguments.
   */
  onAfterBatchComplete(callback: BatchCallback<D>): void;

  /**
   * Sets all documents in this collection with the provided data.
   *
   * @remarks
   *
   * **Complexity:**
   *
   * - Time complexity: _TC_(`traverser`) where _C_ = _W_(`batchSize`)
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
  set(data: D): Promise<MigrationResult>;

  /**
   * Sets all documents in this collection with the provided data.
   *
   * @remarks
   *
   * **Complexity:**
   *
   * - Time complexity: _TC_(`traverser`) where _C_ = _W_(`batchSize`)
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
  set(data: Partial<D>, options: SetOptions): Promise<MigrationResult>;

  /**
   * Sets all documents in this collection with the provided data.
   *
   * @remarks
   *
   * **Complexity:**
   *
   * - Time complexity: _TC_(`traverser`) where _C_ = _W_(`batchSize`)
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
   * Sets all documents in this collection with the provided data.
   *
   * @remarks
   *
   * **Complexity:**
   *
   * - Time complexity: _TC_(`traverser`) where _C_ = _W_(`batchSize`)
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
    getData: SetDataGetter<Partial<D>>,
    options: SetOptions
  ): Promise<MigrationResult>;

  /**
   * Updates all documents in this collection with the provided data.
   *
   * @remarks
   *
   * **Complexity:**
   *
   * - Time complexity: _TC_(`traverser`) where _C_ = _W_(`batchSize`)
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
    data: firestore.UpdateData,
    precondition?: firestore.Precondition
  ): Promise<MigrationResult>;

  /**
   * Updates all documents in this collection with the provided field-value pair.
   *
   * @remarks
   *
   * **Complexity:**
   *
   * - Time complexity: _TC_(`traverser`) where _C_ = _W_(`batchSize`)
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
   * @param field - The field to update in each document.
   * @param value - The value with which to update the specified field in each document. Must not be `undefined`.
   * @param moreFieldsOrPrecondition - An alternating list of field paths and values to update, optionally followed by a Precondition to enforce on this update.
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
   * - Time complexity: _TC_(`traverser`) where _C_ = _W_(`batchSize`)
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
}
