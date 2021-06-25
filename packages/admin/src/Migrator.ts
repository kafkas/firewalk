import type { firestore } from 'firebase-admin';
import type { Traverser } from './Traverser';
import type { BaseTraversalConfig, MigrationResult, BatchCallback } from './types';

export type MigrationPredicate<D> = (snapshot: firestore.QueryDocumentSnapshot<D>) => boolean;

export type UpdateDataGetter<D> = (
  snapshot: firestore.QueryDocumentSnapshot<D>
) => firestore.UpdateData;

export type SetData<D, M> = undefined extends M ? D : false extends M ? D : Partial<D>;

export type SetOptions<M> = {
  merge?: M;
  mergeFields?: (string | firestore.FieldPath)[];
};

export type SetDataGetter<D, M> = (snapshot: firestore.QueryDocumentSnapshot<D>) => SetData<D, M>;

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

  public abstract set<M extends boolean | undefined>(
    getData: SetDataGetter<D, M>,
    options?: SetOptions<M>,
    predicate?: MigrationPredicate<D>
  ): Promise<MigrationResult>;

  public abstract set<M extends boolean | undefined>(
    data: SetData<D, M>,
    options?: SetOptions<M>,
    predicate?: MigrationPredicate<D>
  ): Promise<MigrationResult>;

  public abstract update(
    getData: UpdateDataGetter<D>,
    predicate?: MigrationPredicate<D>
  ): Promise<MigrationResult>;

  public abstract update(
    data: firestore.UpdateData,
    predicate?: MigrationPredicate<D>
  ): Promise<MigrationResult>;

  public abstract update(
    field: string | firestore.FieldPath,
    value: any,
    predicate?: MigrationPredicate<D>
  ): Promise<MigrationResult>;
}
