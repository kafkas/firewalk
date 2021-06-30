import { firestore } from 'firebase-admin';
import { createTraverser, Traverser, TraversalConfig } from '../src';
import { app } from './app';

async function testTraverser(
  traverser: Traverser<firestore.DocumentData, TraversalConfig>
): Promise<void> {
  const processingCountMap: Record<string, number> = {};

  await traverser.traverse(async (snapshots) => {
    snapshots.forEach((snapshot) => {
      const itemId = snapshot.id;
      processingCountMap[itemId] = (processingCountMap[itemId] ?? 0) + 1;
    });
  });

  // TODO: Assert that the value of each key in `processingCountMap` equals 1
}

async function main(): Promise<void> {
  const itemsColRef = app().admin.firestore().collection('items');
  const traverser = createTraverser(itemsColRef, { batchSize: 10, maxDocCount: 100 });

  // Run a simple test without external interference
  await testTraverser(traverser);
}

main();
