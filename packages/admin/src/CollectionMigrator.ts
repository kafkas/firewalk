import type { firestore } from 'firebase-admin';
import type { MigrationResult } from './types';

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

export interface CollectionMigrator<T = firestore.DocumentData> {
  /**
   * Sets all documents in this collection with the provided update data.
   * @param getData - A function that returns an object with which to set each document.
   * @param options - Optional. An object to configure the set behavior.
   * @param predicate - Optional. A function that returns a boolean indicating whether to migrate the current document. Takes the `QueryDocumentSnapshot` corresponding to the document as its first argument. If this is not provided, all documents will be migrated.
   * @returns The number of batches and documents migrated.
   */
  set<M extends boolean | undefined>(
    getData: SetDataGetter<T, M>,
    options?: SetOptions<M>,
    predicate?: MigrationPredicate<T>
  ): Promise<MigrationResult>;

  /**
   * Sets all documents in this collection with the provided update data.
   * @param data - The data with which to set each document.
   * @param options - Optional. An object to configure the set behavior.
   * @param predicate - Optional. A function that returns a boolean indicating whether to migrate the current document. Takes the `QueryDocumentSnapshot` corresponding to the document as its first argument. If this is not provided, all documents will be migrated.
   * @returns The number of batches and documents migrated.
   */
  set<M extends boolean | undefined>(
    data: SetData<T, M>,
    options?: SetOptions<M>,
    predicate?: MigrationPredicate<T>
  ): Promise<MigrationResult>;

  /**
   * Updates all documents in this collection with the provided update data.
   * @param getUpdateData - A function that returns an object with which to update each document (i.e. the `updateData` object).
   * @param predicate - Optional. A function that returns a boolean indicating whether to update the current document. Takes the `QueryDocumentSnapshot` corresponding to the document as its first argument. If this is not provided, all documents will be updated.
   * @returns The number of batches and documents updated.
   */
  update(
    getUpdateData: UpdateDataGetter<T>,
    predicate?: MigrationPredicate<T>
  ): Promise<MigrationResult>;

  /**
   * Updates all documents in this collection with the provided update data.
   * @param updateData - The data with which to update each document. Must be a non-empty object.
   * @param predicate - Optional. A function that returns a boolean indicating whether to update the current document. Takes the `QueryDocumentSnapshot` corresponding to the document as its first argument. If this is not provided, all documents will be updated.
   * @returns The number of batches and documents updated.
   */
  update(
    updateData: firestore.UpdateData,
    predicate?: MigrationPredicate<T>
  ): Promise<MigrationResult>;

  /**
   * Updates all documents in this collection with the provided update data.
   * @param field - The field to update in each document.
   * @param value - The value with which to update the specified field in each document. Must not be `undefined`.
   * @param predicate - Optional. A function that returns a boolean indicating whether to update the current document. Takes the `QueryDocumentSnapshot` corresponding to the document as its first argument. If this is not provided, all documents will be updated.
   * @returns The number of batches and documents updated.
   */
  update(
    field: string | firestore.FieldPath,
    value: any,
    predicate?: MigrationPredicate<T>
  ): Promise<MigrationResult>;
}
