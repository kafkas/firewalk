import { createTraverser } from '../../src';
import { app } from '../app';
import { runBasicTraverserTests } from './basic';

describe('SlowTraverser', () => {
  const itemsColRef = app().admin.firestore().collection('items');
  const traverser = createTraverser(itemsColRef, { batchSize: 5, maxDocCount: 25 });
  runBasicTraverserTests(traverser, itemsColRef, () => ({ number: Math.random() }));
});
