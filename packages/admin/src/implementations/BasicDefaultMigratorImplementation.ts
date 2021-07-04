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
  UpdateFieldValueGetter,
} from '../api';
import { AbstractMigrator } from './abstract';

export class BasicDefaultMigratorImplementation<C extends TraversalConfig, D>
  extends AbstractMigrator<C, D>
  implements DefaultMigrator<C, D> {
  public constructor(
    public readonly traverser: Traverser<C, D>,
    private migrationPredicate: MigrationPredicate<D> = () => true
  ) {
    super();
    this.validateConfig(traverser.traversalConfig);
  }

  // eslint-disable-next-line
  private validateConfig(config: Partial<C> = {}): void {
    // Confirm that the traverser config is compatible with this migrator
  }

  public withPredicate(predicate: MigrationPredicate<D>): DefaultMigrator<C, D> {
    return new BasicDefaultMigratorImplementation(this.traverser, predicate);
  }

  public withTraverser<C2 extends TraversalConfig>(
    traverser: Traverser<C2, D>
  ): DefaultMigrator<C2, D> {
    return new BasicDefaultMigratorImplementation(traverser, this.migrationPredicate);
  }

  public set(data: D): Promise<MigrationResult>;

  public set(data: Partial<D>, options: SetOptions): Promise<MigrationResult>;

  public async set(data: D | Partial<D>, options?: SetOptions): Promise<MigrationResult> {
    return this.migrate(async (snapshot) => {
      if (options === undefined) {
        // Signature 1
        await snapshot.ref.set(data as D);
      } else {
        // Signature 2
        await snapshot.ref.set(data as Partial<D>, options);
      }
    });
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
    return this.migrate(async (snapshot) => {
      if (options === undefined) {
        // Signature 1
        const data = (getData as SetDataGetter<D>)(snapshot);
        await snapshot.ref.set(data);
      } else {
        // Signature 2
        const data = (getData as SetDataGetter<Partial<D>>)(snapshot);
        await snapshot.ref.set(data, options);
      }
    });
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

  public update(
    dataOrField: firestore.UpdateData | string | firestore.FieldPath,
    preconditionOrValue?: any,
    ...moreFieldsOrPrecondition: any[]
  ): Promise<MigrationResult> {
    return this.migrate(async (snapshot) => {
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
    });
  }

  public updateWithDerivedData(
    getData: UpdateDataGetter<D>,
    precondition?: firestore.Precondition
  ): Promise<MigrationResult>;

  public updateWithDerivedData(getData: UpdateFieldValueGetter<D>): Promise<MigrationResult>;

  public updateWithDerivedData(
    getData: (
      snapshot: firestore.QueryDocumentSnapshot<D>
    ) => ReturnType<UpdateDataGetter<D>> | ReturnType<UpdateFieldValueGetter<D>>,
    precondition?: firestore.Precondition
  ): Promise<MigrationResult> {
    return this.migrate(async (snapshot) => {
      const data = getData(snapshot);

      if (Array.isArray(data)) {
        // Signature 2
        await snapshot.ref.update(...data);
      } else {
        // Signature 1
        if (precondition === undefined) {
          await snapshot.ref.update(data);
        } else {
          await snapshot.ref.update(data, precondition);
        }
      }
    });
  }

  private async migrate(
    migrateDoc: (snapshot: firestore.QueryDocumentSnapshot<D>) => Promise<void>
  ): Promise<MigrationResult> {
    return this.migrateWithTraverser(async (snapshots) => {
      let migratedDocCount = 0;
      const promises = snapshots.map(async (snapshot) => {
        const shouldMigrate = this.migrationPredicate(snapshot);
        if (shouldMigrate) {
          await migrateDoc(snapshot);
          migratedDocCount++;
        }
      });
      await Promise.all(promises);
      return migratedDocCount;
    });
  }
}
