const assert = require('bsert');
const bcrypto = require('bcrypto');
const {BLAKE2b} = bcrypto;
const {Database, Table} = require("../proxima")
const randomBytes = require('randombytes');

  function create_db() {
    return new Database()
  }

  async function create_table(db, name) {
    let table = db.create(name)
    return table
  }

  async function multiple_table_access_test() {
    let name = "newtable"
    let db = create_db()
    await db.open(name)
    await db.open(name)
    await db.close(name)
    await db.close(name)
  }

  async function random_entries(num) {
    let entries = new Map();
    let key = ""
    let value = ""
    for (let i = 0; i < num; i++) {
      key = randomBytes(32);
      value = randomBytes(300);
      entries.set(key, value)
    }
    return entries
  }

  function verify(root, key, proof) {
    return proof.verify(root, key, BLAKE2b, 256)
  }

  async function batch_insert(table, num) {
    try {
    table.transaction()
    let entries = await random_entries(num)
    for (const [key, value] of entries) {
      await table.put(key, value)
    }
    await table.commit()
    return entries
  } catch(err) {
    console.log(err)
  }
  }

  async function get_multiple(table, entries, prove = false) {
    for (const [k, v] of entries) {
      let resp = await table.get(k, prove)
      assert.bufferEqual(v, resp.value)
      //console.log(resp)
      if (prove) {
        assert(resp.proof != "")
        const [code, data] = verify(resp.root, k, resp.proof)
        assert(code == 0)
      }
    }
  }

  async function test() {
    let table_name = "test"
    let db = create_db()
    let table = await db.open(table_name)
    //console.log(db.tables)
    table = await db.get(table_name)
    let entries = await batch_insert(table, 1)
    await get_multiple(table, entries, true)
    //console.log("Closing")
    await table.close()
    //console.log("Finishing")
  }

  async function test2() {
    let table_name = "test"
    let db = create_db()
    let table = await db.open(table_name)
    let entries = await random_entries(1)
    for (const [key, value] of entries) {
      let resp = await table.put(key, value, true)
      //console.log("Put: ", resp)
    }
    await get_multiple(table, entries, true)
    await table.close()
  }

  describe("Proxima", function() {
    this.timeout(5000);

    it('should test tree', async () => {
      await test();
    });

    it('should test tree 2', async () => {
      await test2();
    });

    it('should test table access', async() => {
      await multiple_table_access_test();
    });
})
