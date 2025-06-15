import type { firestore } from 'firebase-admin';
import type {
  DefaultMigrator,
  MigrationPredicate,
  MigrationResult,
  SetDataGetter,
  SetOptions,
  SetPartialDataGetter,
  Traverser,
  UpdateDataGetter,
  UpdateFieldValueGetter,
} from '../../api';
import { AbstractMigrator, RegisteredCallbacks } from './abstract';
import { IllegalArgumentError } from '../errors';

export class BasicDefaultMigratorImpl<
    AppModelType = firestore.DocumentData,
    DbModelType extends firestore.DocumentData = firestore.DocumentData,
  >
  extends AbstractMigrator<AppModelType, DbModelType>
  implements DefaultMigrator<AppModelType, DbModelType>
{
  public constructor(
    public readonly traverser: Traverser<AppModelType, DbModelType>,
    registeredCallbacks?: RegisteredCallbacks<AppModelType, DbModelType>,
    migrationPredicates?: MigrationPredicate<AppModelType, DbModelType>[]
  ) {
    super(registeredCallbacks, migrationPredicates);
  }

  public withPredicate(
    predicate: MigrationPredicate<AppModelType, DbModelType>
  ): DefaultMigrator<AppModelType, DbModelType> {
    return new BasicDefaultMigratorImpl(this.traverser, this.registeredCallbacks, [
      ...this.migrationPredicates,
      predicate,
    ]);
  }

  public withTraverser(
    traverser: Traverser<AppModelType, DbModelType>
  ): DefaultMigrator<AppModelType, DbModelType> {
    return new BasicDefaultMigratorImpl(
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
    return this.#migrate(async (doc) => {
      if (options === undefined) {
        // Signature 2
        await doc.ref.set(data as firestore.WithFieldValue<AppModelType>);
      } else {
        // Signature 1
        await doc.ref.set(data as firestore.PartialWithFieldValue<AppModelType>, options);
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
    return this.#migrate(async (doc) => {
      if (options === undefined) {
        // Signature 2
        const data = (getData as SetDataGetter<AppModelType, DbModelType>)(doc);
        await doc.ref.set(data);
      } else {
        // Signature 1
        const data = (getData as SetPartialDataGetter<AppModelType, DbModelType>)(doc);
        await doc.ref.set(data, options);
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
    return this.#migrate(async (doc) => {
      if (
        typeof dataOrField === 'string' ||
        dataOrField instanceof this.firestoreConstructor.FieldPath
      ) {
        // Signature 2
        const field = dataOrField;
        const value = preconditionOrValue;
        await doc.ref.update(field, value, ...moreFieldsOrPrecondition);
      } else if (typeof dataOrField === 'object' && dataOrField !== null) {
        // Signature 1
        const data = dataOrField;
        const precondition = preconditionOrValue as firestore.Precondition | undefined;
        if (precondition === undefined) {
          await doc.ref.update(data);
        } else {
          await doc.ref.update(data, precondition);
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
    return this.#migrate(async (doc) => {
      const data = getData(doc);

      if (Array.isArray(data)) {
        // Signature 2
        await doc.ref.update(...(data as [string | firestore.FieldPath, any, ...any[]]));
      } else if (typeof data === 'object' && data !== null) {
        // Signature 1
        if (precondition === undefined) {
          await doc.ref.update(data);
        } else {
          await doc.ref.update(data, precondition);
        }
      } else {
        throw new IllegalArgumentError(
          `Unsupported signature detected. The 'data' argument must be an array, an object, or a valid Firestore update signature.`
        );
      }
    });
  }

  async #migrate(
    migrateDoc: (doc: firestore.QueryDocumentSnapshot<AppModelType, DbModelType>) => Promise<void>
  ): Promise<MigrationResult> {
    return this.migrateWithTraverser(async (batchDocs) => {
      let migratedDocCount = 0;
      const promises = batchDocs.map(async (doc) => {
        if (this.shouldMigrateDoc(doc)) {
          await migrateDoc(doc);
          migratedDocCount++;
        }
      });
      await Promise.all(promises);
      return migratedDocCount;
    });
  }
}
