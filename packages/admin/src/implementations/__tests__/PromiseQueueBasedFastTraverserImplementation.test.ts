import { app } from '../../../__tests__/app';
import { PromiseQueueBasedFastTraverserImpl } from '../PromiseQueueBasedFastTraverserImpl';
import { runBasicTraverserTests } from './runBasicTraverserTests';

describe('PromiseQueueBasedFastTraverserImpl', () => {
  const colRef = app().admin.firestore().collection('PromiseQueueBasedFastTraverserImpl');
  const traverser = new PromiseQueueBasedFastTraverserImpl(colRef);
  runBasicTraverserTests(traverser, colRef, () => ({ number: Math.random() }));
});
