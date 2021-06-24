import type { firestore } from 'firebase-admin';
import type { Traverser } from './Traverser';
import type { FastTraversalConfig } from './types';

export interface FastTraverser<D = firestore.DocumentData> extends Traverser<D> {
  /**
   * Applies the specified traversal config values. Creates and returns a new traverser rather than
   * modify the existing instance.
   * @param config Partial traversal configuration.
   * @returns The newly created traverser.
   */
  withConfig(config: Partial<FastTraversalConfig>): FastTraverser<D>;
}
