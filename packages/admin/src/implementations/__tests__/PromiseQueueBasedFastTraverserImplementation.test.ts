import { app } from '../../../__tests__/app';
import { PromiseQueueBasedFastTraverserImpl } from '../PromiseQueueBasedFastTraverserImpl';
import { runBasicTraverserTests } from './runBasicTraverserTests';

describe('PromiseQueueBasedFastTraverserImpl', () => {
  const itemsColRef = app().admin.firestore().collection('items');
  const traverser = new PromiseQueueBasedFastTraverserImpl(itemsColRef);
  runBasicTraverserTests(traverser, itemsColRef, () => ({ number: Math.random() }));
});
