/*!
 * tree.js - authenticated tree
 * Copyright (c) 2018, Christopher Jeffrey (MIT License).
 * https://github.com/handshake-org/urkel
 */

'use strict';

const assert = require('bsert');
const common = require('../common');
const errors = require('../errors');
const nodes = require('./nodes/newNodes');
const Proof = require('../proof');
const store = require('./store');

const {
  hasBit,
  hashValue,
  randomPath
} = common;

const {
  MissingNodeError,
  AssertionError
} = errors;

const {
  types,
  Node,
  NIL,
  Internal,
  Leaf
} = nodes;

const {
  NULL,
  INTERNAL,
  LEAF,
  HASH
} = types;

const {
  FileStore,
  MemoryStore
} = store;

/*
 * Compat
 */

const asyncIterator = Symbol.asyncIterator || 'asyncIterator';

/**
 * Tree
 */

class Tree {
  /**
   * Create a tree.
   * @constructor
   * @param {Object} hash
   * @param {Number} bits
   * @param {String} prefix
   */

  constructor(hash, bits, prefix) {
    assert(hash && typeof hash.digest === 'function');
    assert((bits >>> 0) === bits); /* TODO change this    */
    assert(bits > 0 && (bits & 7) === 0);/* TODO change this    */
    assert(!prefix || typeof prefix === 'string');

    let Store = FileStore;

    if (!prefix) {
      Store = MemoryStore;
      prefix = '/store';
    }

    this.hash = hash;
    this.bits = bits;
    this.prefix = prefix || null;
    this.store = new Store(prefix, hash, bits);
    this.root = NIL;
  }

  /* TODO Change this */
  isKey(key) {
    if (!Buffer.isBuffer(key))
      return false;
    return key.length === (this.bits >>> 3);
  }


/* TODO Change this */
  isValue(value) {
    if (!Buffer.isBuffer(value))
      return false;
    return value.length <= 0xffff;
  }

  isHash(hash) {
    if (!Buffer.isBuffer(hash))
      return false;
    return hash.length === this.hash.size;
  }

  hashValue(key, value) {
    return hashValue(this.hash, key, value);
  }

  rootHash() {
    return this.root.hash(this.hash);
  }

  async getRoot() {
    return this.root;
  }

  async open(root) {
    this.root = await this.store.open();

    if (root)
      await this.inject(root);
  }

  async close() {
    this.root = NIL;
    return this.store.close();
  }

  async inject(root) {
    this.root = await this.getHistory(root);
  }

  async getHistory(root) {
    assert(this.isHash(root));
    return this.store.getHistory(root);
  }

  async resolve(node) {
    return this.store.resolve(node);
  }

  async retrieve(node) {
    return this.store.retrieve(node);
  }

  async _get(root, key) {
    let node = root;
    let depth = 0;

    for (;;) {
      switch (node.type()) {
        case NULL: {
          return null;
        }

        case INTERNAL: {
          if (depth === this.bits) {
            throw new MissingNodeError({
              rootHash: root.hash(this.hash),
              key,
              depth
            });
          }

          /* TODO comparison node */
          // Internal node.
          if (hasBit(key, depth))
            node = node.right;
          else
            node = node.left;

          depth += 1;

          break;
        }

        case LEAF: {
          if (!key.equals(node.key))
            return null;

          return this.retrieve(node);
        }

        case HASH: {
          node = await this.resolve(node);
          break;
        }

        default: {
          throw new AssertionError('Unknown node type.');
        }
      }
    }
  }



  async get(key) {
    assert(this.isKey(key));
    return this._get(this.root, key);
  }



