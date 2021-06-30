import type { firestore } from 'firebase-admin';
import type {
  BatchCallback,
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

  public abstract set(dataOrGetData: D | SetDataGetter<D>): Promise<MigrationResult>;

  public abstract set(
    dataOrGetData: Partial<D> | SetDataGetter<Partial<D>>,
    options: SetOptions
  ): Promise<MigrationResult>;

  public abstract update(
    dataOrGetData: firestore.UpdateData | UpdateDataGetter<D>
  ): Promise<MigrationResult>;

  public abstract update(field: string | firestore.FieldPath, value: any): Promise<MigrationResult>;
}
