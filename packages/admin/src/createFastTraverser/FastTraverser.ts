import type { firestore } from 'firebase-admin';
import { BaseTraverser } from '../BaseTraverser';
import type { Traverser } from '../Traverser';
import type {
  Traversable,
  FastTraversalConfig,
  TraversalResult,
  BatchCallbackAsync,
} from '../types';
import { validateConfig } from './validateConfig';

const defaultTraversalConfig: FastTraversalConfig = {
  ...BaseTraverser.getDefaultConfig(),
  maxInMemoryBatchCount: 10,
};

export class FastTraverser<T = firestore.DocumentData>
  extends BaseTraverser<FastTraversalConfig, T>
  implements Traverser<T> {
  public constructor(
    public readonly traversable: Traversable<T>,
    config?: Partial<FastTraversalConfig>
  ) {
    super({ ...defaultTraversalConfig, ...config });
    validateConfig(config);
  }

  public withConfig(c: Partial<FastTraversalConfig>): Traverser<T> {
    return new FastTraverser(this.traversable, { ...this.traversalConfig, ...c });
  }

  // TODO: Implement
  public async traverse(callback: BatchCallbackAsync<T>): Promise<TraversalResult> {
    return { batchCount: 0, docCount: 0 };
  }
}
