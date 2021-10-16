import { BasicDefaultMigratorImpl } from '../../../BasicDefaultMigratorImpl';
import { describeMigratorMethodTest } from '../helpers';
import type { MigratorMethodTester } from '../config';

export function describeBasicDefaultMigratorMethodTest(
  methodName: string,
  methodTester: MigratorMethodTester
): void {
  describeMigratorMethodTest(BasicDefaultMigratorImpl, methodName, methodTester);
}
