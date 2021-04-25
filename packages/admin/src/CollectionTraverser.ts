import type { firestore } from 'firebase-admin';
import { sleep } from './utils';

export interface TraversalConfig {
  batchSize: number;
  sleepTimeBetweenBatches: number;
}

interface TraversalResult {
  batchCount: number;
  docCount: number;
}

export class CollectionTraverser<T = firestore.DocumentData> {
  private readonly config: TraversalConfig;

  public constructor(
    protected readonly collectionOrQuery: firestore.CollectionReference<T> | firestore.Query<T>,
    config: Partial<TraversalConfig> = {}
  ) {
    this.config = {
      batchSize: 100,
      sleepTimeBetweenBatches: 1000,
      ...config,
    };
  }

  /**
   * Traverses the entire collection in batches of size `TraversalConfig.batchSize`. Invokes the
   * specified callback for each document snapshot in each batch.
   * @returns The number of batches and documents retrieved.
   */
  public async traverseEach(
    callback: (snapshot: firestore.QueryDocumentSnapshot<T>) => Promise<void>
  ): Promise<TraversalResult> {
    const { batchCount, docCount } = await this.traverse(async (docSnapshots) => {
      for (let i = 0; i < docSnapshots.length; i++) {
        await callback(docSnapshots[i]);
      }
    });

    return { batchCount, docCount };
  }

  /**
   * Traverses the entire collection in batches of size `TraversalConfig.batchSize`. Invokes the
   * specified callback for each batch of document snapshots.
   * @returns The number of batches and documents retrieved.
   */
  public async traverse(
    callback: (batchSnapshots: firestore.QueryDocumentSnapshot<T>[]) => Promise<void>
  ): Promise<TraversalResult> {
    let batchCount = 0;
    let docCount = 0;
    let query = this.collectionOrQuery.limit(this.config.batchSize);

    while (true) {
      const { docs: batchDocSnapshots } = await query.get();

      if (batchDocSnapshots.length === 0) {
        break;
      }

      batchCount++;
      docCount += batchDocSnapshots.length;

      await callback(batchDocSnapshots);

      const lastDocInBatch = batchDocSnapshots[batchDocSnapshots.length - 1];
      query = query.startAfter(lastDocInBatch);

      await sleep(this.config.sleepTimeBetweenBatches);
    }

    return { batchCount, docCount };
  }
}
