'use strict';

const assert = require('bsert');
const Proof = require('../lib/proof.js');
const bcrypto = require('bcrypto');
const {BLAKE2b} = bcrypto;

/*
Test chdir for file path not string, should throw error



/*
Test
Checking the sanity of the proof
*/
async function isSaneTest() {
  var proof = new Proof();


  assert(proof.isSane(BLAKE2b, 256), false)
  //assert.throws(await file.openSync('/file.txt'), Error, "Throws Error"

}



  describe("Proof", function() {
    this.timeout(5000);

    it('should test whether hash is correct', async () => {
      await isSaneTest();
    });


  });
