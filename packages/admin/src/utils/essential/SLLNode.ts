export class SLLNode<E> {
  public next: SLLNode<E> | null;
  public data: E;

  public constructor(data: E) {
    this.data = data;
    this.next = null;
  }
}
