import { createTraverser } from '../src';
import { app } from './app';
import { populateCollection } from './utils';

const itemsColRef = app().admin.firestore().collection('items');

async function initItemsCollection(): Promise<void> {
  await populateCollection(itemsColRef, () => ({ number: Math.random() }), 100);
}

async function clearItemsCollection(): Promise<void> {
  const itemsColRef = app().admin.firestore().collection('items');
  const { docs } = await itemsColRef.get();
  await Promise.all(docs.map((snap) => snap.ref.delete()));
}

beforeAll(async () => {
  await initItemsCollection();
});

afterAll(async () => {
  await clearItemsCollection();
});

test('slow traverser processes each document exactly once w/o external interference', async () => {
  const processCountMap: Record<string, number> = {};
  const traverser = createTraverser(itemsColRef, { batchSize: 5, maxDocCount: 25 });
  await traverser.traverse(async (snapshots) => {
    snapshots.forEach((snapshot) => {
      const itemId = snapshot.id;
      processCountMap[itemId] = (processCountMap[itemId] ?? 0) + 1;
    });
  });
  const isEachProcessCountEqualTo1 = Object.keys(processCountMap).every(
    (key) => processCountMap[key] === 1
  );
  expect(isEachProcessCountEqualTo1).toBe(true);
});
