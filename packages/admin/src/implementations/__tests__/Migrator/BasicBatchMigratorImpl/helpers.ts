import { BasicBatchMigratorImpl } from '../../../BasicBatchMigratorImpl';
import { describeMigratorMethodTest } from '../helpers';
import type { MigratorMethodTester } from '../config';

export function describeBasicBatchMigratorMethodTest(
  methodName: string,
  methodTester: MigratorMethodTester
): void {
  describeMigratorMethodTest(BasicBatchMigratorImpl, methodName, methodTester);
}
