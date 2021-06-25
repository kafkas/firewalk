type Queue<D> = {
  pop: () => D;
};

type Collection<D> = Queue<D> | Array<D>;

type Traverser<D, C extends Collection<D>> = {
  traversable: C;
};

function create<D, C extends Collection<D>, T extends Traverser<D, C>>(
  traverser: T
): {
  original: T;
  print: (rawItem: D) => void;
} {
  {
    return {
      original: traverser,
      print: () => {},
    };
  }
}

const someQueue: Queue<number> = {
  pop: () => 1,
};

const sss = create<number, Queue<number>, Traverser<number, Queue<number>>>({
  traversable: someQueue,
});

sss.print(5);
