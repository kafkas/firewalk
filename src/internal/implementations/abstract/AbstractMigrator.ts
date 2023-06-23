import type { firestore } from 'firebase-admin';
import type {
  BatchCallback,
  MigrationPredicate,
  MigrationResult,
  Migrator,
  SetDataGetter,
  SetOptions,
  Traverser,
  UpdateDataGetter,
  UpdateFieldValueGetter,
} from '../../../api';

export type RegisteredCallbacks<D> = {
  onBeforeBatchStart?: BatchCallback<D>;
  onAfterBatchComplete?: BatchCallback<D>;
};

type UpdateFieldValueArgs = [
  field: string | firestore.FieldPath,
  value: any,
  ...moreFieldsOrPrecondition: any[]
];

export abstract class AbstractMigrator<D> implements Migrator<D> {
  protected constructor(
    protected readonly registeredCallbacks: RegisteredCallbacks<D> = {},
    protected readonly migrationPredicates: MigrationPredicate<D>[] = []
  ) {}

  protected get firestoreInstance(): firestore.Firestore {
    return this.traverser.traversable.firestore;
  }

  protected get firestoreConstructor(): typeof firestore {
    return this.firestoreInstance.constructor as typeof firestore;
  }

  public onBeforeBatchStart(callback: BatchCallback<D>): void {
    this.registeredCallbacks.onBeforeBatchStart = callback;
  }

  public onAfterBatchComplete(callback: BatchCallback<D>): void {
    this.registeredCallbacks.onAfterBatchComplete = callback;
  }

  public deleteField(field: string | firestore.FieldPath): Promise<MigrationResult> {
    return this.deleteFields(field);
  }

  public deleteFields(...fields: (string | firestore.FieldPath)[]): Promise<MigrationResult> {
    const updateFieldValuePairs = fields.reduce((acc, field) => {
      acc.push(field, this.firestoreConstructor.FieldValue.delete());
      return acc;
    }, [] as unknown as UpdateFieldValueArgs);
    return this.update(...updateFieldValuePairs);
  }

  public renameField(
    oldField: string | firestore.FieldPath,
    newField: string | firestore.FieldPath
  ): Promise<MigrationResult> {
    return this.renameFields([oldField, newField]);
  }

  public renameFields(
    ...changes: [oldField: string | firestore.FieldPath, newField: string | firestore.FieldPath][]
  ): Promise<MigrationResult> {
    return this.withPredicate((snap) =>
      changes.some(([oldField]) => snap.get(oldField) !== undefined)
    ).updateWithDerivedData((snap) => {
      const updateFieldValuePairs: unknown[] = [];
      changes.forEach((change) => {
        const [oldField, newField] = change;
        const value = snap.get(oldField);
        if (value !== undefined) {
          updateFieldValuePairs.push(
            oldField,
            this.firestoreConstructor.FieldValue.delete(),
            newField,
            value
          );
        }
      });
      return updateFieldValuePairs as [string | firestore.FieldPath, any, ...any[]];
    });
  }

  protected async migrateWithTraverser(
    migrateBatch: (batchDocs: firestore.QueryDocumentSnapshot<D>[]) => Promise<number>
  ): Promise<MigrationResult> {
    let migratedDocCount = 0;
    const traversalResult = await this.traverser.traverse(async (batchDocs, batchIndex) => {
      await this.registeredCallbacks.onBeforeBatchStart?.(batchDocs, batchIndex);
      const migratedBatchDocCount = await migrateBatch(batchDocs);
      migratedDocCount += migratedBatchDocCount;
      await this.registeredCallbacks.onAfterBatchComplete?.(batchDocs, batchIndex);
    });
    return { traversalResult, migratedDocCount };
  }

  protected shouldMigrateDoc(doc: firestore.QueryDocumentSnapshot<D>): boolean {
    return this.migrationPredicates.every((predicate) => predicate(doc));
  }

  public abstract readonly traverser: Traverser<D>;

  public abstract withPredicate(predicate: MigrationPredicate<D>): Migrator<D>;

  public abstract withTraverser(traverser: Traverser<D>): Migrator<D>;

  public abstract set(data: D): Promise<MigrationResult>;

  public abstract set(data: Partial<D>, options: SetOptions): Promise<MigrationResult>;

  public abstract setWithDerivedData(getData: SetDataGetter<D>): Promise<MigrationResult>;

  public abstract setWithDerivedData(
    getData: SetDataGetter<Partial<D>>,
    options: SetOptions
  ): Promise<MigrationResult>;

  public abstract update(
    data: firestore.UpdateData,
    precondition?: firestore.Precondition
  ): Promise<MigrationResult>;

  public abstract update(
    field: string | firestore.FieldPath,
    value: any,
    ...moreFieldsOrPrecondition: any[]
  ): Promise<MigrationResult>;

  public abstract updateWithDerivedData(
    getData: UpdateDataGetter<D>,
    precondition?: firestore.Precondition
  ): Promise<MigrationResult>;

  public abstract updateWithDerivedData(
    getData: UpdateFieldValueGetter<D>
  ): Promise<MigrationResult>;
}
