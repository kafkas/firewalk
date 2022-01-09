import { firestore } from 'firebase-admin';
import type { TraversalConfig, Traverser } from '../../../../api';
import type { TestItemDoc } from '../config';
import { traversalTester } from '../helpers';

export function testWithExitEarlyPredicate(
  traverser: Traverser<TestItemDoc>,
  colRef: firestore.CollectionReference<TestItemDoc>
): void {
  traversalTester(colRef).test('exits early when instructed as such', async () => {
    const t = traverser
      .withConfig({ batchSize: 10 } as Partial<TraversalConfig>)
      .withExitEarlyPredicate((_, batchIndex) => batchIndex === 5);

    let processedBatchIndices: number[] = [];

    await t.traverse(async (_, batchIndex) => {
      processedBatchIndices.push(batchIndex);
    });

    expect(processedBatchIndices).toEqual([0, 1, 2, 3, 4, 5]);

    processedBatchIndices = [];

    await t
      .withExitEarlyPredicate((_, batchIndex) => batchIndex === 3)
      .traverse(async (_, batchIndex) => {
        processedBatchIndices.push(batchIndex);
      });

    expect(processedBatchIndices).toEqual([0, 1, 2, 3]);
  });
}
