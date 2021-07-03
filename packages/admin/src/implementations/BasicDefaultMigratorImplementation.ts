import type { firestore } from 'firebase-admin';
import type {
  DefaultMigrator,
  MigrationPredicate,
  MigrationResult,
  SetDataGetter,
  SetOptions,
  TraversalConfig,
  Traverser,
  UpdateDataGetter,
} from '../api';
import { AbstractMigrator } from './abstract';

export class BasicDefaultMigratorImplementation<
    D extends firestore.DocumentData,
    C extends TraversalConfig
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
    return new BasicDefaultMigratorImplementation(this.traverser, predicate);
  }

  public withTraverser<C2 extends TraversalConfig>(
    traverser: Traverser<D, C2>
  ): DefaultMigrator<D, C2> {
    return new BasicDefaultMigratorImplementation(traverser, this.migrationPredicate);
  }

  public set(dataOrGetData: D | SetDataGetter<D>): Promise<MigrationResult>;

  public set(
    dataOrGetData: Partial<D> | SetDataGetter<Partial<D>>,
    options: SetOptions
  ): Promise<MigrationResult>;

  public async set(
    dataOrGetData: D | SetDataGetter<D> | Partial<D> | SetDataGetter<Partial<D>>,
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
              const getData = dataOrGetData as SetDataGetter<Partial<D>>;
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

  public update(data: firestore.UpdateData): Promise<MigrationResult>;

  public update(field: string | firestore.FieldPath, value: any): Promise<MigrationResult>;

  public async update(
    dataOrField: firestore.UpdateData | string | firestore.FieldPath,
    value?: any
  ): Promise<MigrationResult> {
    const argCount = [dataOrField, value].filter((a) => a !== undefined).length;
    let migratedDocCount = 0;

    const { batchCount, docCount: traversedDocCount } = await this.traverser.traverse(
      async (snapshots, batchIndex) => {
        this.registeredCallbacks.onBeforeBatchStart?.(snapshots, batchIndex);

        let migratableDocCount = 0;

        const promises = snapshots.map(async (snapshot) => {
          if (argCount === 1) {
            // Signature 1
            const data = dataOrField as firestore.UpdateData;
            const shouldMigrate = this.migrationPredicate(snapshot);
            if (shouldMigrate) {
              migratableDocCount++;
              await snapshot.ref.update(data);
            }
          } else {
            // Signature 2
            const field = dataOrField as string | firestore.FieldPath;
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

  public async updateWithDerivedData(getData: UpdateDataGetter<D>): Promise<MigrationResult> {
    let migratedDocCount = 0;

    const { batchCount, docCount: traversedDocCount } = await this.traverser.traverse(
      async (snapshots, batchIndex) => {
        this.registeredCallbacks.onBeforeBatchStart?.(snapshots, batchIndex);

        let migratableDocCount = 0;

        const promises = snapshots.map(async (snapshot) => {
          const shouldMigrate = this.migrationPredicate(snapshot);
          if (shouldMigrate) {
            migratableDocCount++;
            await snapshot.ref.update(getData(snapshot));
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
