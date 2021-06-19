import type { firestore } from 'firebase-admin';
import type { Traversable, TraversalConfig, TraverseEachConfig, TraversalResult } from './types';
import { sleep } from './utils';

/**
 * An object that facilitates Firestore collection traversals.
 */
export class CollectionTraverser<T = firestore.DocumentData> {
  private static defaultConfig: TraversalConfig = {
    batchSize: 100,
    sleepBetweenBatches: true,
    sleepTimeBetweenBatches: 1_000,
    maxDocCount: Infinity,
  };

  private static defaultTraverseEachConfig: TraverseEachConfig = {
    sleepBetweenDocs: false,
    sleepTimeBetweenDocs: 500,
  };

  private readonly config: TraversalConfig;

  public constructor(
    protected readonly traversable: Traversable<T>,
    config: Partial<TraversalConfig> = {}
  ) {
    this.config = { ...CollectionTraverser.defaultConfig, ...config };
  }

  /**
   * Traverses the entire collection in batches of size `TraversalConfig.batchSize`. Invokes the
   * specified callback for each document snapshot in each batch.
   * @returns The number of batches and documents retrieved.
   */
  public async traverseEach(
    callback: (snapshot: firestore.QueryDocumentSnapshot<T>) => Promise<void>,
    config: Partial<TraverseEachConfig> = {}
  ): Promise<TraversalResult> {
    const { sleepBetweenDocs, sleepTimeBetweenDocs } = {
      ...CollectionTraverser.defaultTraverseEachConfig,
      ...config,
    };

    const { batchCount, docCount } = await this.traverse(async (docSnapshots) => {
      for (let i = 0; i < docSnapshots.length; i++) {
        await callback(docSnapshots[i]);
        if (sleepBetweenDocs) {
          await sleep(sleepTimeBetweenDocs);
        }
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
    const { batchSize, sleepBetweenBatches, sleepTimeBetweenBatches, maxDocCount } = this.config;

    let batchCount = 0;
    let docCount = 0;
    let query = this.traversable.limit(Math.min(batchSize, maxDocCount));

    while (true) {
      const { docs: batchDocSnapshots } = await query.get();

      if (batchDocSnapshots.length === 0) {
        break;
      }

      batchCount++;
      docCount += batchDocSnapshots.length;

      await callback(batchDocSnapshots);

      if (docCount === maxDocCount) {
        break;
      }

      const lastDocInBatch = batchDocSnapshots[batchDocSnapshots.length - 1];
      query = query.startAfter(lastDocInBatch).limit(Math.min(maxDocCount - docCount, batchSize));

      if (sleepBetweenBatches) {
        await sleep(sleepTimeBetweenBatches);
      }
    }

    return { batchCount, docCount };
  }
}
