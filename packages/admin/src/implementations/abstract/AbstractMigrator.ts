import type { firestore } from 'firebase-admin';
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

export abstract class AbstractMigrator<D extends firestore.DocumentData, C extends TraversalConfig>
  implements Migrator<D, C> {
  private registeredCallbacks: {
    onBeforeBatchStart?: BatchCallback<D>;
    onAfterBatchComplete?: BatchCallback<D>;
  } = {};

  public onBeforeBatchStart(callback: BatchCallback<D>): void {
    this.registeredCallbacks.onBeforeBatchStart = callback;
  }

  public onAfterBatchComplete(callback: BatchCallback<D>): void {
    this.registeredCallbacks.onAfterBatchComplete = callback;
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

  public abstract readonly traverser: Traverser<D, C>;

  public abstract withPredicate(predicate: MigrationPredicate<D>): Migrator<D, C>;

  public abstract withTraverser<C2 extends TraversalConfig>(
    traverser: Traverser<D, C2>
  ): Migrator<D, C2>;

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
