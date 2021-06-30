import type { firestore } from 'firebase-admin';

export async function populateCollection<D extends firestore.DocumentData>(
  collectionRef: firestore.CollectionReference<D>,
  data: D,
  docCount: number
): Promise<void> {
  const batchSize = 100;
  let count = 0;

  while (count < docCount) {
    const newDocCount = Math.min(batchSize, docCount - count);
    const promises = new Array(newDocCount).fill(null).map(async () => {
      await collectionRef.add(data);
    });
    await Promise.all(promises);
    count += newDocCount;
  }
}
