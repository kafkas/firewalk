import type { firestore } from 'firebase-admin';
import type { BatchCallback } from '.';

/**
 * A function that takes batch doc snapshots and the 0-based batch index and returns a boolean
 * indicating whether to exit traversal early.
 */
export type ExitEarlyPredicate<
  AppModelType = firestore.DocumentData,
  DbModelType extends firestore.DocumentData = firestore.DocumentData
> = (...args: Parameters<BatchCallback<AppModelType, DbModelType>>) => boolean;
