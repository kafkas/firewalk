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

export class FastTraverser<T = firestore.DocumentData>
  extends BaseTraverser<T>
  implements Traverser<T> {
  public constructor(
    public readonly traversable: Traversable<T>,
    config?: Partial<FastTraversalConfig>
  ) {
    super(config);
    validateConfig(config);
    // TODO: Make sure we assign default values to config values that are not in base traverser config
  }

  public withConfig(c: Partial<FastTraversalConfig>): Traverser<T> {
    return new FastTraverser(this.traversable, { ...this.traversalConfig, ...c });
  }

  // TODO: Implement
  public async traverse(callback: BatchCallbackAsync<T>): Promise<TraversalResult> {
    return { batchCount: 0, docCount: 0 };
  }
}
