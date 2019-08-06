/**
 * Snapshot
 */

class Snapshot {
  constructor(tree, hash, root) {
    assert(tree instanceof Tree);
    assert(tree.isHash(hash));
    assert(root === null || (root instanceof Node));

    this.tree = tree;
    this.hash = hash;
    this.root = root;
  }

  rootHash() {
    return this.hash;
  }

  async getRoot() {
    if (!this.root)
      this.root = await this.tree.getHistory(this.hash);
    return this.root;
  }

  async inject(root) {
    this.root = await this.tree.getHistory(root);
    this.hash = root;
  }

  async get(key) {
    assert(this.tree.isKey(key));

    if (!this.root)
      this.root = await this.getRoot();

    return this.tree._get(this.root, key);
  }

  async prove(key) {
    if (!this.root)
      this.root = await this.getRoot();

    return this.tree._prove(this.root, key);
  }

  iterator(read = true, descending = false) {
    const iter = new Iterator(this.tree, this, read, descending);
    iter.root = this.root;
    return iter;
  }

  [asyncIterator]() {
    return this.entries();
  }

  keys() {
    const iter = this.iterator(false);
    return iter.keys();
  }

  values() {
    const iter = this.iterator(true);
    return iter.values();
  }

  entries() {
    const iter = this.iterator(true);
    return iter.entries();
  }
}
