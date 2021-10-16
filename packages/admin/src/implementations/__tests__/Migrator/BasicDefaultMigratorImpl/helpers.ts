import type { TraversalConfig } from '../../../../api';
import { BasicDefaultMigratorImpl } from '../../../BasicDefaultMigratorImpl';
import { describeMigratorMethodTest } from '../helpers';
import type { MigratorMethodTester } from '../config';

export function describeBasicDefaultMigratorMethodTest<C extends TraversalConfig>(
  methodName: string,
  methodTester: MigratorMethodTester<C>
): void {
  describeMigratorMethodTest(BasicDefaultMigratorImpl, methodName, methodTester);
}
