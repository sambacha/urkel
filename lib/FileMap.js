/**
 * File Map
 * Notion: a sparse array is faster than a hash table.
 */

class FileMap {
  constructor() {
    this.items = [];
    this.size = 0;
  }

  has(index) {
    return this.get(index) !== null;
  }

  get(index) {
    assert(index < MAX_FILES);

    if (index >= this.items.length) return null;

    const file = this.items[index];

    if (!file) return null;

    return file;
  }

  set(index, file) {
    assert(index < MAX_FILES);

    while (index >= this.items.length) this.items.push(null);

    if (!this.items[index]) this.size += 1;

    this.items[index] = file;

    return this;
  }

  delete(index) {
    assert(index < MAX_FILES);

    if (index >= this.items.length) return false;

    if (this.items[index]) {
      this.items[index] = null;
      this.size -= 1;
      return true;
    }

    return false;
  }

  clear() {
    this.items.length = 0;
    this.size = 0;
  }

  [Symbol.iterator]() {
    return this.entries();
  }

  *entries() {
    for (let i = 0; i < this.items.length; i++) {
      const file = this.items[i];

      if (file) yield [i, file];
    }
  }

  *keys() {
    for (let i = 0; i < this.items.length; i++) {
      const file = this.items[i];

      if (file) yield i;
    }
  }

  *values() {
    for (let i = 0; i < this.items.length; i++) {
      const file = this.items[i];

      if (file) yield file;
    }
  }
}
