import type { TraversalConfig } from '../../../../api';
import { BasicBatchMigratorImpl } from '../../../BasicBatchMigratorImpl';
import { describeMigratorMethodTest } from '../helpers';
import type { MigratorMethodTester } from '../config';

export function describeBasicBatchMigratorMethodTest<C extends TraversalConfig>(
  methodName: string,
  methodTester: MigratorMethodTester<C>
): void {
  describeMigratorMethodTest(BasicBatchMigratorImpl, methodName, methodTester);
}
