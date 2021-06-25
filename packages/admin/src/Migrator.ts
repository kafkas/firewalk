import type { firestore } from 'firebase-admin';
import type { Traverser } from './Traverser';
import type { Traversable, BaseTraversalConfig, MigrationResult } from './types';

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

export abstract class Migrator<
  D extends firestore.DocumentData,
  T extends Traversable<D>,
  C extends BaseTraversalConfig
> {
  /**
   * The underlying traverser.
   */
  public abstract readonly traverser: Traverser<D, T, C>;

  /**
   * Sets all documents in this collection with the provided data.
   * @param getData - A function that returns an object with which to set each document.
   * @param options - Optional. An object to configure the set behavior.
   * @param predicate - Optional. A function that returns a boolean indicating whether to migrate the current document. If this is not provided, all documents will be migrated.
   * @returns A Promise resolving to an object representing the details of the migration.
   */
  public abstract set<M extends boolean | undefined>(
    getData: SetDataGetter<D, M>,
    options?: SetOptions<M>,
    predicate?: MigrationPredicate<D>
  ): Promise<MigrationResult>;

  /**
   * Sets all documents in this collection with the provided data.
   * @param data - The data with which to set each document.
   * @param options - Optional. An object to configure the set behavior.
   * @param predicate - Optional. A function that returns a boolean indicating whether to migrate the current document. If this is not provided, all documents will be migrated.
   * @returns A Promise resolving to an object representing the details of the migration.
   */
  public abstract set<M extends boolean | undefined>(
    data: SetData<D, M>,
    options?: SetOptions<M>,
    predicate?: MigrationPredicate<D>
  ): Promise<MigrationResult>;

  /**
   * Updates all documents in this collection with the provided data.
   * @param getData - A function that returns the data with which to update each document.
   * @param predicate - Optional. A function that returns a boolean indicating whether to migrate the current document. If this is not provided, all documents will be migrated.
   * @returns A Promise resolving to an object representing the details of the migration.
   */
  public abstract update(
    getData: UpdateDataGetter<D>,
    predicate?: MigrationPredicate<D>
  ): Promise<MigrationResult>;

  /**
   * Updates all documents in this collection with the provided data.
   * @param data - The data with which to update each document. Must be a non-empty object.
   * @param predicate - Optional. A function that returns a boolean indicating whether to migrate the current document. If this is not provided, all documents will be migrated.
   * @returns A Promise resolving to an object representing the details of the migration.
   */
  public abstract update(
    data: firestore.UpdateData,
    predicate?: MigrationPredicate<D>
  ): Promise<MigrationResult>;

  /**
   * Updates all documents in this collection with the provided field-value pair.
   * @param field - The field to update in each document.
   * @param value - The value with which to update the specified field in each document. Must not be `undefined`.
   * @param predicate - Optional. A function that returns a boolean indicating whether to migrate the current document. If this is not provided, all documents will be migrated.
   * @returns A Promise resolving to an object representing the details of the migration.
   */
  public abstract update(
    field: string | firestore.FieldPath,
    value: any,
    predicate?: MigrationPredicate<D>
  ): Promise<MigrationResult>;
}
