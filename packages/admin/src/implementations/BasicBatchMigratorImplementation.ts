import { firestore } from 'firebase-admin';
import { isPositiveInteger } from '../utils';
import type {
  BatchMigrator,
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

export class BasicBatchMigratorImplementation<C extends TraversalConfig, D>
  extends AbstractMigrator<C, D>
  implements BatchMigrator<C, D> {
  private static readonly MAX_BATCH_WRITE_DOC_COUNT = 500;

  public constructor(
    public readonly traverser: Traverser<C, D>,
    private migrationPredicate: MigrationPredicate<D> = () => true
  ) {
    super();
    this.validateConfig(traverser.traversalConfig);
  }

  private validateConfig(config: Partial<TraversalConfig> = {}): void {
    const { batchSize } = config;
    if (
      typeof batchSize === 'number' &&
      (!isPositiveInteger(batchSize) ||
        batchSize > BasicBatchMigratorImplementation.MAX_BATCH_WRITE_DOC_COUNT)
    ) {
      throw new Error(
        `The 'batchSize' field in the traversal config of a BatchMigrator's traverser must be a positive integer less than or equal to ${BasicBatchMigratorImplementation.MAX_BATCH_WRITE_DOC_COUNT}. In Firestore, each write batch can write to a maximum of ${BasicBatchMigratorImplementation.MAX_BATCH_WRITE_DOC_COUNT} documents.`
      );
    }
  }

  public withPredicate(predicate: MigrationPredicate<D>): BatchMigrator<C, D> {
    return new BasicBatchMigratorImplementation(this.traverser, predicate);
  }

  public withTraverser<C2 extends TraversalConfig>(
    traverser: Traverser<C2, D>
  ): BatchMigrator<C2, D> {
    return new BasicBatchMigratorImplementation(traverser, this.migrationPredicate);
  }

  public set(data: D): Promise<MigrationResult>;

  public set(data: Partial<D>, options: SetOptions): Promise<MigrationResult>;

  public async set(data: D | Partial<D>, options?: SetOptions): Promise<MigrationResult> {
    return this.migrate((writeBatch, snapshot) => {
      if (options === undefined) {
        // Signature 1
        writeBatch.set(snapshot.ref, data as D);
      } else {
        // Signature 2
        writeBatch.set(snapshot.ref, data as Partial<D>, options);
      }
    });
  }

  public setWithDerivedData(getData: SetDataGetter<D>): Promise<MigrationResult>;

  public setWithDerivedData(
    getData: SetDataGetter<Partial<D>>,
    options: SetOptions
  ): Promise<MigrationResult>;

  public setWithDerivedData(
    getData: SetDataGetter<D> | SetDataGetter<Partial<D>>,
    options?: SetOptions
  ): Promise<MigrationResult> {
    return this.migrate((writeBatch, snapshot) => {
      if (options === undefined) {
        // Signature 1
        const data = (getData as SetDataGetter<D>)(snapshot);
        writeBatch.set(snapshot.ref, data);
      } else {
        // Signature 2
        const data = (getData as SetDataGetter<Partial<D>>)(snapshot);
        writeBatch.set(snapshot.ref, data, options);
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
    return this.migrate((writeBatch, snapshot) => {
      if (typeof dataOrField === 'string' || dataOrField instanceof firestore.FieldPath) {
        // Signature 2
        const field = dataOrField;
        const value = preconditionOrValue;
        writeBatch.update(snapshot.ref, field, value, ...moreFieldsOrPrecondition);
      } else {
        // Signature 1
        const data = dataOrField;
        const precondition = preconditionOrValue as firestore.Precondition | undefined;
        if (precondition === undefined) {
          writeBatch.update(snapshot.ref, data);
        } else {
          writeBatch.update(snapshot.ref, data, precondition);
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
    return this.migrate((writeBatch, snapshot) => {
      const data = getData(snapshot);
      if (Array.isArray(data)) {
        // Signature 2
        writeBatch.update(snapshot.ref, ...data);
      } else {
        // Signature 1
        if (precondition === undefined) {
          writeBatch.update(snapshot.ref, data);
        } else {
          writeBatch.update(snapshot.ref, data, precondition);
        }
      }
    });
  }

  private async migrate(
    migrateDoc: (
      writeBatch: firestore.WriteBatch,
      snapshot: firestore.QueryDocumentSnapshot<D>
    ) => void
  ): Promise<MigrationResult> {
    return this.migrateWithTraverser(async (snapshots) => {
      let migratedDocCount = 0;
      const writeBatch = this.traverser.traversable.firestore.batch();
      snapshots.forEach((snapshot) => {
        const shouldMigrate = this.migrationPredicate(snapshot);
        if (shouldMigrate) {
          migrateDoc(writeBatch, snapshot);
          migratedDocCount++;
        }
      });
      await writeBatch.commit();
      return migratedDocCount;
    });
  }
}
