import type { firestore } from 'firebase-admin';
import type {
  BatchCallback,
  ExitEarlyPredicate,
  Traversable,
  TraversalConfig,
  TraversalResult,
  TraverseEachCallback,
  TraverseEachConfig,
  Traverser,
} from '../../../api';
import { InvalidConfigError } from '../../../errors';
import {
  extractKeys,
  isNonNegativeInteger,
  isPositiveInteger,
  isUnboundedPositiveInteger,
  sleep,
} from '../../utils';

export type OnAfterBatchProcess = () => void | Promise<void>;

export type BatchProcessor<D> = (
  ...args: Parameters<BatchCallback<D>>
) => void | Promise<void> | OnAfterBatchProcess | Promise<OnAfterBatchProcess>;

type TraversalConfigRules = {
  [K in keyof TraversalConfig]: {
    isValid: (val: unknown) => boolean;
    valDescription: string;
  };
};

export abstract class AbstractTraverser<D> implements Traverser<D> {
  protected static readonly baseConfig: TraversalConfig = {
    batchSize: 250,
    sleepTimeBetweenBatches: 0,
    maxDocCount: Infinity,
    maxConcurrentBatchCount: 1,
    maxBatchRetryCount: 0,
    sleepTimeBetweenTrials: 1_000,
  };

  static readonly #configRules: TraversalConfigRules = {
    batchSize: {
      isValid: isPositiveInteger,
      valDescription: 'a positive integer',
    },
    sleepTimeBetweenBatches: {
      isValid: isNonNegativeInteger,
      valDescription: 'a non-negative integer',
    },
    maxDocCount: {
      isValid: isUnboundedPositiveInteger,
      valDescription: 'a positive integer or infinity',
    },
    maxConcurrentBatchCount: {
      isValid: isPositiveInteger,
      valDescription: 'a positive integer',
    },
    maxBatchRetryCount: {
      isValid: isNonNegativeInteger,
      valDescription: 'a non-negative integer',
    },
    sleepTimeBetweenTrials: {
      isValid: (val) => typeof val === 'function' || isNonNegativeInteger(val),
      valDescription: 'a non-negative integer or a function that returns a non-negative integer',
    },
  };

  protected static readonly baseTraverseEachConfig: TraverseEachConfig = {
    sleepTimeBetweenDocs: 0,
  };

  protected constructor(
    public readonly traversalConfig: TraversalConfig,
    protected readonly exitEarlyPredicates: ExitEarlyPredicate<D>[]
  ) {
    this.#validateConfig();
  }

  #validateConfig(): void {
    extractKeys(AbstractTraverser.#configRules).forEach((key) => {
      const val = this.traversalConfig[key];
      const { isValid, valDescription } = AbstractTraverser.#configRules[key];

      if (!isValid(val)) {
        throw new InvalidConfigError(
          `The '${key}' field in traversal config must be ${valDescription}.`
        );
      }
    });
  }

  public async traverseEach(
    callback: TraverseEachCallback<D>,
    config: Partial<TraverseEachConfig> = {}
  ): Promise<TraversalResult> {
    const { sleepTimeBetweenDocs } = {
      ...AbstractTraverser.baseTraverseEachConfig,
      ...config,
    };

    const { batchCount, docCount } = await this.traverse(async (batchDocs, batchIndex) => {
      for (let i = 0; i < batchDocs.length; i++) {
        await callback(batchDocs[i], i, batchIndex);
        if (sleepTimeBetweenDocs > 0) {
          await sleep(sleepTimeBetweenDocs);
        }
      }
    });

    return { batchCount, docCount };
  }

  protected async runTraversal(processBatch: BatchProcessor<D>): Promise<TraversalResult> {
    const { batchSize, sleepTimeBetweenBatches, maxDocCount } = this.traversalConfig;

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

      if (sleepTimeBetweenBatches > 0) {
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

  public abstract withConfig(config: Partial<TraversalConfig>): Traverser<D>;

  public abstract withExitEarlyPredicate(predicate: ExitEarlyPredicate<D>): Traverser<D>;

  public abstract traverse(callback: BatchCallback<D>): Promise<TraversalResult>;
}
