import type { firestore } from 'firebase-admin';
import type { Traverser } from './Traverser';
import type {
  BatchCallback,
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
   * Registers a callback function that fires right before a batch starts processing.
   * @param callback A synchronous callback that takes batch doc snapshots and the 0-based batch index as its arguments.
   */
  onBeforeBatchStart(callback: BatchCallback<D>): void;

  /**
   * Registers a callback function that fires after a batch is processed.
   * @param callback A synchronous callback that takes batch doc snapshots and the 0-based batch index as its arguments.
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
   * @param dataOrGetData - Either a data object with which to set each document or a function that takes
   * a document snapshot and returns the data object.
   * @returns A Promise resolving to an object representing the details of the migration.
   */
  set(dataOrGetData: D | SetDataGetter<D>): Promise<MigrationResult>;

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
   * @param dataOrGetData - Either a data object with which to set each document or a function that takes a
   * document snapshot and returns the data object.
   * @param options - An object to configure the set behavior.
   * @returns A Promise resolving to an object representing the details of the migration.
   */
  set(
    dataOrGetData: Partial<D> | SetDataGetter<Partial<D>>,
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
   * @param dataOrGetData - Either a data object with which to update each document or a function that takes
   * a document snapshot and returns the data object. The data object must be non-empty.
   * @returns A Promise resolving to an object representing the details of the migration.
   */
  update(dataOrGetData: firestore.UpdateData | UpdateDataGetter<D>): Promise<MigrationResult>;

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
   * @returns A Promise resolving to an object representing the details of the migration.
   */
  update(field: string | firestore.FieldPath, value: any): Promise<MigrationResult>;
}
