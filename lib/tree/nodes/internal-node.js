
'use strict';

const assert = require('bsert');
const common = require('../../common');
const {AssertionError} = require('../../errors');
const {Node, Null, Hash, NIL} = require('./node');
//const {Hash} = require('./hash-node')

const {
  hashInternal,
  readU16,
  readU32,
  writeU16,
  writeU32
} = common;

/*
 * Constants
 */

const NULL = 0;
const INTERNAL = 1;
const LEAF = 2;
const HASH = 3;

const types = {
  NULL,
  INTERNAL,
  LEAF,
  HASH
};

const typesByVal = [
  'NULL',
  'INTERNAL',
  'LEAF',
  'HASH'
];



/**
 * Internal
 */

class Internal extends Node {
  constructor(left, right) {
    super(0, 0, null);
    this.left = left;
    this.right = right;
    //this.prefix
    //this.children = [left, right]
  }

  type() {
    return INTERNAL;
  }

  isInternal() {
    return true;
  }

  hash(hash) {
    if (!this.data) {
      const left = this.left.hash(hash);
      const right = this.right.hash(hash);
      this.data = hashInternal(hash, left, right);
    }
    return this.data;
  }

  getSize(hash, bits) {
    return Internal.getSize(hash, bits);
  }

  write(data, off, hash, bits) {
    const {left, right} = this;

    off = writeU16(data, left.index*2, off);
    off = writeU32(data, left.flags, off);
    off += left.hash(hash).copy(data, off);

    off = writeU16(data, right.index, off);
    off = writeU32(data, right.flags, off);
    off += right.hash(hash).copy(data, off);

    return off;
  }

  decode(data, hash, bits) {
    let off = 0;
    let index;

    index = readU16(data, off);
    off += 2;

    // Sanity check.
    if ((index & 1) !== 0)
      throw new AssertionError('Database corruption.');

    index >>>= 1;
    //Decode Hash
    if (index !== 0) {
      const flags = readU32(data, off);
      off += 4;

      const lhash = data.slice(off, off + hash.size);
      off += hash.size;

      this.left = new Hash(lhash, index, flags);
    } else {
      off += 4 + hash.size;
    }

    // Unused bit here.
    index = readU16(data, off);
    off += 2;

    if (index !== 0) {
      const flags = readU32(data, off);
      off += 4;

      const rhash = data.slice(off, off + hash.size);
      off += hash.size;

      this.right = new Hash(rhash, index, flags);
    } else {
      off += 4 + hash.size;
    }

    return this;
  }

  inspect() {
    return {
      left: this.left,
      right: this.right
    };
  }

  /*
    This needs to be fixed
  */
  static getSize(hash, bits) {
    assert(hash && typeof hash.digest === 'function');
    assert((bits >>> 0) === bits);
    assert(bits > 0 && (bits & 7) === 0);

    return (2 + 4 + hash.size) * 2;
  }


  static decode(data, hash, bits) {
    //const NIL = exports.NIL;
    const node = new this(NIL, NIL);
    return node.decode(data, hash, bits);
  }
}


/*
 * Expose
 */


exports.Internal = Internal;
