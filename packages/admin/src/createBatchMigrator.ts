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

/**
 * Creates a migrator object that facilitates Firestore collection migrations. Uses batch writes when writing
 * to documents so the entire operation will fail if a single write isn't successful. Uses a traverser object
 * internally to traverse the entire collection.
 */
export function createBatchMigrator<T = firestore.DocumentData>(
  traversable: Traversable<T>,
  traversalConfig?: Partial<TraversalConfig>
): CollectionMigrator<T> {
  class CollectionBatchMigrator implements CollectionMigrator<T> {
    private traverser = createTraverser(traversable, traversalConfig);

    public setConfig(c: Partial<TraversalConfig>): CollectionMigrator<T> {
      this.traverser.setConfig(c);
      return this;
    }

    public async set<M extends boolean | undefined>(
      dataOrGetData: SetData<T, M> | SetDataGetter<T, M>,
      options?: SetOptions<M>,
      predicate?: MigrationPredicate<T>
    ): Promise<MigrationResult> {
      const batch = traversable.firestore.batch();
      let migratedDocCount = 0;

      const { batchCount, docCount: traversedDocCount } = await this.traverser.traverse(
        async (snapshots) => {
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
              batch.set(snapshot.ref, data, options as any);
              migratedDocCount++;
            }
          });
        }
      );

      await batch.commit();

      return { batchCount, traversedDocCount, migratedDocCount };
    }

    public async update(
      arg1: firestore.UpdateData | string | firestore.FieldPath | UpdateDataGetter<T>,
      arg2?: any,
      arg3?: MigrationPredicate<T>
    ): Promise<MigrationResult> {
      const argCount = [arg1, arg2, arg3].filter((a) => a !== undefined).length;
      const batch = traversable.firestore.batch();
      let migratedDocCount = 0;

      const { batchCount, docCount: traversedDocCount } = await this.traverser.traverse(
        async (snapshots) => {
          snapshots.forEach((snapshot) => {
            if (typeof arg1 === 'function') {
              // Signature 1
              const getUpdateData = arg1 as UpdateDataGetter<T>;
              const predicate = arg2 as MigrationPredicate<T> | undefined;
              const shouldUpdate = predicate?.(snapshot) ?? true;
              if (shouldUpdate) {
                batch.update(snapshot.ref, getUpdateData(snapshot));
                migratedDocCount++;
              }
            } else if (argCount < 2 || typeof arg2 === 'function') {
              // Signature 2
              const updateData = arg1 as firestore.UpdateData;
              const predicate = arg2 as MigrationPredicate<T> | undefined;
              const shouldUpdate = predicate?.(snapshot) ?? true;
              if (shouldUpdate) {
                batch.update(snapshot.ref, updateData);
                migratedDocCount++;
              }
            } else {
              // Signature 3
              const field = arg1 as string | firestore.FieldPath;
              const value = arg2 as any;
              const predicate = arg3 as MigrationPredicate<T> | undefined;
              const shouldUpdate = predicate?.(snapshot) ?? true;
              if (shouldUpdate) {
                batch.update(snapshot.ref, field, value);
                migratedDocCount++;
              }
            }
          });
        }
      );

      await batch.commit();

      return { batchCount, traversedDocCount, migratedDocCount };
    }
  }

  return new CollectionBatchMigrator();
}
