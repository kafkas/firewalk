import type { firestore } from 'firebase-admin';
import type { BatchCallback } from './BatchCallback';

/**
 * A function that takes batch doc snapshots and the 0-based batch index and returns a boolean
 * indicating whether to exit traversal early.
 */
export type ExitEarlyPredicate<D = firestore.DocumentData> = (
  ...args: Parameters<BatchCallback<D>>
) => boolean;
