/* eslint-env mocha */
/* eslint prefer-arrow-callback: "off" */
/* eslint no-unused-vars: "off" */

/*
Tests for the MFS
*/

"use strict";

const assert = require("bsert");
const File = require("../lib/file.js");

/*
Test chdir for file path not string, should throw error

async function Test() {
  var file = new File();
  assert(true, true, "Always should be right")
}
*/

/*
Test
Closing and Opening sync
Cannot repeatedly open and close files
*/
async function CloseTest() {
  var file = new File("/store", 0);
  await assert.rejects(() => file.closeSync("/file.txt"), Error);
}

/*
Test
Closing and Opening sync
Cannot repeatedly open and close files
*/
async function OpenTest() {
  var file1 = new File("/store", 0);
  var file2 = new File("/store", 0);
  //await file1.openSync("/file.txt", "")
  //await assert.rejects(() => file2.openSync("/file.txt", ""), Error);
}

describe("File", function () {
  this.timeout(5000);
  it("should open files successfully", async () => {
    await OpenTest();
  });
  it("should close files successfully", async () => {
    await CloseTest();
  });
});
