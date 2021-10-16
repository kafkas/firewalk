import type { firestore } from 'firebase-admin';
import { createTraverser, TraversalConfig } from '../../../../api';
import { BasicDefaultMigratorImpl } from '../../../BasicDefaultMigratorImpl';
import { TRAVERSAL_CONFIG } from '../config';

export function createBasicDefaultMigratorImpl<D>(
  colRef: firestore.CollectionReference<D>
): BasicDefaultMigratorImpl<TraversalConfig, D> {
  return new BasicDefaultMigratorImpl(createTraverser(colRef, TRAVERSAL_CONFIG));
}
