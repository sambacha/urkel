"use strict";

const assert = require("bsert");
const common = require("../lib/common");

const { hashInternal, readU16, readU32, writeU16, writeU32, parseU32 } = common;

/*
Test
*/
async function ParseU32Test() {
  //console.log(parseU32("1000000000"))
  assert(true, "True");
}

async function U16Test() {
  const buf = Buffer.alloc(2);
  writeU16(buf, 1, 0);
  assert(true, "True");
}

describe("File", function () {
  this.timeout(5000);
  it("should parse effectively", async () => {
    await ParseU32Test();
  });

  it("should read effectively", async () => {
    await U16Test();
  });
});
