"use strict";

const assert = require("bsert");
const common = require("../../common");
const { AssertionError } = require("../../errors");
const { Node, Null, Hash, NIL } = require("./node");

const { hashInternal, readU16, readU32, writeU16, writeU32 } = common;

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
  HASH,
};

const typesByVal = ["NULL", "INTERNAL", "LEAF", "HASH"];

/**
 * Leaf
 */
class Leaf extends Node {
  constructor(data, key, value) {
    super(0, 0, data);
    this.key = key;
    this.value = value;
    this.vindex = 0;
    this.vpos = 0;
    //TODO this.ksize
    this.vsize = 0;
  }

  get leaf() {
    return 1;
  }

  type() {
    return LEAF;
  }

  isLeaf() {
    return true;
  }

  hash(hash) {
    assert(this.data);
    return this.data;
  }

  getSize(hash, bits) {
    return Leaf.getSize(hash, bits);
  }

  inspect() {
    return `<Leaf: ${this.key.toString("hex")}>`;
  }

  static getSize(hash, bits) {
    assert(hash && typeof hash.digest === "function");
    assert(bits >>> 0 === bits);
    assert(bits > 0 && (bits & 7) === 0);
    return 2 + 4 + 2 + (bits >>> 3); //What is this about here?
  }

  write(data, off, hash, bits) {
    off = writeU16(data, this.vindex * 2 + 1, off); //This needs to be changed
    off = writeU32(data, this.vpos, off);
    off = writeU16(data, this.vsize, off);
    off += this.key.copy(data, off);
    return off;
  }

  decode(data, hash, bits) {
    let off = 0;
    this.vindex = readU16(data, off);
    off += 2;
    // Sanity check.
    if ((this.vindex & 1) !== 1)
      throw new AssertionError("Database corruption.");
    this.vindex >>>= 1;
    // Unused bit here.
    this.vpos = readU32(data, off);
    off += 4;
    this.vsize = readU16(data, off);
    off += 2;

    this.key = data.slice(off, off + (bits >>> 3));
    off += bits >>> 3;
    return this;
  }

  static decode(data, hash, bits) {
    const node = new this(null, null, null);
    return node.decode(data, hash, bits);
  }
}

/*
 * Expose
 */
exports.Leaf = Leaf;
