import { SLLQueue } from '../essential/SLLQueue';

export class PromiseQueue<T> {
  readonly #queue: SLLQueue<number>;
  readonly #map: Map<number, Promise<T>>;
  #lastPromiseId: number;
  #isProcessing: boolean;

  public constructor() {
    this.#queue = new SLLQueue();
    this.#map = new Map();
    this.#lastPromiseId = 0;
    this.#isProcessing = false;
  }

  public get size(): number {
    return this.#map.size;
  }

  public isProcessing(): boolean {
    return this.#isProcessing;
  }

  public enqueue(promise: Promise<T>): void {
    const promiseId = this.#getIdForNewPromise();
    this.#queue.enqueue(promiseId);
    this.#map.set(promiseId, promise);
  }

  #getIdForNewPromise(): number {
    return ++this.#lastPromiseId;
  }

  /**
   * Processes all Promises in the queue.
   */
  public processAll(): Promise<T[]> {
    return this.processFirst(this.#queue.size);
  }

  /**
   * Processes the first `promiseCount` Promises in the queue.
   */
  public async processFirst(promiseCount: number): Promise<T[]> {
    this.#isProcessing = true;
    const promiseIds = this.#queue.dequeueFirst(promiseCount);
    const results = await Promise.all(
      promiseIds.map(async (id) => {
        const promise = this.#map.get(id)!;
        const result = await promise;
        this.#map.delete(id);
        return result;
      })
    );
    this.#isProcessing = false;
    return results;
  }
}
