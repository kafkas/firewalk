import type { firestore } from 'firebase-admin';
import type { TraversalConfig, Traverser } from '../../../../../src';

export type TraverserMethodTester = (
  traverser: Traverser<TestItemDoc>,
  colRef: firestore.CollectionReference<TestItemDoc>
) => void;

export interface TestItemDoc {
  number: number;
}

export const DEFAULT_TIMEOUT = 15_000;

export const DEFAULT_TRAVERSABLE_SIZE = 100;

export const TRAVERSAL_CONFIG: Partial<TraversalConfig> = {
  batchSize: 10,
};

export const INITIAL_DATA = Object.freeze<TestItemDoc>({
  number: 1,
});
