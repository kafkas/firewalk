import { app } from '../../../__tests__/app';
import { BasicSlowTraverserImpl } from '../BasicSlowTraverserImpl';
import { runBasicTraverserTests } from './runBasicTraverserTests';

describe('BasicSlowTraverserImpl', () => {
  const itemsColRef = app().admin.firestore().collection('items');
  const traverser = new BasicSlowTraverserImpl(itemsColRef);
  runBasicTraverserTests(traverser, itemsColRef, () => ({ number: Math.random() }));
});
