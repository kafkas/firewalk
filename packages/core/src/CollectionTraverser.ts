import type { firestore } from 'firebase-admin';
import { sleep } from './utils';

export type TraversalConfig = {
  batchSize: number;
  sleepTimeBetweenBatches: number;
};

export class CollectionTraverser<T = firestore.DocumentData> {
  private readonly config: TraversalConfig;

  public constructor(
    private readonly collectionOrQuery: firestore.CollectionReference<T> | firestore.Query<T>,
    config: Partial<TraversalConfig> = {}
  ) {
    this.config = {
      batchSize: 100,
      sleepTimeBetweenBatches: 1000,
      ...config,
    };
  }

  /**
   * Updates all docs in this collection. Uses batch updates.
   */
  public async update(
    updateData: (snapshot: firestore.QueryDocumentSnapshot<T>) => firestore.UpdateData,
    condition: (snapshot: firestore.QueryDocumentSnapshot<T>) => boolean = () => true
  ) {
    const writeBatch = this.collectionOrQuery.firestore.batch();

    const { batchCount, docCount: updatedDocCount } = await this.traverseInBatches(
      async (snapshots) => {
        const batchDocCount = snapshots.length;

        console.log(
          `Retrieved ${batchDocCount} documents in this batch. Proceeding to update them.`
        );

        snapshots.forEach((snapshot) => {
          if (condition(snapshot)) {
            writeBatch.update(snapshot.ref, updateData(snapshot));
          }
        });
      }
    );

    await writeBatch.commit();

    return { batchCount, updatedDocCount };
  }

  /**
   * A slower method.
   */
  public async traverseSequentially(
    callback: (snapshot: firestore.QueryDocumentSnapshot<T>) => Promise<void>
  ) {
    const { batchCount, docCount } = await this.traverseInBatches(async (docSnapshots) => {
      for (let i = 0; i < docSnapshots.length; i++) {
        const snapshot = docSnapshots[i];
        await callback(snapshot);
      }
    });

    return { batchCount, docCount };
  }

  public async traverseInBatches(
    callback: (batchSnapshots: firestore.QueryDocumentSnapshot<T>[]) => Promise<void>
  ) {
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
