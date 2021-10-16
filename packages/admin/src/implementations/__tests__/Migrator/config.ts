import { firestore } from 'firebase-admin';
import type { TraversalConfig, Migrator } from '../../../../src';

export type MigratorMethodTester<C extends TraversalConfig> = (
  migrator: Migrator<C, TestItemDoc>,
  colRef: firestore.CollectionReference<TestItemDoc>
) => void;

export interface TestItemDoc {
  map1: {
    num1?: number;
    num2?: number;
    string1?: string;
  };
  num2: number;
  string2: string;
  string3: string;
  timestamp1?: firestore.Timestamp;
  timestamp2?: firestore.Timestamp;
}

export const DEFAULT_TIMEOUT = 15_000;

export const DEFAULT_TRAVERSABLE_SIZE = 40;

export const TRAVERSAL_CONFIG: Partial<TraversalConfig> = {
  batchSize: 10,
};

export const INITIAL_DATA = Object.freeze<TestItemDoc>({
  map1: {
    num1: 1,
    string1: 'abc',
  },
  num2: 2,
  string2: 'abc',
  string3: 'abc',
  timestamp1: firestore.Timestamp.fromDate(new Date()),
});
