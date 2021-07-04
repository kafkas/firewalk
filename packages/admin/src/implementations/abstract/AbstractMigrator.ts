import { firestore } from 'firebase-admin';
import type {
  BatchCallback,
  MigrationPredicate,
  MigrationResult,
  Migrator,
  SetDataGetter,
  SetOptions,
  TraversalConfig,
  Traverser,
  UpdateDataGetter,
  UpdateFieldValueGetter,
} from '../../api';

export type RegisteredCallbacks<D> = {
  onBeforeBatchStart?: BatchCallback<D>;
  onAfterBatchComplete?: BatchCallback<D>;
};

export abstract class AbstractMigrator<C extends TraversalConfig, D> implements Migrator<C, D> {
  protected constructor(
    protected readonly registeredCallbacks: RegisteredCallbacks<D> = {},
    protected readonly migrationPredicates: MigrationPredicate<D>[] = []
  ) {}

  public onBeforeBatchStart(callback: BatchCallback<D>): void {
    this.registeredCallbacks.onBeforeBatchStart = callback;
  }

  public onAfterBatchComplete(callback: BatchCallback<D>): void {
    this.registeredCallbacks.onAfterBatchComplete = callback;
  }

  public renameField(
    oldField: string | firestore.FieldPath,
    newField: string | firestore.FieldPath
  ): Promise<MigrationResult> {
    return this.updateWithDerivedData((snap) => {
      const value = snap.get(oldField);
      return [oldField, firestore.FieldValue.delete(), newField, value];
    });
  }

  protected async migrateWithTraverser(
    migrateBatch: (snapshots: firestore.QueryDocumentSnapshot<D>[]) => Promise<number>
  ): Promise<MigrationResult> {
    let migratedDocCount = 0;
    const traversalResult = await this.traverser.traverse(async (snapshots, batchIndex) => {
      this.registeredCallbacks.onBeforeBatchStart?.(snapshots, batchIndex);
      const migratedBatchDocCount = await migrateBatch(snapshots);
      migratedDocCount += migratedBatchDocCount;
      this.registeredCallbacks.onAfterBatchComplete?.(snapshots, batchIndex);
    });
    return { traversalResult, migratedDocCount };
  }

  protected shouldMigrateDoc(doc: firestore.QueryDocumentSnapshot<D>): boolean {
    return this.migrationPredicates.every((predicate) => predicate(doc));
  }

  public abstract readonly traverser: Traverser<C, D>;

  public abstract withPredicate(predicate: MigrationPredicate<D>): Migrator<C, D>;

  public abstract withTraverser<C2 extends TraversalConfig>(
    traverser: Traverser<C2, D>
  ): Migrator<C2, D>;

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
