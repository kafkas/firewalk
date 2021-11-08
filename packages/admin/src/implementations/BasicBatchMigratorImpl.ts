import type { firestore } from 'firebase-admin';
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
import { AbstractMigrator, RegisteredCallbacks } from './abstract';

export class BasicBatchMigratorImpl<C extends TraversalConfig, D>
  extends AbstractMigrator<C, D>
  implements BatchMigrator<C, D> {
  static readonly #MAX_BATCH_WRITE_DOC_COUNT = 500;

  public constructor(
    public readonly traverser: Traverser<C, D>,
    registeredCallbacks?: RegisteredCallbacks<D>,
    migrationPredicates?: MigrationPredicate<D>[]
  ) {
    super(registeredCallbacks, migrationPredicates);
    this.#validateConfig(traverser.traversalConfig);
  }

  #validateConfig(config: Partial<TraversalConfig> = {}): void {
    const { batchSize } = config;
    if (
      typeof batchSize === 'number' &&
      (!isPositiveInteger(batchSize) ||
        batchSize > BasicBatchMigratorImpl.#MAX_BATCH_WRITE_DOC_COUNT)
    ) {
      throw new Error(
        `The 'batchSize' field in the traversal config of a BatchMigrator's traverser must be a positive integer less than or equal to ${
          BasicBatchMigratorImpl.#MAX_BATCH_WRITE_DOC_COUNT
        }. In Firestore, each write batch can write to a maximum of ${
          BasicBatchMigratorImpl.#MAX_BATCH_WRITE_DOC_COUNT
        } documents.`
      );
    }
  }

  public withPredicate(predicate: MigrationPredicate<D>): BatchMigrator<C, D> {
    return new BasicBatchMigratorImpl(this.traverser, this.registeredCallbacks, [
      ...this.migrationPredicates,
      predicate,
    ]);
  }

  public withTraverser<C2 extends TraversalConfig>(
    traverser: Traverser<C2, D>
  ): BatchMigrator<C2, D> {
    return new BasicBatchMigratorImpl(
      traverser,
      this.registeredCallbacks,
      this.migrationPredicates
    );
  }

  public set(data: D): Promise<MigrationResult>;

  public set(data: Partial<D>, options: SetOptions): Promise<MigrationResult>;

  public async set(data: D | Partial<D>, options?: SetOptions): Promise<MigrationResult> {
    return this.#migrate((writeBatch, doc) => {
      if (options === undefined) {
        // Signature 1
        writeBatch.set(doc.ref, data as D);
      } else {
        // Signature 2
        writeBatch.set(doc.ref, data as Partial<D>, options);
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
    return this.#migrate((writeBatch, doc) => {
      if (options === undefined) {
        // Signature 1
        const data = (getData as SetDataGetter<D>)(doc);
        writeBatch.set(doc.ref, data);
      } else {
        // Signature 2
        const data = (getData as SetDataGetter<Partial<D>>)(doc);
        writeBatch.set(doc.ref, data, options);
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
    return this.#migrate((writeBatch, doc) => {
      if (
        typeof dataOrField === 'string' ||
        dataOrField instanceof this.firestoreConstructor.FieldPath
      ) {
        // Signature 2
        const field = dataOrField;
        const value = preconditionOrValue;
        writeBatch.update(doc.ref, field, value, ...moreFieldsOrPrecondition);
      } else {
        // Signature 1
        const data = dataOrField;
        const precondition = preconditionOrValue as firestore.Precondition | undefined;
        if (precondition === undefined) {
          writeBatch.update(doc.ref, data);
        } else {
          writeBatch.update(doc.ref, data, precondition);
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
    return this.#migrate((writeBatch, doc) => {
      const data = getData(doc);
      if (Array.isArray(data)) {
        // Signature 2
        writeBatch.update(doc.ref, ...data);
      } else {
        // Signature 1
        if (precondition === undefined) {
          writeBatch.update(doc.ref, data);
        } else {
          writeBatch.update(doc.ref, data, precondition);
        }
      }
    });
  }

  async #migrate(
    migrateDoc: (writeBatch: firestore.WriteBatch, doc: firestore.QueryDocumentSnapshot<D>) => void
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