  async _insert(root, key, value) {
    const leaf = this.hashValue(key, value);
    const nodes = [];

    let node = root;
    let depth = 0;

    // Traverse bits left to right.
outer:
    for (;;) {
      switch (node.type()) {
        case NULL: {
          // Empty (sub)tree.
          // Replace the empty node.
          break outer;
        }

        case INTERNAL: {
          /* Change this  */
          if (depth === this.bits) {
            throw new MissingNodeError({
              rootHash: root.hash(this.hash),
              key,
              depth
            });
          }

          /* TODO comparison node */
          if (hasBit(key, depth)) {
            nodes.push(node.left);
            node = node.right;
          } else {
            nodes.push(node.right);
            node = node.left;
          }

          depth += 1;

          break;
        }

        case LEAF: {
          // Current key.
          if (key.equals(node.key)) {
            // Exact leaf already exists.
            if (leaf.equals(node.data))
              return root;

            // The branch doesn't grow.
            // Replace the current node.
            break outer;
          }

          assert(depth !== this.bits); //TODO Change this

          // Insert placeholder leaves to grow
          // the branch if we have bit collisions.
          while (hasBit(key, depth) === hasBit(node.key, depth)) {
            // Child-less sibling.
            nodes.push(NIL);
            depth += 1;
          }

          // Leaf is our sibling.
          nodes.push(node);
          depth += 1;

          break outer;
        }

        case HASH: {
          node = await this.resolve(node);
          break;
        }

        default: {
          throw new AssertionError('Unknown node type.');
        }
      }
    }
    
    ///Rewrite the hashes of all the updated roots
    // Start at the leaf.
    root = new Leaf(leaf, key, value);

    // Traverse bits right to left.
    while (nodes.length > 0) {
      const node = nodes.pop();

      depth -= 1;

      if (hasBit(key, depth))
        root = new Internal(node, root);
      else
        root = new Internal(root, node);
    }

    return root;
  }

  async _remove(root, key) {
    const nodes = [];

    let node = root;
    let depth = 0;

    // Traverse bits left to right.
outer:
    for (;;) {
      switch (node.type()) {
        case NULL: {
          // Empty (sub)tree.
          return root;
        }

        case INTERNAL: {
          if (depth === this.bits) {
            throw new MissingNodeError({
              rootHash: root.hash(this.hash),
              key,
              depth
            });
          }

          /* TODO Change this */
          // Internal node.
          if (hasBit(key, depth)) {
            nodes.push(node.left);
            node = node.right;
          } else {
            nodes.push(node.right);
            node = node.left;
          }

          depth += 1;

          break;
        }

        case LEAF: {
          // Not our key.
          if (!key.equals(node.key))
            return root;

          // Root can be a leaf.
          if (depth === 0) {
            // Remove the root. //How does this remove the root
            return NIL;
          }

          // Sibling.
          root = nodes[depth - 1];

          // Shrink the subtree if we're a leaf.
          if (root.leaf) {
            nodes.pop();
            depth -= 1;

            while (depth > 0) {
              const side = nodes[depth - 1];

              if (!side.isNull())
                break;

              nodes.pop();
              depth -= 1;
            }
          } else {
            root = NIL;
          }

          break outer;
        }

        case HASH: {
          node = await this.resolve(node);
          break;
        }

        default: {
          throw new AssertionError('Unknown node type.');
        }
      }
    }

    // Traverse bits right to left.
    while (nodes.length > 0) {
      const node = nodes.pop();

      depth -= 1;

      if (hasBit(key, depth))
        root = new Internal(node, root);
      else
        root = new Internal(root, node);
    }

    return root;
  }

  async _commit(node) {
    const root = this._write(node);

    await this.store.commit(root);

    this.root = root;

    return root;
  }

  _write(node) {
    switch (node.type()) {
      case NULL: {
        assert(node.index === 0);
        return node;
      }

      /* TODO Change this */
      case INTERNAL: {
        node.left = this._write(node.left);
        node.right = this._write(node.right);

        if (node.index === 0) {
          this.store.writeNode(node);

          // if (this.store.needsFlush())
          //   await this.store.flush();
        }

        assert(node.index !== 0);

        return node.toHash(this.hash);
      }

      case LEAF: {
        if (node.index === 0) {
          assert(node.value);

          this.store.writeValue(node);
          this.store.writeNode(node);

          // if (this.store.needsFlush())
          //   await this.store.flush();
        }

        assert(node.index !== 0);

        return node.toHash(this.hash);
      }

      case HASH: {
        assert(node.index !== 0);
        return node;
      }
    }

    throw new AssertionError('Unknown node.');
  }

