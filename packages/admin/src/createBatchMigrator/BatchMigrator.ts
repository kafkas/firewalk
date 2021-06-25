import type { firestore } from 'firebase-admin';
import type { Traverser } from '../Traverser';
import {
  Migrator,
  MigrationPredicate,
  UpdateDataGetter,
  SetData,
  SetOptions,
  SetDataGetter,
} from '../Migrator';
import type { BaseTraversalConfig, MigrationResult } from '../types';
import { validateConfig } from './validateConfig';

export class BatchMigrator<
  D extends firestore.DocumentData,
  C extends BaseTraversalConfig,
  T extends Traverser<D, C>
> extends Migrator<D, C> {
  public constructor(public readonly traverser: T) {
    super();
    validateConfig(traverser.traversalConfig);
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
   * @param getData - A function that returns an object with which to set each document.
   * @param options - Optional. An object to configure the set behavior.
   * @param predicate - Optional. A function that returns a boolean indicating whether to migrate the current document. If this is not provided, all documents will be migrated.
   * @returns A Promise resolving to an object representing the details of the migration.
   */
  public set<M extends boolean | undefined>(
    getData: SetDataGetter<D, M>,
    options?: SetOptions<M>,
    predicate?: MigrationPredicate<D>
  ): Promise<MigrationResult>;

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
   * @param options - Optional. An object to configure the set behavior.
   * @param predicate - Optional. A function that returns a boolean indicating whether to migrate the current document. If this is not provided, all documents will be migrated.
   * @returns A Promise resolving to an object representing the details of the migration.
   */
  public set<M extends boolean | undefined>(
    data: SetData<D, M>,
    options?: SetOptions<M>,
    predicate?: MigrationPredicate<D>
  ): Promise<MigrationResult>;

  public async set<M extends boolean | undefined>(
    dataOrGetData: SetData<D, M> | SetDataGetter<D, M>,
    options?: SetOptions<M>,
    predicate?: MigrationPredicate<D>
  ): Promise<MigrationResult> {
    let migratedDocCount = 0;

    const { batchCount, docCount: traversedDocCount } = await this.traverser.traverse(
      async (snapshots, batchIndex) => {
        this.registeredCallbacks.onBeforeBatchStart?.(snapshots, batchIndex);

        const writeBatch = this.traverser.traversable.firestore.batch();
        let migratableDocCount = 0;

        snapshots.forEach((snapshot) => {
          const data = (() => {
            if (typeof dataOrGetData === 'function') {
              // Signature 1
              const getData = dataOrGetData as SetDataGetter<D, M>;
              return getData(snapshot);
            } else {
              // Signature 2
              return dataOrGetData as SetData<D, M>;
            }
          })();

          const shouldMigrate = predicate?.(snapshot) ?? true;

          if (shouldMigrate) {
            writeBatch.set(snapshot.ref, data, options as any);
            migratableDocCount++;
          }
        });

        await writeBatch.commit();
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
   * @param predicate - Optional. A function that returns a boolean indicating whether to migrate the current document. If this is not provided, all documents will be migrated.
   * @returns A Promise resolving to an object representing the details of the migration.
   */
  public update(
    getData: UpdateDataGetter<D>,
    predicate?: MigrationPredicate<D>
  ): Promise<MigrationResult>;

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
   * @param predicate - Optional. A function that returns a boolean indicating whether to migrate the current document. If this is not provided, all documents will be migrated.
   * @returns A Promise resolving to an object representing the details of the migration.
   */
  public update(
    data: firestore.UpdateData,
    predicate?: MigrationPredicate<D>
  ): Promise<MigrationResult>;

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
   * @param predicate - Optional. A function that returns a boolean indicating whether to migrate the current document. If this is not provided, all documents will be migrated.
   * @returns A Promise resolving to an object representing the details of the migration.
   */
  public update(
    field: string | firestore.FieldPath,
    value: any,
    predicate?: MigrationPredicate<D>
  ): Promise<MigrationResult>;

  public async update(
    arg1: firestore.UpdateData | string | firestore.FieldPath | UpdateDataGetter<D>,
    arg2?: any,
    arg3?: MigrationPredicate<D>
  ): Promise<MigrationResult> {
    const argCount = [arg1, arg2, arg3].filter((a) => a !== undefined).length;
    let migratedDocCount = 0;

    const { batchCount, docCount: traversedDocCount } = await this.traverser.traverse(
      async (snapshots) => {
        const writeBatch = this.traverser.traversable.firestore.batch();
        let migratableDocCount = 0;

        snapshots.forEach((snapshot) => {
          if (typeof arg1 === 'function') {
            // Signature 1
            const getUpdateData = arg1 as UpdateDataGetter<D>;
            const predicate = arg2 as MigrationPredicate<D> | undefined;
            const shouldMigrate = predicate?.(snapshot) ?? true;
            if (shouldMigrate) {
              writeBatch.update(snapshot.ref, getUpdateData(snapshot));
              migratableDocCount++;
            }
          } else if (argCount < 2 || typeof arg2 === 'function') {
            // Signature 2
            const updateData = arg1 as firestore.UpdateData;
            const predicate = arg2 as MigrationPredicate<D> | undefined;
            const shouldMigrate = predicate?.(snapshot) ?? true;
            if (shouldMigrate) {
              writeBatch.update(snapshot.ref, updateData);
              migratableDocCount++;
            }
          } else {
            // Signature 3
            const field = arg1 as string | firestore.FieldPath;
            const value = arg2 as any;
            const predicate = arg3 as MigrationPredicate<D> | undefined;
            const shouldMigrate = predicate?.(snapshot) ?? true;
            if (shouldMigrate) {
              writeBatch.update(snapshot.ref, field, value);
              migratableDocCount++;
            }
          }
        });

        await writeBatch.commit();
        migratedDocCount += migratableDocCount;
      }
    );

    return { batchCount, traversedDocCount, migratedDocCount };
  }
}
