import type { firestore } from 'firebase-admin';
import type { Traverser } from './Traverser';
import type { Traversable, FastTraversalConfig } from './types';

export interface FastTraverser<T extends Traversable<D>, D = firestore.DocumentData>
  extends Traverser<T, D> {
  /**
   * Applies the specified traversal config values. Creates and returns a new traverser rather than
   * modify the existing instance.
   * @param config Partial traversal configuration.
   * @returns The newly created traverser.
   */
  withConfig(config: Partial<FastTraversalConfig>): FastTraverser<T, D>;
}
