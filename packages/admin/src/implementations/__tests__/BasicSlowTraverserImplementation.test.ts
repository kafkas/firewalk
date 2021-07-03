import { app } from '../../../__tests__/app';
import { BasicSlowTraverserImplementation } from '../BasicSlowTraverserImplementation';
import { runBasicTraverserTests } from './runBasicTraverserTests';

describe('BasicSlowTraverserImplementation', () => {
  const itemsColRef = app().admin.firestore().collection('items');
  const traverser = new BasicSlowTraverserImplementation(itemsColRef);
  runBasicTraverserTests(traverser, itemsColRef, () => ({ number: Math.random() }));
});
