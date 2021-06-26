import type { firestore } from 'firebase-admin';
import type { Traverser } from './Traverser';
import type {
  BaseTraversalConfig,
  BatchCallback,
  SetOptions,
  SetDataGetter,
  SetPartialDataGetter,
  UpdateDataGetter,
  MigrationPredicate,
  MigrationResult,
} from './types';

/**
 * Represents the general interface of a migrator.
 */
export abstract class Migrator<D extends firestore.DocumentData, C extends BaseTraversalConfig> {
  protected registeredCallbacks: {
    onBeforeBatchStart?: BatchCallback<D>;
    onAfterBatchComplete?: BatchCallback<D>;
  } = {};

  /**
   * Registers a callback function that fires right before a batch starts processing.
   * @param callback A synchronous callback that takes batch doc snapshots and the 0-based batch index as its arguments.
   */
  public onBeforeBatchStart(callback: BatchCallback<D>): void {
    this.registeredCallbacks.onBeforeBatchStart = callback;
  }

  /**
   * Registers a callback function that fires after a batch is processed.
   * @param callback A synchronous callback that takes batch doc snapshots and the 0-based batch index as its arguments.
   */
  public onAfterBatchComplete(callback: BatchCallback<D>): void {
    this.registeredCallbacks.onAfterBatchComplete = callback;
  }

  /**
   * The underlying traverser.
   */
  public abstract readonly traverser: Traverser<D, C>;

  public abstract withPredicate(predicate: MigrationPredicate<D>): Migrator<D, C>;

  public abstract withTraverser<C2 extends BaseTraversalConfig>(
    traverser: Traverser<D, C2>
  ): Migrator<D, C2>;

  public abstract set(getData: SetDataGetter<D>): Promise<MigrationResult>;

  public abstract set(
    getData: SetPartialDataGetter<D>,
    options: SetOptions
  ): Promise<MigrationResult>;

  /**
   * Sets all documents in this collection with the provided data.
   *
   * **Properties:**
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
   * @param data - The data with which to set each document.
   * @param options - An object to configure the set behavior.
   * @returns A Promise resolving to an object representing the details of the migration.
   */
  public abstract set(data: Partial<D>, options: SetOptions): Promise<MigrationResult>;

  /**
   * Sets all documents in this collection with the provided data.
   *
   * **Properties:**
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
   * @param data - The data with which to set each document.
   * @returns A Promise resolving to an object representing the details of the migration.
   */
  public abstract set(data: D): Promise<MigrationResult>;

  /**
   * Sets all documents in this collection with the provided data.
   *
   * **Properties:**
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
   * @param getData - A function that returns the data with which to set each document.
   * @param options - An object to configure the set behavior.
   * @returns A Promise resolving to an object representing the details of the migration.
   */
  public abstract set(
    getData: SetPartialDataGetter<D>,
    options: SetOptions
  ): Promise<MigrationResult>;

  /**
   * Sets all documents in this collection with the provided data.
   *
   * **Properties:**
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
   * @param getData - A function that returns the data with which to set each document.
   * @returns A Promise resolving to an object representing the details of the migration.
   */
  public abstract set(getData: SetDataGetter<D>): Promise<MigrationResult>;

  /**
   * Updates all documents in this collection with the provided data.
   *
   * **Properties:**
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
   * @param getData - A function that returns the data with which to update each document.
   * @returns A Promise resolving to an object representing the details of the migration.
   */
  public abstract update(getData: UpdateDataGetter<D>): Promise<MigrationResult>;

  /**
   * Updates all documents in this collection with the provided data.
   *
   * **Properties:**
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
   * @param data - The data with which to update each document. Must be a non-empty object.
   * @returns A Promise resolving to an object representing the details of the migration.
   */
  public abstract update(data: firestore.UpdateData): Promise<MigrationResult>;

  /**
   * Updates all documents in this collection with the provided field-value pair.
   *
   * **Properties:**
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
  public abstract update(field: string | firestore.FieldPath, value: any): Promise<MigrationResult>;
}
