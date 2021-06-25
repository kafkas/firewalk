import type { firestore } from 'firebase-admin';
import type { Traverser } from '../Traverser';
import {
  Migrator,
  MigrationPredicate,
  UpdateDataGetter,
  SetData,
  SetOptions,
  SetDataGetter,
} from '../Migrator';
import type { Traversable, BaseTraversalConfig, MigrationResult } from '../types';
import { validateConfig } from './validateConfig';

export class BatchMigrator<
  D extends firestore.DocumentData,
  T extends Traversable<D>,
  C extends BaseTraversalConfig,
  TR extends Traverser<D, T, C>
> extends Migrator<D, T, C> {
  public constructor(public readonly traverser: TR) {
    super();
    validateConfig(traverser.traversalConfig);
  }

  public async set<M extends boolean | undefined>(
    dataOrGetData: SetData<D, M> | SetDataGetter<D, M>,
    options?: SetOptions<M>,
    predicate?: MigrationPredicate<D>
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
              const getData = dataOrGetData as SetDataGetter<D, M>;
              return getData(snapshot);
            } else {
              // Signature 2
              return dataOrGetData as SetData<D, M>;
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
    arg1: firestore.UpdateData | string | firestore.FieldPath | UpdateDataGetter<D>,
    arg2?: any,
    arg3?: MigrationPredicate<D>
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
            const getUpdateData = arg1 as UpdateDataGetter<D>;
            const predicate = arg2 as MigrationPredicate<D> | undefined;
            const shouldMigrate = predicate?.(snapshot) ?? true;
            if (shouldMigrate) {
              writeBatch.update(snapshot.ref, getUpdateData(snapshot));
              migratableDocCount++;
            }
          } else if (argCount < 2 || typeof arg2 === 'function') {
            // Signature 2
            const updateData = arg1 as firestore.UpdateData;
            const predicate = arg2 as MigrationPredicate<D> | undefined;
            const shouldMigrate = predicate?.(snapshot) ?? true;
            if (shouldMigrate) {
              writeBatch.update(snapshot.ref, updateData);
              migratableDocCount++;
            }
          } else {
            // Signature 3
            const field = arg1 as string | firestore.FieldPath;
            const value = arg2 as any;
            const predicate = arg3 as MigrationPredicate<D> | undefined;
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
