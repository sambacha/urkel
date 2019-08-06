'use strict';

const assert = require('bsert');
const common = require('../../common');
const {AssertionError} = require('../../errors');
//const {types, typesByVal } = require('./util');

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


const {Node, Null, Hash, NIL} = require('./node');
const {Internal} = require('./internal-node'); //This can be changed for different implementations...
const {Leaf} = require('./leaf-node');







/*
 * Expose
 */

 /*
  * Expose
  */

 exports.types = types;
 exports.typesByVal = typesByVal;
 exports.Node = Node;
 exports.Null = Null;
 exports.Internal = Internal;
 exports.Leaf = Leaf;
 exports.Hash = Hash;
 exports.NIL = NIL;
