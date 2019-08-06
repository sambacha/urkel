
'use strict';

const assert = require('bsert');
const common = require('../../common');
const {AssertionError} = require('../../errors');

//const {types, typesByVal } = require('./util');

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

const {
  hashInternal,
  readU16,
  readU32,
  writeU16,
  writeU32
} = common;


/**
 * Node
 */

class Node {
  constructor(index, flags, data) {
    this.index = index;
    this.flags = flags;
    this.data = data;
  }

  get pos() {
    return this.flags >>> 1;
  }

  set pos(pos) {
    this.flags = pos * 2 + this.leaf;
  }

  get leaf() {
    return this.flags & 1;
  }

  set leaf(bit) {
    this.flags = (this.flags & ~1) >>> 0;
    this.flags += bit;
  }

  type() {
    throw new AssertionError('Unimplemented.');
  }

  isNull() {
    return false;
  }

  isInternal() {
    return false;
  }

  isLeaf() {
    return false;
  }

  isHash() {
    return false;
  }

  hash(hash) {
    return hash.zero;
  }

  // TODO no cannot do this
  toHash(hash) {
    assert(this.index !== 0);
    return new Hash(this.hash(hash), this.index, this.flags);
  }

  getSize(hash, bits) {
    throw new AssertionError('Unimplemented.');
  }

  write(data, off, hash, bits) {
    throw new AssertionError('Unimplemented.');
  }

  encode(hash, bits) {
    const size = this.getSize(hash, bits);
    const data = Buffer.allocUnsafe(size);
    this.write(data, 0, hash, bits);
    return data;
  }

  decode(data, hash, bits) {
    throw new AssertionError('Unimplemented.');
  }

  static getSize(hash, bits) {
    throw new AssertionError('Unimplemented.');
  }

  static decode(data, hash, bits) {
    throw new AssertionError('Unimplemented.');
  }
}

/**
 * Null
 */

class Null extends Node {
  constructor() {
    super(0, 0, null);
  }

  type() {
    return NULL;
  }

  isNull() {
    return true;
  }

  toHash(hash) {
    return this;
  }

  inspect() {
    return '<NIL>';
  }
}


/**
 * Hash
 */

class Hash extends Node {
  constructor(data, index, flags) {
    super(index, flags, data);
  }

  type() {
    return HASH;
  }

  isHash() {
    return true;
  }

  hash(hash) {
    assert(this.data);
    return this.data;
  }
  
/*
{
  const ptr = Pointer.read(data, off);
  off += PTR_SIZE;

  const buf = data.slice(off, off + hash.size);
  off += hash.size;

  this.left = new Hash(buf, ptr);
}
*/

  toHash(hash) {
    assert(this.data);
    return this;
  }

  inspect() {
    return `<Hash: ${this.data.toString('hex')}>`;
  }
}


/*
 * Expose
 */

exports.Hash = Hash;
exports.Node = Node;
exports.Null = Null;
exports.NIL = new Null();
