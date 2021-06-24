import { SLLQueue } from '../essential/SLLQueue';

export interface ObservableQueueObserver<E> {
  receiveUpdate: (item: E) => void | Promise<void>;
}

type Observer<E> = ObservableQueueObserver<E>;

export class ObservableQueue<E> extends SLLQueue<E> {
  private readonly enqueueObservers = new Map<number, Observer<E>>();
  private readonly dequeueObservers = new Map<number, Observer<E>>();
  private lastCallbackId = 0;

  public registerEnqueueObserver(cb: Observer<E>): () => void {
    const callbackId = this.lastCallbackId++;
    this.enqueueObservers.set(callbackId, cb);
    return (): void => {
      this.enqueueObservers.delete(callbackId);
    };
  }

  public registerDequeueObserver(cb: Observer<E>): () => void {
    const callbackId = this.lastCallbackId++;
    this.dequeueObservers.set(callbackId, cb);
    return (): void => {
      this.dequeueObservers.delete(callbackId);
    };
  }

  public enqueue(item: E): void {
    super.enqueue(item);
    this.enqueueObservers.forEach((observer) => {
      observer.receiveUpdate(item);
    });
  }

  public dequeue(): E {
    const item = super.dequeue();
    this.enqueueObservers.forEach((observer) => {
      observer.receiveUpdate(item);
    });
    return item;
  }
}
