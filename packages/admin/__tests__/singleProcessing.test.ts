import { createTraverser } from '../src';
import { app } from './app';

test('slow traverser processes each document exactly once w/o external interference', async () => {
  const itemsColRef = app().admin.firestore().collection('items');
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
