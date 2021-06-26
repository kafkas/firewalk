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

export class BatchMigrator<
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
   * @returns A new BatchMigrator object.
   */
  public withPredicate(predicate: MigrationPredicate<D>): BatchMigrator<D, C, T> {
    return new BatchMigrator(this.traverser, predicate);
  }

  /**
   * Applies a new traverser that will be used by the migrator.
   *
   * @param traverser The new traverser that the migrator will use.
   * @returns A new BatchMigrator object.
   */
  public withTraverser<C2 extends BaseTraversalConfig>(
    traverser: Traverser<D, C2>
  ): BatchMigrator<D, C2, Traverser<D, C2>> {
    return new BatchMigrator(traverser);
  }

  public set(data: Partial<D>, options: SetOptions): Promise<MigrationResult>;

  public set(data: D): Promise<MigrationResult>;

  public set(getData: SetPartialDataGetter<D>, options: SetOptions): Promise<MigrationResult>;

  public set(getData: SetDataGetter<D>): Promise<MigrationResult>;

  public async set(
    dataOrGetData: SetDataGetter<D> | SetPartialDataGetter<D> | D | Partial<D>,
    options?: SetOptions
  ): Promise<MigrationResult> {
    let migratedDocCount = 0;

    const { batchCount, docCount: traversedDocCount } = await this.traverser.traverse(
      async (snapshots, batchIndex) => {
        this.registeredCallbacks.onBeforeBatchStart?.(snapshots, batchIndex);

        const writeBatch = this.traverser.traversable.firestore.batch();
        let migratableDocCount = 0;

        snapshots.forEach((snapshot) => {
          const shouldMigrate = this.migrationPredicate(snapshot);

          if (!shouldMigrate) {
            return;
          }

          migratableDocCount++;

          if (typeof dataOrGetData !== 'function') {
            if (options !== undefined) {
              // Signature 1
              const data = dataOrGetData as Partial<D>;
              writeBatch.set(snapshot.ref, data, options);
            } else {
              // Signature 2
              const data = dataOrGetData as D;
              writeBatch.set(snapshot.ref, data);
            }
          } else {
            if (options !== undefined) {
              // Signature 3
              const getData = dataOrGetData as SetPartialDataGetter<D>;
              const data = getData(snapshot);
              writeBatch.set(snapshot.ref, data, options);
            } else {
              // Signature 4
              const getData = dataOrGetData as SetDataGetter<D>;
              const data = getData(snapshot);
              writeBatch.set(snapshot.ref, data);
            }
          }
        });

        await writeBatch.commit();
        migratedDocCount += migratableDocCount;

        this.registeredCallbacks.onAfterBatchComplete?.(snapshots, batchIndex);
      }
    );

    return { batchCount, traversedDocCount, migratedDocCount };
  }

  public update(getData: UpdateDataGetter<D>): Promise<MigrationResult>;

  public update(data: firestore.UpdateData): Promise<MigrationResult>;

  public update(field: string | firestore.FieldPath, value: any): Promise<MigrationResult>;

  public async update(
    arg1: firestore.UpdateData | string | firestore.FieldPath | UpdateDataGetter<D>,
    arg2?: any
  ): Promise<MigrationResult> {
    const argCount = [arg1, arg2].filter((a) => a !== undefined).length;
    let migratedDocCount = 0;

    const { batchCount, docCount: traversedDocCount } = await this.traverser.traverse(
      async (snapshots, batchIndex) => {
        this.registeredCallbacks.onBeforeBatchStart?.(snapshots, batchIndex);

        const writeBatch = this.traverser.traversable.firestore.batch();
        let migratableDocCount = 0;

        snapshots.forEach((snapshot) => {
          if (typeof arg1 === 'function') {
            // Signature 1
            const getUpdateData = arg1 as UpdateDataGetter<D>;
            const shouldMigrate = this.migrationPredicate(snapshot);
            if (shouldMigrate) {
              writeBatch.update(snapshot.ref, getUpdateData(snapshot));
              migratableDocCount++;
            }
          } else if (argCount === 1) {
            // Signature 2
            const updateData = arg1 as firestore.UpdateData;
            const shouldMigrate = this.migrationPredicate(snapshot);
            if (shouldMigrate) {
              writeBatch.update(snapshot.ref, updateData);
              migratableDocCount++;
            }
          } else {
            // Signature 3
            const field = arg1 as string | firestore.FieldPath;
            const value = arg2 as any;
            const shouldMigrate = this.migrationPredicate(snapshot);
            if (shouldMigrate) {
              writeBatch.update(snapshot.ref, field, value);
              migratableDocCount++;
            }
          }
        });

        await writeBatch.commit();
        migratedDocCount += migratableDocCount;

        this.registeredCallbacks.onAfterBatchComplete?.(snapshots, batchIndex);
      }
    );

    return { batchCount, traversedDocCount, migratedDocCount };
  }
}
