import type { firestore } from 'firebase-admin';
import type {
  DefaultMigrator,
  MigrationPredicate,
  MigrationResult,
  SetDataGetter,
  SetOptions,
  Traverser,
  UpdateDataGetter,
  UpdateFieldValueGetter,
} from '../../api';
import { AbstractMigrator, RegisteredCallbacks } from './abstract';

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

  public set(data: D): Promise<MigrationResult>;

  public set(data: Partial<D>, options: SetOptions): Promise<MigrationResult>;

  public async set(data: D | Partial<D>, options?: SetOptions): Promise<MigrationResult> {
    return this.#migrate(async (doc) => {
      if (options === undefined) {
        // Signature 1
        await doc.ref.set(data as D);
      } else {
        // Signature 2
        await doc.ref.set(data as Partial<D>, options);
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
    return this.#migrate(async (doc) => {
      if (options === undefined) {
        // Signature 1
        const data = (getData as SetDataGetter<D>)(doc);
        await doc.ref.set(data);
      } else {
        // Signature 2
        const data = (getData as SetDataGetter<Partial<D>>)(doc);
        await doc.ref.set(data, options);
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
    return this.#migrate(async (doc) => {
      if (
        typeof dataOrField === 'string' ||
        dataOrField instanceof this.firestoreConstructor.FieldPath
      ) {
        // Signature 2
        const field = dataOrField;
        const value = preconditionOrValue;
        await doc.ref.update(field, value, ...moreFieldsOrPrecondition);
      } else {
        // Signature 1
        const data = dataOrField;
        const precondition = preconditionOrValue as firestore.Precondition | undefined;
        if (precondition === undefined) {
          await doc.ref.update(data);
        } else {
          await doc.ref.update(data, precondition);
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
      doc: firestore.QueryDocumentSnapshot<D>
    ) => ReturnType<UpdateDataGetter<D>> | ReturnType<UpdateFieldValueGetter<D>>,
    precondition?: firestore.Precondition
  ): Promise<MigrationResult> {
    return this.#migrate(async (doc) => {
      const data = getData(doc);

      if (Array.isArray(data)) {
        // Signature 2
        await doc.ref.update(...(data as [string | firestore.FieldPath, any, ...any[]]));
      } else {
        // Signature 1
        if (precondition === undefined) {
          await doc.ref.update(data);
        } else {
          await doc.ref.update(data, precondition);
        }
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
