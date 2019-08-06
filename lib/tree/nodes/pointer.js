

/*
Points to the file, the position, and tells the size of the file
*/
class Pointer {
    constructor() {
      this.index = 0; //for number of file
      this.pos = 0; //for position
      this.size = 0; //number of bytes
      this.pointerSize = 0; //number of bytes taken up by pointer
    }
}


/*
Points to the file, the position, and tells the size of the file
*/
class Header {
  constructor() {
    this.PointerSize = 0;
    this.nodeType = 0; //Internal, Hash, ect
    this.hashSize = 0;
    this.headerSize = 0;
  }
}

/*
Points to the file, the position, and tells the size of the file
*/
class HashHeader {
  constructor() {
    this.PointerSize = 0;
    this.headerSize = 0;
    this.nodeType = 0; //Internal, Hash, ect
    this.dataSize = 0;
    this.flags = 0;
    this.hashSize = 0;
  }
}


class LeafHeader extends Header {
  constructor() {
    this.keySize = 0;
    this.valueSize = 0;
  }
}


class InternalHeader extends Header {
  constructor() {
    this.nodeType = 0; //Internal, Hash, ect
    this.nodeDataSize = 0; //for keys/prefixes
    this.nodeFlags = 0; //for colors
    this.nodeChildren = 0;
  }

}
