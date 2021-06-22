import type { firestore } from 'firebase-admin';
import type { TraversalConfig, MigrationResult, BatchCallback } from './types';

export type MigrationPredicate<T> = (snapshot: firestore.QueryDocumentSnapshot<T>) => boolean;

export type UpdateDataGetter<T> = (
  snapshot: firestore.QueryDocumentSnapshot<T>
) => firestore.UpdateData;

export type SetData<T, M> = undefined extends M ? T : false extends M ? T : Partial<T>;

export type SetOptions<M> = {
  merge?: M;
  mergeFields?: (string | firestore.FieldPath)[];
};

export type SetDataGetter<T, M> = (snapshot: firestore.QueryDocumentSnapshot<T>) => SetData<T, M>;

export interface Migrator<T = firestore.DocumentData> {
  /**
   * Updates the specified keys of the traversal configuration.
   * @param config Partial traversal configuration.
   * @returns The migrator object itself.
   */
  setConfig(config: Partial<TraversalConfig>): Migrator<T>;

  /**
   * Registers a callback function that fires right before the current batch starts processing.
   * @param callback A synchronous callback that takes batch doc snapshots and the 1-based batch index as its arguments.
   */
  onBeforeBatchStart(callback: BatchCallback<T>): void;

  /**
   * Registers a callback function that fires after the current batch is processed.
   * @param callback A synchronous callback that takes batch doc snapshots and the 1-based batch index as its arguments.
   */
  onAfterBatchComplete(callback: BatchCallback<T>): void;

  /**
   * Sets all documents in this collection with the provided data.
   * @param getData - A function that returns an object with which to set each document.
   * @param options - Optional. An object to configure the set behavior.
   * @param predicate - Optional. A function that returns a boolean indicating whether to migrate the current document. If this is not provided, all documents will be migrated.
   * @returns A Promise resolving to an object representing the details of the migration.
   */
  set<M extends boolean | undefined>(
    getData: SetDataGetter<T, M>,
    options?: SetOptions<M>,
    predicate?: MigrationPredicate<T>
  ): Promise<MigrationResult>;

  /**
   * Sets all documents in this collection with the provided data.
   * @param data - The data with which to set each document.
   * @param options - Optional. An object to configure the set behavior.
   * @param predicate - Optional. A function that returns a boolean indicating whether to migrate the current document. If this is not provided, all documents will be migrated.
   * @returns A Promise resolving to an object representing the details of the migration.
   */
  set<M extends boolean | undefined>(
    data: SetData<T, M>,
    options?: SetOptions<M>,
    predicate?: MigrationPredicate<T>
  ): Promise<MigrationResult>;

  /**
   * Updates all documents in this collection with the provided data.
   * @param getData - A function that returns the data with which to update each document.
   * @param predicate - Optional. A function that returns a boolean indicating whether to migrate the current document. If this is not provided, all documents will be migrated.
   * @returns A Promise resolving to an object representing the details of the migration.
   */
  update(getData: UpdateDataGetter<T>, predicate?: MigrationPredicate<T>): Promise<MigrationResult>;

  /**
   * Updates all documents in this collection with the provided data.
   * @param data - The data with which to update each document. Must be a non-empty object.
   * @param predicate - Optional. A function that returns a boolean indicating whether to migrate the current document. If this is not provided, all documents will be migrated.
   * @returns A Promise resolving to an object representing the details of the migration.
   */
  update(data: firestore.UpdateData, predicate?: MigrationPredicate<T>): Promise<MigrationResult>;

  /**
   * Updates all documents in this collection with the provided field-value pair.
   * @param field - The field to update in each document.
   * @param value - The value with which to update the specified field in each document. Must not be `undefined`.
   * @param predicate - Optional. A function that returns a boolean indicating whether to migrate the current document. If this is not provided, all documents will be migrated.
   * @returns A Promise resolving to an object representing the details of the migration.
   */
  update(
    field: string | firestore.FieldPath,
    value: any,
    predicate?: MigrationPredicate<T>
  ): Promise<MigrationResult>;
}
