import { firestore } from 'firebase-admin';
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

  public set(data: D): Promise<MigrationResult>;

  public set(data: Partial<D>, options: SetOptions): Promise<MigrationResult>;

  public async set(data: D | Partial<D>, options?: SetOptions): Promise<MigrationResult> {
    let migratedDocCount = 0;

    const traversalResult = await this.traverser.traverse(async (snapshots, batchIndex) => {
      this.registeredCallbacks.onBeforeBatchStart?.(snapshots, batchIndex);

      let migratableDocCount = 0;

      const promises = snapshots.map(async (snapshot) => {
        const shouldMigrate = this.migrationPredicate(snapshot);

        if (!shouldMigrate) {
          return;
        }

        migratableDocCount++;

        if (options === undefined) {
          // Signature 1
          await snapshot.ref.set(data as D);
        } else {
          // Signature 2
          await snapshot.ref.set(data as Partial<D>, options);
        }
      });

      await Promise.all(promises);

      migratedDocCount += migratableDocCount;

      this.registeredCallbacks.onAfterBatchComplete?.(snapshots, batchIndex);
    });

    return { traversalResult, migratedDocCount };
  }

  public setWithDerivedData(getData: SetDataGetter<D>): Promise<MigrationResult>;

  public setWithDerivedData(
    getData: SetDataGetter<Partial<D>>,
    options: SetOptions
  ): Promise<MigrationResult>;

  public async setWithDerivedData(
    getData: SetDataGetter<D> | SetDataGetter<Partial<D>>,
    options?: SetOptions
  ): Promise<MigrationResult> {
    let migratedDocCount = 0;

    const traversalResult = await this.traverser.traverse(async (snapshots, batchIndex) => {
      this.registeredCallbacks.onBeforeBatchStart?.(snapshots, batchIndex);

      let migratableDocCount = 0;

      const promises = snapshots.map((snapshot) => {
        const shouldMigrate = this.migrationPredicate(snapshot);

        if (!shouldMigrate) {
          return;
        }

        migratableDocCount++;

        if (options === undefined) {
          // Signature 1
          const data = (getData as SetDataGetter<D>)(snapshot);
          snapshot.ref.set(data);
        } else {
          // Signature 2
          const data = (getData as SetDataGetter<Partial<D>>)(snapshot);
          snapshot.ref.set(data, options);
        }
      });

      await Promise.all(promises);

      migratedDocCount += migratableDocCount;

      this.registeredCallbacks.onAfterBatchComplete?.(snapshots, batchIndex);
    });

    return { traversalResult, migratedDocCount };
  }

  public update(
    data: firestore.UpdateData,
    precondition?: firestore.Precondition
  ): Promise<MigrationResult>;

  public update(
    field: string | firestore.FieldPath,
    value: any,
    ...moreFieldsOrPrecondition: any[]
  ): Promise<MigrationResult>;

  public async update(
    dataOrField: firestore.UpdateData | string | firestore.FieldPath,
    preconditionOrValue?: any,
    ...moreFieldsOrPrecondition: any[]
  ): Promise<MigrationResult> {
    let migratedDocCount = 0;

    const traversalResult = await this.traverser.traverse(async (snapshots, batchIndex) => {
      this.registeredCallbacks.onBeforeBatchStart?.(snapshots, batchIndex);

      let migratableDocCount = 0;

      const promises = snapshots.map(async (snapshot) => {
        const shouldMigrate = this.migrationPredicate(snapshot);

        if (shouldMigrate) {
          migratableDocCount++;

          if (typeof dataOrField === 'string' || dataOrField instanceof firestore.FieldPath) {
            // Signature 2
            const field = dataOrField;
            const value = preconditionOrValue;
            await snapshot.ref.update(field, value, ...moreFieldsOrPrecondition);
          } else {
            // Signature 1
            const data = dataOrField;
            const precondition = preconditionOrValue as firestore.Precondition | undefined;
            if (precondition === undefined) {
              await snapshot.ref.update(data);
            } else {
              await snapshot.ref.update(data, precondition);
            }
          }
        }
      });

      await Promise.all(promises);

      migratedDocCount += migratableDocCount;

      this.registeredCallbacks.onAfterBatchComplete?.(snapshots, batchIndex);
    });

    return { traversalResult, migratedDocCount };
  }

  public async updateWithDerivedData(
    getData: UpdateDataGetter<D>,
    precondition?: firestore.Precondition
  ): Promise<MigrationResult> {
    let migratedDocCount = 0;

    const traversalResult = await this.traverser.traverse(async (snapshots, batchIndex) => {
      this.registeredCallbacks.onBeforeBatchStart?.(snapshots, batchIndex);

      let migratableDocCount = 0;

      const promises = snapshots.map(async (snapshot) => {
        const shouldMigrate = this.migrationPredicate(snapshot);
        if (shouldMigrate) {
          migratableDocCount++;
          const data = getData(snapshot);
          if (precondition === undefined) {
            await snapshot.ref.update(data);
          } else {
            await snapshot.ref.update(data, precondition);
          }
        }
      });

      await Promise.all(promises);

      migratedDocCount += migratableDocCount;

      this.registeredCallbacks.onAfterBatchComplete?.(snapshots, batchIndex);
    });

    return { traversalResult, migratedDocCount };
  }
}