  async prove(key) {
    assert(this.isKey(key));
    return this._prove(this.root, key);
  }

  async _prove(root, key) {
    const proof = new Proof();

    let node = root;
    let depth = 0;

    // Traverse bits left to right.
outer:
    for (;;) {
      switch (node.type()) {
        case NULL: {
          // Empty (sub)tree.
          break outer;
        }

        case INTERNAL: {
          if (depth === this.bits) {
            throw new MissingNodeError({
              rootHash: root.hash(this.hash),
              key,
              depth
            });
          }

          // Internal node.
          /* TODO Can do this on read */
          if (hasBit(key, depth)) {
            const hash = node.left.hash(this.hash);
            proof.push(hash);
            node = node.right;
          } else {
            const hash = node.right.hash(this.hash);
            proof.push(hash);
            node = node.left;
          }

          depth += 1;

          break;
        }

        case LEAF: {
          const value = await this.retrieve(node);

          if (node.key.equals(key)) {
            proof.type = Proof.TYPE_EXISTS;
            proof.value = value;
          } else {
            proof.type = Proof.TYPE_COLLISION;
            proof.key = Buffer.from(node.key);
            proof.hash = this.hash.digest(value);
          }

          break outer;
        }

        case HASH: {
          node = await this.resolve(node);
          break;
        }

        default: {
          throw new AssertionError('Unknown node type.');
        }
      }
    }

    return proof;
  }

  async compact() {
    const prefix = randomPath(this.prefix);
    const store = this.store.clone(prefix);

    await store.open();

    const root = await this._compact(this.root, store);

    await store.commit(root);
    await store.close();

    await this.store.close();
    await this.store.destroy();

    await store.rename(this.prefix);
    await store.open();

    this.store = store;
    this.root = root;
  }

  /*
    TODO Need to Change this
  */
  async _compact(node, store) {
    switch (node.type()) {
      case NULL: {
        return node;
      }

      /* TODO Change this */
      case INTERNAL: {
        node.left = await this._compact(node.left, store);
        node.right = await this._compact(node.right, store);

        node.index = 0;
        node.pos = 0;

        store.writeNode(node);

        if (store.needsFlush())
          await store.flush();

        return node.toHash(this.hash);
      }

      case LEAF: {
        node.index = 0;
        node.pos = 0;
        node.value = await this.retrieve(node);

        store.writeValue(node);
        store.writeNode(node);

        if (store.needsFlush())
          await store.flush();

        return node.toHash(this.hash);
      }

      case HASH: {
        const rn = await this.resolve(node);
        return this._compact(rn, store);
      }
    }

    throw new AssertionError('Unknown node.');
  }

  snapshot(hash) {
    let root = null;

    if (hash == null) {
      hash = this.rootHash();
      root = this.root;
    }

    return new Snapshot(this, hash, root);
  }

  transaction() {
    return new Transaction(this);
  }

  iterator(read = true, descending = false) {
    const iter = new Iterator(this, this, read, descending);
    iter.root = this.root;
    return iter;
  }

  [asyncIterator]() {
    return this.entries();
  }

  keys() {
    const iter = this.iterator(false, false);
    return iter.keys();
  }

  values() {
    const iter = this.iterator(true, false);
    return iter.values();
  }

  entries() {
    const iter = this.iterator(true, false);
    return iter.entries();
  }

  batch() {
    return this.transaction();
  }

  txn() {
    return this.transaction();
  }
}

/*
 * Expose
 */

module.exports = Tree;
