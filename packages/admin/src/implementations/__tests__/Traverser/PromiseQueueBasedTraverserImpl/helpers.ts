import { PromiseQueueBasedTraverserImpl } from '../../../PromiseQueueBasedTraverserImpl';
import { describeTraverserMethodTest } from '../helpers';
import type { TraverserMethodTester } from '../config';

export function describePromiseQueueBasedTraverserMethodTest(
  methodName: string,
  methodTester: TraverserMethodTester
): void {
  describeTraverserMethodTest(PromiseQueueBasedTraverserImpl, methodName, methodTester);
}
