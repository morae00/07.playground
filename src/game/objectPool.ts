export class ObjectPool<T> {
  private readonly free: T[] = [];
  private readonly create: () => T;
  private readonly reset: (value: T) => void;
  private readonly maxRetained: number;

  constructor(
    create: () => T,
    reset: (value: T) => void,
    maxRetained = 256,
  ) {
    this.create = create;
    this.reset = reset;
    this.maxRetained = maxRetained;
  }

  acquire() {
    return this.free.pop() ?? this.create();
  }

  release(value: T) {
    this.reset(value);
    if (this.free.length < this.maxRetained) this.free.push(value);
  }

  clear() {
    this.free.length = 0;
  }

  get retained() {
    return this.free.length;
  }
}

export function recycleWhere<T>(values: T[], keep: (value: T) => boolean, pool: ObjectPool<T>) {
  let writeIndex = 0;
  for (const value of values) {
    if (keep(value)) {
      values[writeIndex] = value;
      writeIndex += 1;
    } else {
      pool.release(value);
    }
  }
  values.length = writeIndex;
  return values;
}

export function compactWhere<T>(values: T[], keep: (value: T) => boolean) {
  let writeIndex = 0;
  for (const value of values) {
    if (!keep(value)) continue;
    values[writeIndex] = value;
    writeIndex += 1;
  }
  values.length = writeIndex;
  return values;
}
