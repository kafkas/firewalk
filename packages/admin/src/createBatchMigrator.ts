import type { firestore } from 'firebase-admin';
import type { Traverser } from './Traverser';
import type {
  Migrator,
  MigrationPredicate,
  UpdateDataGetter,
  SetData,
  SetOptions,
  SetDataGetter,
} from './Migrator';
import type { Traversable, BaseTraversalConfig, MigrationResult, BatchCallback } from './types';
import { createTraverser } from './createTraverser';
import { isPositiveInteger, isTraverser } from './_utils';

const MAX_BATCH_WRITE_DOC_COUNT = 500;

function validateBatchMigratorTraversalConfig(c: Partial<BaseTraversalConfig> = {}): void {
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

export function createBatchMigrator<T = firestore.DocumentData>(
  traverser: Traverser<T>
): Migrator<T>;

export function createBatchMigrator<T = firestore.DocumentData>(
  traversable: Traversable<T>,
  traversalConfig?: Partial<BaseTraversalConfig>
): Migrator<T>;

/**
 * Creates a batch migrator object that facilitates Firestore collection migrations. This migrator uses batch
 * writes when writing to docs so the entire operation will fail if a single write isn't successful.
 */
export function createBatchMigrator<T = firestore.DocumentData>(
  traversableOrTraverser: Traverser<T> | Traversable<T>,
  traversalConfig?: Partial<BaseTraversalConfig>
): Migrator<T> {
  validateBatchMigratorTraversalConfig(traversalConfig);

  class BatchMigrator implements Migrator<T> {
    public readonly traverser = isTraverser(traversableOrTraverser)
      ? traversableOrTraverser
      : createTraverser(traversableOrTraverser, traversalConfig);

    public onBeforeBatchStart(callback: BatchCallback<T>): void {
      this.traverser.onBeforeBatchStart(callback);
    }

    public onAfterBatchComplete(callback: BatchCallback<T>): void {
      this.traverser.onAfterBatchComplete(callback);
    }

    public async set<M extends boolean | undefined>(
      dataOrGetData: SetData<T, M> | SetDataGetter<T, M>,
      options?: SetOptions<M>,
      predicate?: MigrationPredicate<T>
    ): Promise<MigrationResult> {
      let migratedDocCount = 0;

      const { batchCount, docCount: traversedDocCount } = await this.traverser.traverse(
        async (snapshots) => {
          const writeBatch = this.traverser.traversable.firestore.batch();
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
          const writeBatch = this.traverser.traversable.firestore.batch();
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

  return new BatchMigrator();
}
