import type { firestore } from 'firebase-admin';
import { sleep } from './utils';

export interface TraversalConfig {
  /**
   * The number of documents that will be traversed in each batch. Defaults to 100.
   */
  batchSize: number;

  /**
   * Whether to sleep between batches. Defaults to `true`.
   */
  sleepBetweenBatches: boolean;

  /**
   * The amount of time (in ms) to "sleep" before moving on to the next batch. Defaults to 1000.
   */
  sleepTimeBetweenBatches: number;

  /**
   * The maximum number of documents that will be traversed. Defaults to `Infinity`.
   */
  maxDocCount: number;
}

export interface TraverseEachConfig {
  /**
   * Whether to sleep between moving on to the next doc. Defaults to `false`.
   */
  sleepBetweenDocs: boolean;

  /**
   * The amount of time (in ms) to "sleep" before moving on to the next doc. Defaults to 500.
   */
  sleepTimeBetweenDocs: number;
}

interface TraversalResult {
  /**
   * The number of batches that have been retrieved in this traversal.
   */
  batchCount: number;

  /**
   * The number of documents that have been retrieved in this traversal.
   */
  docCount: number;
}

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
    protected readonly collectionOrQuery: firestore.CollectionReference<T> | firestore.Query<T>,
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
    let query = this.collectionOrQuery.limit(Math.min(batchSize, maxDocCount));

    while (true) {
      const { docs: batchDocSnapshots } = await query.get();

      if (batchDocSnapshots.length === 0) {
        break;
      }

      batchCount++;
      docCount += batchDocSnapshots.length;

      await callback(batchDocSnapshots);

      const lastDocInBatch = batchDocSnapshots[batchDocSnapshots.length - 1];

      if (docCount === maxDocCount) {
        break;
      }

      query = query.startAfter(lastDocInBatch).limit(Math.min(maxDocCount - docCount, batchSize));

      if (sleepBetweenBatches) {
        await sleep(sleepTimeBetweenBatches);
      }
    }

    return { batchCount, docCount };
  }
}
