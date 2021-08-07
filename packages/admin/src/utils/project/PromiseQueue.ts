import { SLLQueue } from '../essential/SLLQueue';

export class PromiseQueue<T> {
  private readonly queue: SLLQueue<number>;
  private readonly map: Map<number, Promise<T>>;
  private lastPromiseId: number;
  private _isProcessing: boolean;

  public constructor() {
    this.queue = new SLLQueue();
    this.map = new Map();
    this.lastPromiseId = 0;
    this._isProcessing = false;
  }

  public get size(): number {
    return this.map.size;
  }

  public isProcessing(): boolean {
    return this._isProcessing;
  }

  public enqueue(promise: Promise<T>): void {
    const promiseId = this.getIdForNewPromise();
    this.queue.enqueue(promiseId);
    this.map.set(promiseId, promise);
  }

  private getIdForNewPromise(): number {
    return ++this.lastPromiseId;
  }

  public async process(): Promise<T[]> {
    this._isProcessing = true;
    const promiseIds = this.queue.dequeueAll();
    const results = await Promise.all(
      promiseIds.map(async (id) => {
        const promise = this.map.get(id)!;
        const result = await promise;
        this.map.delete(id);
        return result;
      })
    );
    this._isProcessing = false;
    return results;
  }
}
