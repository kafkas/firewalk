import type { firestore } from 'firebase-admin';
import { isPositiveInteger } from '../utils';
import type {
  BaseTraversalConfig,
  BatchMigrator,
  MigrationPredicate,
  MigrationResult,
  SetDataGetter,
  SetOptions,
  SetPartialDataGetter,
  Traverser,
  UpdateDataGetter,
} from '../api';
import { AbstractMigrator } from '../AbstractMigrator';

export class SpecificBatchMigrator<D extends firestore.DocumentData, C extends BaseTraversalConfig>
  extends AbstractMigrator<D, C>
  implements BatchMigrator<D, C> {
  private static readonly MAX_BATCH_WRITE_DOC_COUNT = 500;

  public constructor(
    public readonly traverser: Traverser<D, C>,
    private migrationPredicate: MigrationPredicate<D> = () => true
  ) {
    super();
    this.validateConfig(traverser.traversalConfig);
  }

  private validateConfig(config: Partial<BaseTraversalConfig> = {}): void {
    const { batchSize } = config;

    if (
      typeof batchSize === 'number' &&
      (!isPositiveInteger(batchSize) || batchSize > SpecificBatchMigrator.MAX_BATCH_WRITE_DOC_COUNT)
    ) {
      throw new Error(
        `The 'batchSize' field in traversal config for a batch migrator must be a positive integer less than or equal to ${SpecificBatchMigrator.MAX_BATCH_WRITE_DOC_COUNT}. In Firestore, each transaction or write batch can write to a maximum of ${SpecificBatchMigrator.MAX_BATCH_WRITE_DOC_COUNT} documents.`
      );
    }
  }

  public withPredicate(predicate: MigrationPredicate<D>): BatchMigrator<D, C> {
    return new SpecificBatchMigrator(this.traverser, predicate);
  }

  public withTraverser<C2 extends BaseTraversalConfig>(
    traverser: Traverser<D, C2>
  ): BatchMigrator<D, C2> {
    return new SpecificBatchMigrator(traverser, this.migrationPredicate);
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
