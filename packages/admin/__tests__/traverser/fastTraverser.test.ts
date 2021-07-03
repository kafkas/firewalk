import { createFastTraverser } from '../../src';
import { app } from '../app';
import { runBasicTraverserTests } from './basic';

describe('FastTraverser', () => {
  const itemsColRef = app().admin.firestore().collection('items');
  const traverser = createFastTraverser(itemsColRef);
  runBasicTraverserTests(traverser, itemsColRef, () => ({ number: Math.random() }));
});
