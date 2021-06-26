import type { firestore } from 'firebase-admin';
import type { SetOptions } from '@google-cloud/firestore';
import type { Traverser } from './Traverser';
import type { BaseTraversalConfig, MigrationResult, BatchCallback } from './types';

export type { SetOptions } from '@google-cloud/firestore';

export type MigrationPredicate<D> = (snapshot: firestore.QueryDocumentSnapshot<D>) => boolean;

export type SetDataGetter<D> = (snapshot: firestore.QueryDocumentSnapshot<D>) => D;

export type SetPartialDataGetter<D> = (snapshot: firestore.QueryDocumentSnapshot<D>) => Partial<D>;

export type UpdateDataGetter<D> = (
  snapshot: firestore.QueryDocumentSnapshot<D>
) => firestore.UpdateData;

export abstract class Migrator<D extends firestore.DocumentData, C extends BaseTraversalConfig> {
  protected registeredCallbacks: {
    onBeforeBatchStart?: BatchCallback<D>;
    onAfterBatchComplete?: BatchCallback<D>;
  } = {};

  /**
   * Registers a callback function that fires right before a batch starts processing.
   * @param callback A synchronous callback that takes batch doc snapshots and the 0-based batch index as its arguments.
   */
  public onBeforeBatchStart(callback: BatchCallback<D>): void {
    this.registeredCallbacks.onBeforeBatchStart = callback;
  }

  /**
   * Registers a callback function that fires after a batch is processed.
   * @param callback A synchronous callback that takes batch doc snapshots and the 0-based batch index as its arguments.
   */
  public onAfterBatchComplete(callback: BatchCallback<D>): void {
    this.registeredCallbacks.onAfterBatchComplete = callback;
  }

  /**
   * The underlying traverser.
   */
  public abstract readonly traverser: Traverser<D, C>;

  public abstract set(getData: SetDataGetter<D>): Promise<MigrationResult>;

  public abstract set(
    getData: SetPartialDataGetter<D>,
    options: SetOptions
  ): Promise<MigrationResult>;

  public abstract set(data: D): Promise<MigrationResult>;

  public abstract set(data: Partial<D>, options: SetOptions): Promise<MigrationResult>;

  public abstract update(getData: UpdateDataGetter<D>): Promise<MigrationResult>;

  public abstract update(data: firestore.UpdateData): Promise<MigrationResult>;

  public abstract update(field: string | firestore.FieldPath, value: any): Promise<MigrationResult>;
}
