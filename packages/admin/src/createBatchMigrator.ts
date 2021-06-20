import type { firestore } from 'firebase-admin';
import type {
  CollectionMigrator,
  MigrationPredicate,
  UpdateDataGetter,
  SetData,
  SetOptions,
  SetDataGetter,
} from './CollectionMigrator';
import type { Traversable, TraversalConfig, MigrationResult } from './types';
import { createTraverser } from './createTraverser';
import { isPositiveInteger } from './_utils';

const MAX_BATCH_WRITE_DOC_COUNT = 500;

function validateBatchMigratorTraversalConfig(c: Partial<TraversalConfig> = {}): void {
  const { batchSize } = c;

  if (
    typeof batchSize === 'number' &&
    (!isPositiveInteger(batchSize) || batchSize > MAX_BATCH_WRITE_DOC_COUNT)
  ) {
    throw new Error(
      `The 'batchSize' field in traversal config for a batch migrator must be a positive integer less than or equal to ${MAX_BATCH_WRITE_DOC_COUNT}. In Firestore, each transaction or write batch can write to a maximum of ${MAX_BATCH_WRITE_DOC_COUNT} documents.`
    );
  }
}

/**
 * Creates a migrator object that facilitates Firestore collection migrations. Uses batch writes when writing
 * to documents so the entire operation will fail if a single write isn't successful. Uses a traverser object
 * internally to traverse the entire collection.
 */
export function createBatchMigrator<T = firestore.DocumentData>(
  traversable: Traversable<T>,
  traversalConfig?: Partial<TraversalConfig>
): CollectionMigrator<T> {
  validateBatchMigratorTraversalConfig(traversalConfig);

  class CollectionBatchMigrator implements CollectionMigrator<T> {
    private traverser = createTraverser(traversable, traversalConfig);

    public setConfig(c: Partial<TraversalConfig>): CollectionMigrator<T> {
      validateBatchMigratorTraversalConfig(c);
      this.traverser.setConfig(c);
      return this;
    }

    public async set<M extends boolean | undefined>(
      dataOrGetData: SetData<T, M> | SetDataGetter<T, M>,
      options?: SetOptions<M>,
      predicate?: MigrationPredicate<T>
    ): Promise<MigrationResult> {
      let migratedDocCount = 0;

      const { batchCount, docCount: traversedDocCount } = await this.traverser.traverse(
        async (snapshots) => {
          const writeBatch = traversable.firestore.batch();
          let migratableDocCount = 0;

          snapshots.forEach((snapshot) => {
            const data = (() => {
              if (typeof dataOrGetData === 'function') {
                // Signature 1
                const getData = dataOrGetData as SetDataGetter<T, M>;
                return getData(snapshot);
              } else {
                // Signature 2
                return dataOrGetData as SetData<T, M>;
              }
            })();

            const shouldMigrate = predicate?.(snapshot) ?? true;

            if (shouldMigrate) {
              writeBatch.set(snapshot.ref, data, options as any);
              migratableDocCount++;
            }
          });

          await writeBatch.commit();
          migratedDocCount += migratableDocCount;
        }
      );

      return { batchCount, traversedDocCount, migratedDocCount };
    }

    public async update(
      arg1: firestore.UpdateData | string | firestore.FieldPath | UpdateDataGetter<T>,
      arg2?: any,
      arg3?: MigrationPredicate<T>
    ): Promise<MigrationResult> {
      const argCount = [arg1, arg2, arg3].filter((a) => a !== undefined).length;
      let migratedDocCount = 0;

      const { batchCount, docCount: traversedDocCount } = await this.traverser.traverse(
        async (snapshots) => {
          const writeBatch = traversable.firestore.batch();
          let migratableDocCount = 0;

          snapshots.forEach((snapshot) => {
            if (typeof arg1 === 'function') {
              // Signature 1
              const getUpdateData = arg1 as UpdateDataGetter<T>;
              const predicate = arg2 as MigrationPredicate<T> | undefined;
              const shouldMigrate = predicate?.(snapshot) ?? true;
              if (shouldMigrate) {
                writeBatch.update(snapshot.ref, getUpdateData(snapshot));
                migratableDocCount++;
              }
            } else if (argCount < 2 || typeof arg2 === 'function') {
              // Signature 2
              const updateData = arg1 as firestore.UpdateData;
              const predicate = arg2 as MigrationPredicate<T> | undefined;
              const shouldMigrate = predicate?.(snapshot) ?? true;
              if (shouldMigrate) {
                writeBatch.update(snapshot.ref, updateData);
                migratableDocCount++;
              }
            } else {
              // Signature 3
              const field = arg1 as string | firestore.FieldPath;
              const value = arg2 as any;
              const predicate = arg3 as MigrationPredicate<T> | undefined;
              const shouldMigrate = predicate?.(snapshot) ?? true;
              if (shouldMigrate) {
                writeBatch.update(snapshot.ref, field, value);
                migratableDocCount++;
              }
            }
          });

          await writeBatch.commit();
          migratedDocCount += migratableDocCount;
        }
      );

      return { batchCount, traversedDocCount, migratedDocCount };
    }
  }

  return new CollectionBatchMigrator();
}
