import { app } from '../../../__tests__/app';
import { BasicSlowTraverserImpl } from '../BasicSlowTraverserImpl';
import { runBasicTraverserTests } from './runBasicTraverserTests';

describe('BasicSlowTraverserImpl', () => {
  const colRef = app().admin.firestore().collection('BasicSlowTraverserImpl');
  const traverser = new BasicSlowTraverserImpl(colRef);
  runBasicTraverserTests(traverser, colRef, () => ({ number: Math.random() }));
});
