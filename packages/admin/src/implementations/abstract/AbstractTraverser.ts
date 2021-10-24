import type { firestore } from 'firebase-admin';
import { sleep, isPositiveInteger } from '../../utils';
import type {
  BatchCallback,
  ExitEarlyPredicate,
  Traversable,
  TraversalConfig,
  TraversalResult,
  TraverseEachCallback,
  TraverseEachConfig,
  Traverser,
} from '../../api';

export type OnAfterBatchProcess = () => void | Promise<void>;

export type BatchProcessor<D> = (
  ...args: Parameters<BatchCallback<D>>
) => void | Promise<void> | OnAfterBatchProcess | Promise<OnAfterBatchProcess>;

export abstract class AbstractTraverser<C extends TraversalConfig, D> implements Traverser<C, D> {
  protected static readonly baseConfig: TraversalConfig = {
    batchSize: 250,
    sleepBetweenBatches: false,
    sleepTimeBetweenBatches: 500,
    maxDocCount: Infinity,
  };

  protected static readonly baseTraverseEachConfig: TraverseEachConfig = {
    sleepBetweenDocs: false,
    sleepTimeBetweenDocs: 500,
  };

  protected constructor(
    public readonly traversalConfig: C,
    protected readonly exitEarlyPredicates: ExitEarlyPredicate<D>[]
  ) {
    this.#validateBaseConfig(traversalConfig);
  }

  #validateBaseConfig(config: Partial<TraversalConfig> = {}): void {
    const { batchSize, sleepTimeBetweenBatches, maxDocCount } = config;

    this.#assertPositiveIntegerInBaseConfig(batchSize, 'batchSize');
    this.#assertPositiveIntegerInBaseConfig(sleepTimeBetweenBatches, 'sleepTimeBetweenBatches');

    if (maxDocCount !== Infinity) {
      this.#assertPositiveIntegerInBaseConfig(maxDocCount, 'maxDocCount');
    }
  }

  #assertPositiveIntegerInBaseConfig(
    num: number | undefined,
    field: keyof TraversalConfig
  ): asserts num {
    if (typeof num === 'number' && !isPositiveInteger(num)) {
      throw new Error(`The '${field}' field in traversal config must be a positive integer.`);
    }
  }

  public async traverseEach(
    callback: TraverseEachCallback<D>,
    config: Partial<TraverseEachConfig> = {}
  ): Promise<TraversalResult> {
    const { sleepBetweenDocs, sleepTimeBetweenDocs } = {
      ...AbstractTraverser.baseTraverseEachConfig,
      ...config,
    };

    const { batchCount, docCount } = await this.traverse(async (batchDocs, batchIndex) => {
      for (let i = 0; i < batchDocs.length; i++) {
        await callback(batchDocs[i], i, batchIndex);
        if (sleepBetweenDocs) {
          await sleep(sleepTimeBetweenDocs);
        }
      }
    });

    return { batchCount, docCount };
  }

  protected async runTraversal(processBatch: BatchProcessor<D>): Promise<TraversalResult> {
    const {
      batchSize,
      sleepBetweenBatches,
      sleepTimeBetweenBatches,
      maxDocCount,
    } = this.traversalConfig;

    let curBatchIndex = 0;
    let docCount = 0;
    let query = this.traversable.limit(Math.min(batchSize, maxDocCount));

    while (true) {
      const { docs: batchDocs } = await query.get();
      const batchDocCount = batchDocs.length;

      if (batchDocCount === 0) {
        break;
      }

      const lastDocInBatch = batchDocs[batchDocCount - 1];

      docCount += batchDocCount;

      const onAfterBatchProcess = await processBatch(batchDocs, curBatchIndex);

      if (this.shouldExitEarly(batchDocs, curBatchIndex) || docCount === maxDocCount) {
        break;
      }

      await onAfterBatchProcess?.();

      if (sleepBetweenBatches) {
        await sleep(sleepTimeBetweenBatches);
      }

      query = query.startAfter(lastDocInBatch).limit(Math.min(batchSize, maxDocCount - docCount));
      curBatchIndex++;
    }

    return { batchCount: curBatchIndex, docCount };
  }

  protected shouldExitEarly(
    batchDocs: firestore.QueryDocumentSnapshot<D>[],
    batchIndex: number
  ): boolean {
    return this.exitEarlyPredicates.some((predicate) => predicate(batchDocs, batchIndex));
  }

  public abstract readonly traversable: Traversable<D>;

  public abstract withConfig(config: Partial<C>): Traverser<C, D>;

  public abstract withExitEarlyPredicate(predicate: ExitEarlyPredicate<D>): Traverser<C, D>;

  public abstract traverse(callback: BatchCallback<D>): Promise<TraversalResult>;
}
