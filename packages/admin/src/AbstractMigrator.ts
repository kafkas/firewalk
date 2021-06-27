import type { firestore } from 'firebase-admin';
import type {
  BaseTraversalConfig,
  BatchCallback,
  MigrationResult,
  Migrator,
  SetDataGetter,
  SetOptions,
  SetPartialDataGetter,
  Traverser,
  UpdateDataGetter,
} from './api';

export abstract class AbstractMigrator<
  D extends firestore.DocumentData,
  C extends BaseTraversalConfig
> implements Migrator<D, C> {
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

  public abstract set(data: Partial<D>, options: SetOptions): Promise<MigrationResult>;

  public abstract set(data: D): Promise<MigrationResult>;

  public abstract set(
    getData: SetPartialDataGetter<D>,
    options: SetOptions
  ): Promise<MigrationResult>;

  public abstract set(getData: SetDataGetter<D>): Promise<MigrationResult>;

  public abstract update(getData: UpdateDataGetter<D>): Promise<MigrationResult>;

  public abstract update(data: firestore.UpdateData): Promise<MigrationResult>;

  public abstract update(field: string | firestore.FieldPath, value: any): Promise<MigrationResult>;
}
