import { app } from '../../../../../../__tests__/app';
import { collectionPopulator } from '../../../../../../__tests__/utils';
import { TraverserImpl } from '../../../TraverserImpl';
import { DEFAULT_TIMEOUT } from '../config';

const COLLECTION_PATH = 'TraverserImpl.concurrency';
const INITIAL_DATA = Object.freeze({ number: 1 });
const firestore = app().firestore;
let testCollectionIndex = 0;

async function withPopulatedCollection(
  totalDocs: number,
  runTest: (
    colRef: FirebaseFirestore.CollectionReference,
    docRefs: FirebaseFirestore.DocumentReference[]
  ) => Promise<void>
): Promise<void> {
  const colRef = firestore.collection(`${COLLECTION_PATH}.${testCollectionIndex++}`);
  const docRefs = await collectionPopulator(colRef).withData(INITIAL_DATA).populate({
    count: totalDocs,
  });

  try {
    await runTest(colRef, docRefs);
  } finally {
    await Promise.all(docRefs.map((docRef) => docRef.delete()));
  }
}

describe('TraverserImpl concurrency', () => {
  test(
    'limits concurrent callbacks to maxConcurrentBatchCount',
    async () => {
      const totalDocs = 50;
      const batchSize = 10;
      const maxConcurrentBatchCount = 2;

      await withPopulatedCollection(totalDocs, async (colRef) => {
        const traverser = new TraverserImpl(colRef, [], {
          batchSize,
          maxConcurrentBatchCount,
          sleepTimeBetweenBatches: 0,
          maxDocCount: Infinity,
          maxBatchRetryCount: 0,
          sleepTimeBetweenTrials: 0,
        });

        let activeCalls = 0;
        let maxActiveCalls = 0;
        const processedBatches: number[] = [];

        await traverser.traverse(async (_batchDocs, batchIndex) => {
          activeCalls++;
          maxActiveCalls = Math.max(maxActiveCalls, activeCalls);
          processedBatches.push(batchIndex);
          await new Promise((resolve) => setTimeout(resolve, 50));
          activeCalls--;
        });

        expect(maxActiveCalls).toBeLessThanOrEqual(maxConcurrentBatchCount);
        expect(processedBatches).toHaveLength(totalDocs / batchSize);
      });
    },
    DEFAULT_TIMEOUT
  );

  test(
    'processes all batches when maxConcurrentBatchCount is 1 (sequential)',
    async () => {
      const totalDocs = 30;
      const batchSize = 10;

      await withPopulatedCollection(totalDocs, async (colRef) => {
        const traverser = new TraverserImpl(colRef, [], {
          batchSize,
          maxConcurrentBatchCount: 1,
          sleepTimeBetweenBatches: 0,
          maxDocCount: Infinity,
          maxBatchRetryCount: 0,
          sleepTimeBetweenTrials: 0,
        });

        let activeCalls = 0;
        let maxActiveCalls = 0;
        const processedBatches: number[] = [];

        await traverser.traverse(async (_batchDocs, batchIndex) => {
          activeCalls++;
          maxActiveCalls = Math.max(maxActiveCalls, activeCalls);
          processedBatches.push(batchIndex);
          await new Promise((resolve) => setTimeout(resolve, 10));
          activeCalls--;
        });

        expect(maxActiveCalls).toBe(1);
        expect(processedBatches).toEqual([0, 1, 2]);
      });
    },
    DEFAULT_TIMEOUT
  );

  test(
    'higher concurrency processes all documents exactly once',
    async () => {
      const totalDocs = 40;
      const batchSize = 10;
      const maxConcurrentBatchCount = 4;

      await withPopulatedCollection(totalDocs, async (colRef, docRefs) => {
        const traverser = new TraverserImpl(colRef, [], {
          batchSize,
          maxConcurrentBatchCount,
          sleepTimeBetweenBatches: 0,
          maxDocCount: Infinity,
          maxBatchRetryCount: 0,
          sleepTimeBetweenTrials: 0,
        });

        const processedDocIds: string[] = [];

        await traverser.traverse(async (batchDocs) => {
          await new Promise((resolve) => setTimeout(resolve, 20));
          batchDocs.forEach((doc) => {
            processedDocIds.push(doc.id);
          });
        });

        const expectedIds = docRefs.map((docRef) => docRef.id);
        expect(processedDocIds.sort()).toEqual(expectedIds.sort());
      });
    },
    DEFAULT_TIMEOUT
  );

  test(
    'returns correct traversal result with concurrency',
    async () => {
      const totalDocs = 30;
      const batchSize = 10;

      await withPopulatedCollection(totalDocs, async (colRef) => {
        const traverser = new TraverserImpl(colRef, [], {
          batchSize,
          maxConcurrentBatchCount: 3,
          sleepTimeBetweenBatches: 0,
          maxDocCount: Infinity,
          maxBatchRetryCount: 0,
          sleepTimeBetweenTrials: 0,
        });

        const result = await traverser.traverse(async () => {
          await new Promise((resolve) => setTimeout(resolve, 10));
        });

        expect(result.docCount).toBe(totalDocs);
      });
    },
    DEFAULT_TIMEOUT
  );
});
