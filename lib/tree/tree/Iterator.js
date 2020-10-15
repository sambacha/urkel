/**
 * Iterator
 */

class Iterator {
  constructor(tree, parent, read, descending = false) {
    assert(tree instanceof Tree);
    assert(parent && typeof parent.getRoot === "function");
    assert(typeof read === "boolean");

    this.tree = tree;
    this.parent = parent;
    this.descending = 1;
    this.read = read;
    this.root = null;
    this.stack = [];
    this.done = false;
    this.node = NIL;
    this.key = null;
    this.value = null;

    if (descending) {
      this.descending = 0;
    }
  }

  [asyncIterator]() {
    return this.entries();
  }

  keys() {
    return new AsyncIterator(this, 0);
  }

  values() {
    return new AsyncIterator(this, 1);
  }

  entries() {
    return new AsyncIterator(this, 2);
  }

  push(node, depth) {
    const state = new IteratorState(node, depth);
    return this.stack.push(state);
  }

  pop() {
    assert(this.stack.length > 0);
    return this.stack.pop();
  }

  top() {
    assert(this.stack.length > 0);
    return this.stack[this.stack.length - 1];
  }

  length() {
    return this.stack.length;
  }

  async seek() {
    if (!this.root) this.root = await this.parent.getRoot();

    this.node = NIL;

    if (this.done) return false;

    if (this.length() === 0) {
      this.push(this.root, 0);
    } else {
      this.pop();

      if (this.length() === 0) {
        this.done = true;
        return false;
      }
    }

    outer: for (;;) {
      const parent = this.top();
      const { node, depth } = parent;

      switch (node.type()) {
        case NULL: {
          this.node = node;
          break outer;
        }

        case INTERNAL: {
          if (parent.child >= 1) break outer;

          parent.child += 1;

          /* TODO Change this */
          if (parent.child === this.descending)
            this.push(node.right, depth + 1);
          else this.push(node.left, depth + 1);

          break;
        }

        case LEAF: {
          this.node = node;
          break outer;
        }

        case HASH: {
          if (parent.child >= 0) break outer;

          parent.child += 1;

          const rn = await this.tree.resolve(node);
          this.push(rn, depth);
          break;
        }

        default: {
          throw new AssertionError("Unknown node.");
        }
      }
    }

    return true;
  }

  async next() {
    for (;;) {
      if (!(await this.seek())) break;

      if (!this.node.isLeaf()) continue;

      this.key = this.node.key;
      this.value = this.node.value;

      if (this.read && !this.value)
        this.value = await this.tree.retrieve(this.node);

      return true;
    }

    this.key = null;
    this.value = null;

    return false;
  }
}

/**
 * IteratorState
 */

class IteratorState {
  constructor(node, depth) {
    this.node = node;
    this.depth = depth;
    this.child = -1;
  }
}

/**
 * AsyncIterator
 */

class AsyncIterator {
  constructor(iter, type) {
    assert(iter instanceof Iterator);
    assert((type & 3) === type);
    assert(type < 3);

    this.iter = iter;
    this.type = type;
  }

  async next() {
    if (!(await this.iter.next())) return { value: undefined, done: true };

    switch (this.type) {
      case 0:
        return { value: this.iter.key, done: false };
      case 1:
        return { value: this.iter.value, done: false };
      case 2:
        return { value: [this.iter.key, this.iter.value], done: false };
      default:
        throw new AssertionError("Bad value mode.");
    }
  }
}
