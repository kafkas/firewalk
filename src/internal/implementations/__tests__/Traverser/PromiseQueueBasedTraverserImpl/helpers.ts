import { TraverserImpl } from '../../../TraverserImpl';
import { describeTraverserMethodTest } from '../helpers';
import type { TraverserMethodTester } from '../config';

export function describeTraverserImplMethodTest(
  methodName: string,
  methodTester: TraverserMethodTester
): void {
  describeTraverserMethodTest(TraverserImpl, methodName, methodTester);
}
