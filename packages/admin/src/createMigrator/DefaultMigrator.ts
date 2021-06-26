import type { firestore } from 'firebase-admin';
import type { Traverser } from '../Traverser';
import { Migrator } from '../Migrator';
import type {
  BaseTraversalConfig,
  MigrationPredicate,
  UpdateDataGetter,
  SetDataGetter,
  SetPartialDataGetter,
  SetOptions,
  MigrationResult,
} from '../types';
import { validateConfig } from './validateConfig';

export class DefaultMigrator<
  D extends firestore.DocumentData,
  C extends BaseTraversalConfig,
  T extends Traverser<D, C>
> extends Migrator<D, C> {
  public constructor(
    public readonly traverser: T,
    private migrationPredicate: MigrationPredicate<D> = () => true
  ) {
    super();
    validateConfig(traverser.traversalConfig);
  }

  /**
   * Applies a migration predicate that returns a boolean indicating whether to migrate the current document.
   * If this is not provided, all documents will be migrated.
   *
   * @param predicate A function that takes a document snapshot and returns a boolean indicating whether to migrate it.
   * @returns A new DefaultMigrator object.
   */
  public withPredicate(predicate: MigrationPredicate<D>): DefaultMigrator<D, C, T> {
    return new DefaultMigrator(this.traverser, predicate);
  }

  /**
   * Sets all documents in this collection with the provided data.
   *
   * **Properties:**
   *
   * - Time complexity: _TC_(`traverser`) where _C_ = _W_(`batchSize`)
   * - Space complexity: _SC_(`traverser`) where _S_ = _O_(`batchSize`)
   * - Billing: _N_ reads, _K_ writes
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
  public set(data: Partial<D>, options: SetOptions): Promise<MigrationResult>;

  /**
   * Sets all documents in this collection with the provided data.
   *
   * **Properties:**
   *
   * - Time complexity: _TC_(`traverser`) where _C_ = _W_(`batchSize`)
   * - Space complexity: _SC_(`traverser`) where _S_ = _O_(`batchSize`)
   * - Billing: _N_ reads, _K_ writes
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
  public set(data: D): Promise<MigrationResult>;

  /**
   * Sets all documents in this collection with the provided data.
   *
   * **Properties:**
   *
   * - Time complexity: _TC_(`traverser`) where _C_ = _W_(`batchSize`)
   * - Space complexity: _SC_(`traverser`) where _S_ = _O_(`batchSize`)
   * - Billing: _N_ reads, _K_ writes
   *
   * where:
   *
   * - _N_: number of docs in the traversable
   * - _K_: number of docs that passed the migration predicate (_K_<=_N_)
   * - _W_(`batchSize`): average batch write time
   * - _TC_(`traverser`): time complexity of the underlying traverser
   * - _SC_(`traverser`): space complexity of the underlying traverser
   *
   * @param getData - A function that returns an object with which to set each document.
   * @param options - An object to configure the set behavior.
   * @returns A Promise resolving to an object representing the details of the migration.
   */
  public set(getData: SetPartialDataGetter<D>, options: SetOptions): Promise<MigrationResult>;

  /**
   * Sets all documents in this collection with the provided data.
   *
   * **Properties:**
   *
   * - Time complexity: _TC_(`traverser`) where _C_ = _W_(`batchSize`)
   * - Space complexity: _SC_(`traverser`) where _S_ = _O_(`batchSize`)
   * - Billing: _N_ reads, _K_ writes
   *
   * where:
   *
   * - _N_: number of docs in the traversable
   * - _K_: number of docs that passed the migration predicate (_K_<=_N_)
   * - _W_(`batchSize`): average batch write time
   * - _TC_(`traverser`): time complexity of the underlying traverser
   * - _SC_(`traverser`): space complexity of the underlying traverser
   *
   * @param getData - A function that returns an object with which to set each document.
   * @returns A Promise resolving to an object representing the details of the migration.
   */
  public set(getData: SetDataGetter<D>): Promise<MigrationResult>;

  public async set(
    dataOrGetData: SetDataGetter<D> | SetPartialDataGetter<D> | D | Partial<D>,
    options?: SetOptions
  ): Promise<MigrationResult> {
    let migratedDocCount = 0;

    const { batchCount, docCount: traversedDocCount } = await this.traverser.traverse(
      async (snapshots, batchIndex) => {
        this.registeredCallbacks.onBeforeBatchStart?.(snapshots, batchIndex);

        let migratableDocCount = 0;

        const promises = snapshots.map(async (snapshot) => {
          const shouldMigrate = this.migrationPredicate(snapshot);

          if (!shouldMigrate) {
            return;
          }

          migratableDocCount++;

          if (typeof dataOrGetData !== 'function') {
            if (options !== undefined) {
              // Signature 1
              const data = dataOrGetData as Partial<D>;
              await snapshot.ref.set(data, options);
            } else {
              // Signature 2
              const data = dataOrGetData as D;
              await snapshot.ref.set(data);
            }
          } else {
            if (options !== undefined) {
              // Signature 3
              const getData = dataOrGetData as SetPartialDataGetter<D>;
              const data = getData(snapshot);
              await snapshot.ref.set(data, options);
            } else {
              // Signature 4
              const getData = dataOrGetData as SetDataGetter<D>;
              const data = getData(snapshot);
              await snapshot.ref.set(data);
            }
          }
        });

        await Promise.all(promises);

        migratedDocCount += migratableDocCount;

        this.registeredCallbacks.onAfterBatchComplete?.(snapshots, batchIndex);
      }
    );

    return { batchCount, traversedDocCount, migratedDocCount };
  }

  /**
   * Updates all documents in this collection with the provided data.
   *
   * **Properties:**
   *
   * - Time complexity: _TC_(`traverser`) where _C_ = _W_(`batchSize`)
   * - Space complexity: _SC_(`traverser`) where _S_ = _O_(`batchSize`)
   * - Billing: _N_ reads, _K_ writes
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
  public update(getData: UpdateDataGetter<D>): Promise<MigrationResult>;

  /**
   * Updates all documents in this collection with the provided data.
   *
   * **Properties:**
   *
   * - Time complexity: _TC_(`traverser`) where _C_ = _W_(`batchSize`)
   * - Space complexity: _SC_(`traverser`) where _S_ = _O_(`batchSize`)
   * - Billing: _N_ reads, _K_ writes
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
  public update(data: firestore.UpdateData): Promise<MigrationResult>;

  /**
   * Updates all documents in this collection with the provided field-value pair.
   *
   * **Properties:**
   *
   * - Time complexity: _TC_(`traverser`) where _C_ = _W_(`batchSize`)
   * - Space complexity: _SC_(`traverser`) where _S_ = _O_(`batchSize`)
   * - Billing: _N_ reads, _K_ writes
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
  public update(field: string | firestore.FieldPath, value: any): Promise<MigrationResult>;

  public async update(
    arg1: firestore.UpdateData | string | firestore.FieldPath | UpdateDataGetter<D>,
    arg2?: any
  ): Promise<MigrationResult> {
    const argCount = [arg1, arg2].filter((a) => a !== undefined).length;
    let migratedDocCount = 0;

    const { batchCount, docCount: traversedDocCount } = await this.traverser.traverse(
      async (snapshots) => {
        let migratableDocCount = 0;

        const promises = snapshots.map(async (snapshot) => {
          if (typeof arg1 === 'function') {
            // Signature 1
            const getUpdateData = arg1 as UpdateDataGetter<D>;
            const shouldMigrate = this.migrationPredicate(snapshot);
            if (shouldMigrate) {
              migratableDocCount++;
              await snapshot.ref.update(getUpdateData(snapshot));
            }
          } else if (argCount === 1) {
            // Signature 2
            const updateData = arg1 as firestore.UpdateData;
            const shouldMigrate = this.migrationPredicate(snapshot);
            if (shouldMigrate) {
              migratableDocCount++;
              await snapshot.ref.update(updateData);
            }
          } else {
            // Signature 3
            const field = arg1 as string | firestore.FieldPath;
            const value = arg2 as any;
            const shouldMigrate = this.migrationPredicate(snapshot);
            if (shouldMigrate) {
              migratableDocCount++;
              await snapshot.ref.update(field, value);
            }
          }
        });

        await Promise.all(promises);

        migratedDocCount += migratableDocCount;
      }
    );

    return { batchCount, traversedDocCount, migratedDocCount };
  }
}
