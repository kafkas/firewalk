import type { firestore } from 'firebase-admin';
import type {
  BatchMigrator,
  MigrationPredicate,
  MigrationResult,
  SetDataGetter,
  SetOptions,
  SetPartialDataGetter,
  Traverser,
  UpdateDataGetter,
  UpdateFieldValueGetter,
} from '../../api';
import { InvalidConfigError } from '../../errors';
import { isPositiveInteger } from '../utils';
import { AbstractMigrator, RegisteredCallbacks } from './abstract';
import { IllegalArgumentError } from '../errors';

export class BasicBatchMigratorImpl<
    AppModelType = firestore.DocumentData,
    DbModelType extends firestore.DocumentData = firestore.DocumentData
  >
  extends AbstractMigrator<AppModelType, DbModelType>
  implements BatchMigrator<AppModelType, DbModelType>
{
  static readonly #MAX_BATCH_WRITE_DOC_COUNT = 500;

  public constructor(
    public readonly traverser: Traverser<AppModelType, DbModelType>,
    registeredCallbacks?: RegisteredCallbacks<AppModelType, DbModelType>,
    migrationPredicates?: MigrationPredicate<AppModelType, DbModelType>[]
  ) {
    super(registeredCallbacks, migrationPredicates);
    this.#validateTraverserCompatibility();
  }

  #validateTraverserCompatibility(): void {
    const { batchSize } = this.traverser.traversalConfig;
    const maxBatchWriteDocCount = BasicBatchMigratorImpl.#MAX_BATCH_WRITE_DOC_COUNT;
    if (
      typeof batchSize === 'number' &&
      (!isPositiveInteger(batchSize) || batchSize > maxBatchWriteDocCount)
    ) {
      throw new InvalidConfigError(
        `The 'batchSize' field in the traversal config of a BatchMigrator's traverser must be a positive integer less than or equal to ${maxBatchWriteDocCount}. In Firestore, each write batch can write to a maximum of ${maxBatchWriteDocCount} documents.`
      );
    }
  }

  public withPredicate(
    predicate: MigrationPredicate<AppModelType, DbModelType>
  ): BatchMigrator<AppModelType, DbModelType> {
    return new BasicBatchMigratorImpl(this.traverser, this.registeredCallbacks, [
      ...this.migrationPredicates,
      predicate,
    ]);
  }

  public withTraverser(
    traverser: Traverser<AppModelType, DbModelType>
  ): BatchMigrator<AppModelType, DbModelType> {
    return new BasicBatchMigratorImpl(
      traverser,
      this.registeredCallbacks,
      this.migrationPredicates
    );
  }

  public set(
    data: firestore.PartialWithFieldValue<AppModelType>,
    options: SetOptions
  ): Promise<MigrationResult>;

  public set(data: firestore.WithFieldValue<AppModelType>): Promise<MigrationResult>;

  public async set(
    data: firestore.PartialWithFieldValue<AppModelType> | firestore.WithFieldValue<AppModelType>,
    options?: SetOptions
  ): Promise<MigrationResult> {
    return this.#migrate((writeBatch, doc) => {
      if (options === undefined) {
        // Signature 2
        writeBatch.set(doc.ref, data as firestore.WithFieldValue<AppModelType>);
      } else {
        // Signature 1
        writeBatch.set(doc.ref, data as firestore.PartialWithFieldValue<AppModelType>, options);
      }
    });
  }

  public setWithDerivedData(
    getData: SetPartialDataGetter<AppModelType, DbModelType>,
    options: SetOptions
  ): Promise<MigrationResult>;

  public setWithDerivedData(
    getData: SetDataGetter<AppModelType, DbModelType>
  ): Promise<MigrationResult>;

  public async setWithDerivedData(
    getData:
      | SetPartialDataGetter<AppModelType, DbModelType>
      | SetDataGetter<AppModelType, DbModelType>,
    options?: SetOptions
  ): Promise<MigrationResult> {
    return this.#migrate((writeBatch, doc) => {
      if (options === undefined) {
        // Signature 2
        const data = (getData as SetDataGetter<AppModelType, DbModelType>)(doc);
        writeBatch.set(doc.ref, data);
      } else {
        // Signature 1
        const data = (getData as SetPartialDataGetter<AppModelType, DbModelType>)(doc);
        writeBatch.set(doc.ref, data, options);
      }
    });
  }

  public update(
    data: firestore.UpdateData<DbModelType>,
    precondition?: firestore.Precondition
  ): Promise<MigrationResult>;

  public update(
    field: string | firestore.FieldPath,
    value: any,
    ...moreFieldsOrPrecondition: any[]
  ): Promise<MigrationResult>;

  public update(
    dataOrField: firestore.UpdateData<DbModelType> | string | firestore.FieldPath,
    preconditionOrValue?: any,
    ...moreFieldsOrPrecondition: any[]
  ): Promise<MigrationResult> {
    return this.#migrate((writeBatch, doc) => {
      if (
        typeof dataOrField === 'string' ||
        dataOrField instanceof this.firestoreConstructor.FieldPath
      ) {
        // Signature 2
        const field = dataOrField;
        const value = preconditionOrValue;
        writeBatch.update(doc.ref, field, value, ...moreFieldsOrPrecondition);
      } else if (dataOrField !== undefined) {
        // Signature 1
        const data = dataOrField;
        const precondition = preconditionOrValue as firestore.Precondition | undefined;
        if (precondition === undefined) {
          writeBatch.update(doc.ref, data);
        } else {
          writeBatch.update(doc.ref, data, precondition);
        }
      } else {
        throw new IllegalArgumentError(
          `Unsupported signature detected. The 'dataOrField' argument cannot be undefined. The 'dataOrField' argument must be a string, a FieldPath, or an object.`
        );
      }
    });
  }

  public updateWithDerivedData(
    getData: UpdateDataGetter<AppModelType, DbModelType>,
    precondition?: firestore.Precondition
  ): Promise<MigrationResult>;

  public updateWithDerivedData(
    getData: UpdateFieldValueGetter<AppModelType, DbModelType>
  ): Promise<MigrationResult>;

  public updateWithDerivedData(
    getData: (
      doc: firestore.QueryDocumentSnapshot<AppModelType, DbModelType>
    ) =>
      | ReturnType<UpdateDataGetter<AppModelType, DbModelType>>
      | ReturnType<UpdateFieldValueGetter<AppModelType, DbModelType>>,
    precondition?: firestore.Precondition
  ): Promise<MigrationResult> {
    return this.#migrate((writeBatch, doc) => {
      const data = getData(doc);
      if (Array.isArray(data)) {
        // Signature 2
        writeBatch.update(doc.ref, ...(data as [string | firestore.FieldPath, any, ...any[]]));
      } else if (data !== undefined) {
        // Signature 1
        if (precondition === undefined) {
          writeBatch.update(doc.ref, data);
        } else {
          writeBatch.update(doc.ref, data, precondition);
        }
      } else {
        throw new IllegalArgumentError(
          `Unsupported signature detected. The 'data' argument cannot be undefined. The 'data' argument must be an array, an object, or a valid Firestore update signature.`
        );
      }
    });
  }

  async #migrate(
    migrateDoc: (
      writeBatch: firestore.WriteBatch,
      doc: firestore.QueryDocumentSnapshot<AppModelType, DbModelType>
    ) => void
  ): Promise<MigrationResult> {
    return this.migrateWithTraverser(async (batchDocs) => {
      let migratedDocCount = 0;
      const writeBatch = this.firestoreInstance.batch();
      batchDocs.forEach((doc) => {
        if (this.shouldMigrateDoc(doc)) {
          migrateDoc(writeBatch, doc);
          migratedDocCount++;
        }
      });
      await writeBatch.commit();
      return migratedDocCount;
    });
  }
}
