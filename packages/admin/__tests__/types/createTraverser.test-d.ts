import { expectType } from 'tsd';
import { createTraverser, SlowTraverser } from '../../src';
import { collectionRef, D } from './_helpers';

const slowTraverser = createTraverser(collectionRef, { maxDocCount: 0 });

expectType<SlowTraverser<D>>(slowTraverser);
