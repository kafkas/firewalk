import type { firestore } from 'firebase-admin';
import type {
  BaseTraversalConfig,
  DefaultMigrator,
  MigrationPredicate,
  MigrationResult,
  SetDataGetter,
  SetOptions,
  SetPartialDataGetter,
  Traverser,
  UpdateDataGetter,
} from '../api';
import { AbstractMigrator } from '../AbstractMigrator';

export class SpecificDefaultMigrator<
    D extends firestore.DocumentData,
    C extends BaseTraversalConfig
  >
  extends AbstractMigrator<D, C>
  implements DefaultMigrator<D, C> {
  public constructor(
    public readonly traverser: Traverser<D, C>,
    private migrationPredicate: MigrationPredicate<D> = () => true
  ) {
    super();
    this.validateConfig(traverser.traversalConfig);
  }

  // eslint-disable-next-line
  private validateConfig(config: Partial<C> = {}): void {
    // Confirm that the traverser config is compatible with this migrator
  }

  public withPredicate(predicate: MigrationPredicate<D>): DefaultMigrator<D, C> {
    return new SpecificDefaultMigrator(this.traverser, predicate);
  }

  public withTraverser<C2 extends BaseTraversalConfig>(
    traverser: Traverser<D, C2>
  ): DefaultMigrator<D, C2> {
    return new SpecificDefaultMigrator(traverser, this.migrationPredicate);
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

        this.registeredCallbacks.onAfterBatchComplete?.(snapshots, batchIndex);
      }
    );

    return { batchCount, traversedDocCount, migratedDocCount };
  }
}
