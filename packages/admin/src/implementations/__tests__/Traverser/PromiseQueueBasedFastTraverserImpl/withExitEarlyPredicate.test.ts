import { testWithExitEarlyPredicate } from '../shared/withExitEarlyPredicate';
import { describePromiseQueueBasedFastTraverserMethodTest } from './helpers';

describePromiseQueueBasedFastTraverserMethodTest(
  'withExitEarlyPredicate',
  testWithExitEarlyPredicate
);
