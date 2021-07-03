import { app } from '../../../__tests__/app';
import { PromiseQueueBasedFastTraverserImplementation } from '../PromiseQueueBasedFastTraverserImplementation';
import { runBasicTraverserTests } from './runBasicTraverserTests';

describe('PromiseQueueBasedFastTraverserImplementation', () => {
  const itemsColRef = app().admin.firestore().collection('items');
  const traverser = new PromiseQueueBasedFastTraverserImplementation(itemsColRef);
  runBasicTraverserTests(traverser, itemsColRef, () => ({ number: Math.random() }));
});
