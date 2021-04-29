import type { firestore } from 'firebase-admin';
import { CollectionTraverser } from './CollectionTraverser';

/**
 * An object that facilitates Firestore collection migrations.
 */
interface UpdateResult {
  /**
   * The number of batches that have been retrieved in this traversal.
   */
  batchCount: number;

  /**
   * The number of documents that have been updated in this migration.
   */
  updatedDocCount: number;
}

type Predicate<T> = (snapshot: firestore.QueryDocumentSnapshot<T>) => boolean;

type UpdateDataGetter<T> = (snapshot: firestore.QueryDocumentSnapshot<T>) => firestore.UpdateData;

/**
 * An object that facilitates Firestore collection migrations.
 */
export class CollectionMigrator<T> extends CollectionTraverser<T> {
  /**
   * Updates all documents in this collection with the provided update data. Uses batch writes so
   * the entire batch will fail if a single update isn't successful. This method uses the `.traverse()`
   * method internally to traverse the entire collection.
   * @param getUpdateData - A function that returns an object with which to update each document (i.e. the `updateData` object).
   * @param predicate - Optional. A function that returns a boolean indicating whether to update the current document. Takes the `QueryDocumentSnapshot` corresponding to the document as its first argument. If this is not provided, all documents will be updated.
   * @returns The number of batches and documents updated.
   */
  public update(
    getUpdateData: UpdateDataGetter<T>,
    predicate?: Predicate<T>
  ): Promise<UpdateResult>;

  /**
   * Updates all documents in this collection with the provided update data. Uses batch writes so
   * the entire batch will fail if a single update isn't successful. This method uses the `.traverse()`
   * method internally to traverse the entire collection.
   * @param updateData - The data with which to update each document. Must be a non-empty object.
   * @param predicate - Optional. A function that returns a boolean indicating whether to update the current document. Takes the `QueryDocumentSnapshot` corresponding to the document as its first argument. If this is not provided, all documents will be updated.
   * @returns The number of batches and documents updated.
   */
  public update(updateData: firestore.UpdateData, predicate?: Predicate<T>): Promise<UpdateResult>;

  /**
   * Updates all documents in this collection with the provided update data. Uses batch writes so
   * the entire batch will fail if a single update isn't successful. This method uses the `.traverse()`
   * method internally to traverse the entire collection.
   * @param field - The field to update in each document.
   * @param value - The value with which to update the specified field in each document. Must not be `undefined`.
   * @param predicate - Optional. A function that returns a boolean indicating whether to update the current document. Takes the `QueryDocumentSnapshot` corresponding to the document as its first argument. If this is not provided, all documents will be updated.
   * @returns The number of batches and documents updated.
   */
  public update(
    field: string | firestore.FieldPath,
    value: any,
    predicate?: Predicate<T>
  ): Promise<UpdateResult>;

  public async update(
    arg1: firestore.UpdateData | string | firestore.FieldPath | UpdateDataGetter<T>,
    arg2?: any,
    arg3?: Predicate<T>
  ): Promise<UpdateResult> {
    const argCount = [arg1, arg2, arg3].filter((a) => a !== undefined).length;
    const batch = this.col.firestore.batch();
    let updatedDocCount = 0;

    const { batchCount } = await this.traverse(async (snapshots) => {
      snapshots.forEach((snapshot) => {
        if (typeof arg1 === 'function') {
          // Signature 1
          const getUpdateData = arg1 as UpdateDataGetter<T>;
          const predicate = arg2 as Predicate<T> | undefined;
          const shouldUpdate = predicate?.(snapshot) ?? true;
          if (shouldUpdate) {
            batch.update(snapshot.ref, getUpdateData(snapshot));
            updatedDocCount++;
          }
        } else if (argCount < 2 || typeof arg2 === 'function') {
          // Signature 2
          const updateData = arg1 as firestore.UpdateData;
          const predicate = arg2 as Predicate<T> | undefined;
          const shouldUpdate = predicate?.(snapshot) ?? true;
          if (shouldUpdate) {
            batch.update(snapshot.ref, updateData);
            updatedDocCount++;
          }
        } else {
          // Signature 3
          const field = arg1 as string | firestore.FieldPath;
          const value = arg2 as any;
          const predicate = arg3 as Predicate<T> | undefined;
          const shouldUpdate = predicate?.(snapshot) ?? true;
          if (shouldUpdate) {
            batch.update(snapshot.ref, field, value);
            updatedDocCount++;
          }
        }
      });
    });

    await batch.commit();

    return { batchCount, updatedDocCount };
  }
}
