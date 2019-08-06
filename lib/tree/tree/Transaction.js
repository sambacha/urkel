/**
 * Transaction
 */

class Transaction extends Snapshot {
  constructor(tree) {
    assert(tree instanceof Tree);
    super(tree, tree.rootHash(), tree.root);
  }

  rootHash() {
    return this.root.hash(this.tree.hash);
  }

  async getRoot() {
    return this.root;
  }

  async insert(key, value) {
    assert(this.tree.isKey(key));
    assert(this.tree.isValue(value));
    this.root = await this.tree._insert(this.root, key, value);
  }

  async remove(key) {
    assert(this.tree.isKey(key));
    this.root = await this.tree._remove(this.root, key);
  }

  async commit() {
    this.root = await this.tree._commit(this.root);
    this.hash = this.rootHash();
    return this.hash;
  }

  clear() {
    this.root = this.tree.root;
    return this;
  }
}
