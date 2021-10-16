import type { firestore } from 'firebase-admin';
import { createTraverser, TraversalConfig } from '../../../../api';
import { BasicBatchMigratorImpl } from '../../../BasicBatchMigratorImpl';
import { TRAVERSAL_CONFIG } from '../config';

export function createBasicBatchMigratorImpl<D>(
  colRef: firestore.CollectionReference<D>
): BasicBatchMigratorImpl<TraversalConfig, D> {
  return new BasicBatchMigratorImpl(createTraverser(colRef, TRAVERSAL_CONFIG));
}
