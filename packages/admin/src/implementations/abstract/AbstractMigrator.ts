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
} from '../../api';

export abstract class AbstractMigrator<D extends firestore.DocumentData, C extends TraversalConfig>
  implements Migrator<D, C> {
  protected registeredCallbacks: {
    onBeforeBatchStart?: BatchCallback<D>;
    onAfterBatchComplete?: BatchCallback<D>;
  } = {};

  public onBeforeBatchStart(callback: BatchCallback<D>): void {
    this.registeredCallbacks.onBeforeBatchStart = callback;
  }

  public onAfterBatchComplete(callback: BatchCallback<D>): void {
    this.registeredCallbacks.onAfterBatchComplete = callback;
  }

  public abstract readonly traverser: Traverser<D, C>;

  public abstract withPredicate(predicate: MigrationPredicate<D>): Migrator<D, C>;

  public abstract withTraverser<C2 extends TraversalConfig>(
    traverser: Traverser<D, C2>
  ): Migrator<D, C2>;

  public abstract set(dataOrGetData: D | SetDataGetter<D>): Promise<MigrationResult>;

  public abstract set(
    dataOrGetData: Partial<D> | SetDataGetter<Partial<D>>,
    options: SetOptions
  ): Promise<MigrationResult>;

  public abstract update(data: firestore.UpdateData): Promise<MigrationResult>;

  public abstract update(field: string | firestore.FieldPath, value: any): Promise<MigrationResult>;

  public abstract updateWithDerivedData(getData: UpdateDataGetter<D>): Promise<MigrationResult>;
}
