import type { firestore } from 'firebase-admin';

export type { SetOptions } from '@google-cloud/firestore';

export type MigrationPredicate<D> = (snapshot: firestore.QueryDocumentSnapshot<D>) => boolean;

export type SetDataGetter<D> = (snapshot: firestore.QueryDocumentSnapshot<D>) => D;

export type SetPartialDataGetter<D> = (snapshot: firestore.QueryDocumentSnapshot<D>) => Partial<D>;

export type UpdateDataGetter<D> = (
  snapshot: firestore.QueryDocumentSnapshot<D>
) => firestore.UpdateData;

/**
 * Represents an object that contains the details of a migration.
 */
export interface MigrationResult {
  /**
   * The number of batches that have been retrieved in this traversal.
   */
  readonly batchCount: number;

  /**
   * The number of documents that have been retrieved in this traversal.
   */
  readonly traversedDocCount: number;

  /**
   * The number of documents that have been migrated.
   */
  readonly migratedDocCount: number;
}
