import { BasicSlowTraverserImpl } from '../../../BasicSlowTraverserImpl';
import { describeTraverserMethodTest } from '../helpers';
import type { TraverserMethodTester } from '../config';

export function describeBasicSlowTraverserMethodTest(
  methodName: string,
  methodTester: TraverserMethodTester
): void {
  describeTraverserMethodTest(BasicSlowTraverserImpl, methodName, methodTester);
}
