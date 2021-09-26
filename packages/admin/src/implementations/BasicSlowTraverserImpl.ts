import type {
  BatchCallbackAsync,
  ExitEarlyPredicate,
  SlowTraverser,
  Traversable,
  TraversalConfig,
  TraversalResult,
} from '../api';
import { AbstractTraverser } from './abstract';

export class BasicSlowTraverserImpl<D>
  extends AbstractTraverser<TraversalConfig, D>
  implements SlowTraverser<D> {
  private static readonly defaultConfig: TraversalConfig = {
    ...AbstractTraverser.baseConfig,
  };

  public constructor(
    public readonly traversable: Traversable<D>,
    exitEarlyPredicates: ExitEarlyPredicate<D>[] = [],
    config?: Partial<TraversalConfig>
  ) {
    super({ ...BasicSlowTraverserImpl.defaultConfig, ...config }, exitEarlyPredicates);
  }

  // eslint-disable-next-line
  private validateConfig(config: Partial<TraversalConfig> = {}): void {}

  public withConfig(config: Partial<TraversalConfig>): SlowTraverser<D> {
    return new BasicSlowTraverserImpl(this.traversable, this.exitEarlyPredicates, {
      ...this.traversalConfig,
      ...config,
    });
  }

  public withExitEarlyPredicate(predicate: ExitEarlyPredicate<D>): SlowTraverser<D> {
    return new BasicSlowTraverserImpl(
      this.traversable,
      [...this.exitEarlyPredicates, predicate],
      this.traversalConfig
    );
  }

  public traverse(callback: BatchCallbackAsync<D>): Promise<TraversalResult> {
    return this.runTraversal(async (batchDocs, batchIndex) => {
      await callback(batchDocs, batchIndex);
    });
  }
}
