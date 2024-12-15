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

export class BasicDefaultMigratorImpl<D> extends AbstractMigrator<D> implements DefaultMigrator<D> {
  public constructor(
    public readonly traverser: Traverser<D>,
    registeredCallbacks?: RegisteredCallbacks<D>,
    migrationPredicates?: MigrationPredicate<D>[]
  ) {
    super(registeredCallbacks, migrationPredicates);
  }

  public withPredicate(predicate: MigrationPredicate<D>): DefaultMigrator<D> {
    return new BasicDefaultMigratorImpl(this.traverser, this.registeredCallbacks, [
      ...this.migrationPredicates,
      predicate,
    ]);
  }

  public withTraverser(traverser: Traverser<D>): DefaultMigrator<D> {
    return new BasicDefaultMigratorImpl(
      traverser,
      this.registeredCallbacks,
      this.migrationPredicates
    );
  }

  public set(
    data: firestore.PartialWithFieldValue<D>,
    options: SetOptions
  ): Promise<MigrationResult>;

  public set(data: firestore.WithFieldValue<D>): Promise<MigrationResult>;

  public async set(
    data: firestore.PartialWithFieldValue<D> | firestore.WithFieldValue<D>,
    options?: SetOptions
  ): Promise<MigrationResult> {
    return this.#migrate(async (doc) => {
      if (options === undefined) {
        // Signature 2
        await doc.ref.set(data as firestore.WithFieldValue<D>);
      } else {
        // Signature 1
        await doc.ref.set(data as firestore.PartialWithFieldValue<D>, options);
      }
    });
  }

  public setWithDerivedData(
    getData: SetPartialDataGetter<D>,
    options: SetOptions
  ): Promise<MigrationResult>;

  public setWithDerivedData(getData: SetDataGetter<D>): Promise<MigrationResult>;

  public async setWithDerivedData(
    getData: SetPartialDataGetter<D> | SetDataGetter<D>,
    options?: SetOptions
  ): Promise<MigrationResult> {
    return this.#migrate(async (doc) => {
      if (options === undefined) {
        // Signature 2
        const data = (getData as SetDataGetter<D>)(doc);
        await doc.ref.set(data);
      } else {
        // Signature 1
        const data = (getData as SetPartialDataGetter<D>)(doc);
        await doc.ref.set(data, options);
      }
    });
  }

  public update(
    data: firestore.UpdateData<D>,
    precondition?: firestore.Precondition
  ): Promise<MigrationResult>;

  public update(
    field: string | firestore.FieldPath,
    value: any,
    ...moreFieldsOrPrecondition: any[]
  ): Promise<MigrationResult>;

  public update(
    dataOrField: firestore.UpdateData<D> | string | firestore.FieldPath,
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
    getData: UpdateDataGetter<D>,
    precondition?: firestore.Precondition
  ): Promise<MigrationResult>;

  public updateWithDerivedData(getData: UpdateFieldValueGetter<D>): Promise<MigrationResult>;

  public updateWithDerivedData(
    getData: (
      doc: firestore.QueryDocumentSnapshot<D>
    ) => ReturnType<UpdateDataGetter<D>> | ReturnType<UpdateFieldValueGetter<D>>,
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
    migrateDoc: (doc: firestore.QueryDocumentSnapshot<D>) => Promise<void>
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
