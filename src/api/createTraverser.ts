import type { firestore } from 'firebase-admin';
import { PromiseQueueBasedTraverserImpl } from '../internal/implementations';
import type { InvalidConfigError } from '../errors'; /* eslint-disable-line */
import type { Traversable, TraversalConfig, Traverser } from './interfaces';

/**
 * Creates an object which can be used to traverse a Firestore collection or, more generally,
 * a {@link Traversable}.
 *
 * @remarks
 *
 * For each batch of document snapshots in the traversable, this traverser invokes a specified
 * async callback and immediately moves to the next batch. It does not wait for the callback
 * Promise to resolve before moving to the next batch. That is, when `maxConcurrentBatchCount` > 1,
 * there is no guarantee that any given batch will finish processing before a later batch.
 *
 * The traverser becomes faster as you increase `maxConcurrentBatchCount`, but this will consume
 * more memory. You should increase concurrency when you want to trade some memory for speed.
 *
 * @param traversable - A collection-like group of documents. Can be one of [CollectionReference](https://googleapis.dev/nodejs/firestore/latest/CollectionReference.html), [CollectionGroup](https://googleapis.dev/nodejs/firestore/latest/CollectionGroup.html) and [Query](https://googleapis.dev/nodejs/firestore/latest/Query.html).
 * @param config - Optional. The traversal configuration with which the traverser will be created.
 * @returns A new {@link Traverser} object.
 * @throws {@link InvalidConfigError} Thrown if the specified `config` is invalid.
 */
export function createTraverser<
  AppModelType = firestore.DocumentData,
  DbModelType extends firestore.DocumentData = firestore.DocumentData,
>(
  traversable: Traversable<AppModelType, DbModelType>,
  config?: Partial<TraversalConfig>
): Traverser<AppModelType, DbModelType> {
  return new PromiseQueueBasedTraverserImpl(traversable, [], config);
}
