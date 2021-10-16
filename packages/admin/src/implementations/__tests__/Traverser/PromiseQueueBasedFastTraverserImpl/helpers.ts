import { PromiseQueueBasedFastTraverserImpl } from '../../../PromiseQueueBasedFastTraverserImpl';
import { describeTraverserMethodTest } from '../helpers';
import type { TraverserMethodTester } from '../config';

export function describePromiseQueueBasedFastTraverserMethodTest(
  methodName: string,
  methodTester: TraverserMethodTester
): void {
  describeTraverserMethodTest(PromiseQueueBasedFastTraverserImpl, methodName, methodTester);
}
