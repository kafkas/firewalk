import { firestore } from 'firebase-admin';
import type { Migrator, TraversalConfig } from '../../../../../src';

export type MigratorMethodTester = (
  migrator: Migrator<TestItemDoc>,
  colRef: firestore.CollectionReference<TestItemDoc>
) => void;

export interface TestItemDoc {
  docId?: string;
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

export const DEFAULT_TIMEOUT = 60_000;

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
