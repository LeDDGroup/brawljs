interface Node<T> {
  value: T;
  next: Node<T> | null;
}

export class Queue<T> {
  private top: Node<T> | null = null;
  private last: Node<T> | null = null;
  get front(): T {
    if (this.top === null) {
      throw new Error("Queue is empty");
    }
    return this.top.value;
  }
  empty(): boolean {
    return this.top === null;
  }
  drop() {
    if (this.top === null) {
      throw new Error("Queue is empty");
    }
    if (this.top.next === null) {
      this.top = this.last = null;
    } else {
      this.top = this.top.next;
    }
  }
  push(value: T) {
    const node = { value, next: null };
    if (this.top === null) {
      this.top = this.last = node;
    } else {
      this.last!.next = node;
      this.last = node;
    }
  }
  forEach(cb: (value: T) => boolean) {
    let node = { next: this.top } as Node<T>;
    let ok = true;
    while (node.next !== null && ok) {
      node = node.next;
      ok = cb(node.value);
    }
  }
}
