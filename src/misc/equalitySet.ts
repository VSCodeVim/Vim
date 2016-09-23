/**
 * A Set that determines equality by comparing toString() values.
 */
export class EqualitySet<T> {
  private data: Map<string, T>;

  constructor(values: T[] = []) {
    this.data = new Map();

    for (const val of values) {
      this.add(val);
    }
  }

  first(): T {
    for (const f of this.data) {
      return f[1];
    }

    throw new Error("No first element!");
  }

  add(item: T): void {
    this.data.set(item.toString(), item);
  }

  delete(item: T): T {
    const toBeDeleted = this.data.get(item.toString());

    this.data.delete(item.toString());

    return toBeDeleted;
  }

  values(): IterableIterator<T> {
    return this.data.values();
  }

  get size(): number {
    return this.data.size;
  }

  clear(): void {
    this.data = new Map();
  }

  map<U>(fn: (a: T) => U): EqualitySet<U> {
    let results: U[] = [];
    const values = this.values();

    for (const x of values) {
      results.push(fn(x));
    }

    return new EqualitySet(results);
  }

  async asyncMap<U>(fn: (a: T, i?: number) => Promise<U>): Promise<EqualitySet<U>> {
    let results: U[] = [];
    let i = 0;
    const values = [...this.values()];

    for (const x of values) {
      results.push(await fn(x, i++));
    }

    return new EqualitySet(results);
  }

  toString(): string {
    const values = this.values();
    let result = "[";

    for (const x of values) {
      result += x.toString() + ", ";
    }

    result += "]";

    return result;
  }

  [Symbol.iterator](): IterableIterator<T> {
    return this.values();
  }
}
