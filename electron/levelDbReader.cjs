// A read-only LevelDB reader (TEC-09, decision D-25), just enough to read Chromium's localStorage folder from the
// main process. With the file: fuse off a file: page can no longer reach its own localStorage, so the first-launch
// save move reads the old origin's entries from disk instead. It reads the write-ahead logs (*.log) and the tables
// (*.ldb, *.sst, with Snappy-compressed blocks), and keeps each key's newest record; a deletion hides the key. It
// never writes to the folder, and it runs before any window opens the database.
const fs = require('node:fs');
const path = require('node:path');

const TABLE_MAGIC = 0xdb4775248b80fb57n;
const LOG_BLOCK = 32 * 1024;
const LOG_HEADER = 7;
const TYPE_DELETION = 0;
const TYPE_VALUE = 1;

class Cursor {
  constructor(bytes, offset = 0) {
    this.bytes = bytes;
    this.offset = offset;
  }

  varint() {
    let result = 0n;
    for (let shift = 0n; shift < 70n; shift += 7n) {
      if (this.offset >= this.bytes.length) throw new Error('leveldb: varint past the end');
      const byte = this.bytes[this.offset++];
      result |= BigInt(byte & 0x7f) << shift;
      if (byte < 0x80) return result;
    }
    throw new Error('leveldb: varint too long');
  }

  number() {
    return Number(this.varint());
  }

  take(length) {
    if (this.offset + length > this.bytes.length) throw new Error('leveldb: read past the end');
    const slice = this.bytes.subarray(this.offset, this.offset + length);
    this.offset += length;
    return slice;
  }

  sliced() {
    return this.take(this.number());
  }
}

/** Raw Snappy (no framing), the block compression LevelDB uses. */
function snappyDecompress(input) {
  const cursor = new Cursor(input);
  const length = cursor.number();
  const output = Buffer.alloc(length);
  let out = 0;
  while (cursor.offset < input.length) {
    const tag = input[cursor.offset++];
    const kind = tag & 3;
    if (kind === 0) {
      let size = tag >> 2;
      if (size >= 60) {
        const bytes = size - 59;
        size = 0;
        for (let index = 0; index < bytes; index += 1) size |= input[cursor.offset++] << (8 * index);
      }
      size += 1;
      if (out + size > length || cursor.offset + size > input.length) throw new Error('snappy: literal past the end');
      input.copy(output, out, cursor.offset, cursor.offset + size);
      cursor.offset += size;
      out += size;
      continue;
    }
    let size;
    let distance;
    if (kind === 1) {
      size = 4 + ((tag >> 2) & 7);
      distance = ((tag >> 5) << 8) | input[cursor.offset++];
    } else if (kind === 2) {
      size = (tag >> 2) + 1;
      distance = input.readUInt16LE(cursor.offset);
      cursor.offset += 2;
    } else {
      size = (tag >> 2) + 1;
      distance = input.readUInt32LE(cursor.offset);
      cursor.offset += 4;
    }
    if (distance === 0 || distance > out || out + size > length) throw new Error('snappy: bad copy');
    // Byte by byte: a copy may overlap what it is writing.
    for (let index = 0; index < size; index += 1) output[out + index] = output[out - distance + index];
    out += size;
  }
  if (out !== length) throw new Error('snappy: short output');
  return output;
}

/** The records of one log file, joined across its 32 KiB blocks. A torn tail (a crash mid-write) is dropped. */
function logRecords(bytes) {
  const records = [];
  let pending = null;
  for (let block = 0; block < bytes.length; block += LOG_BLOCK) {
    let offset = block;
    const end = Math.min(block + LOG_BLOCK, bytes.length);
    while (offset + LOG_HEADER <= end) {
      const length = bytes.readUInt16LE(offset + 4);
      const type = bytes[offset + 6];
      const start = offset + LOG_HEADER;
      if (type === 0 && length === 0) break;
      if (start + length > end) return records;
      const data = bytes.subarray(start, start + length);
      offset = start + length;
      if (type === 1) {
        records.push(Buffer.from(data));
        pending = null;
      } else if (type === 2) {
        pending = [data];
      } else if (type === 3 && pending) {
        pending.push(data);
      } else if (type === 4 && pending) {
        pending.push(data);
        records.push(Buffer.concat(pending));
        pending = null;
      }
    }
  }
  return records;
}

/** Each key's records from a write batch: [key, sequence, type, value]. */
function batchEntries(record, add) {
  if (record.length < 12) return;
  let sequence = record.readBigUInt64LE(0);
  const count = record.readUInt32LE(8);
  const cursor = new Cursor(record, 12);
  for (let index = 0; index < count && cursor.offset < record.length; index += 1) {
    const type = record[cursor.offset++];
    const key = cursor.sliced();
    if (type === TYPE_VALUE) add(key, sequence, TYPE_VALUE, cursor.sliced());
    else if (type === TYPE_DELETION) add(key, sequence, TYPE_DELETION, null);
    else throw new Error(`leveldb: unknown batch record ${type}`);
    sequence += 1n;
  }
}

function readBlock(file, handle) {
  const cursor = new Cursor(handle);
  const offset = cursor.number();
  const size = cursor.number();
  const block = file.subarray(offset, offset + size);
  const compression = file[offset + size];
  if (compression === 0) return block;
  if (compression === 1) return snappyDecompress(block);
  throw new Error(`leveldb: unknown block compression ${compression}`);
}

function blockEntries(block) {
  const restarts = block.readUInt32LE(block.length - 4);
  const limit = block.length - 4 - restarts * 4;
  const cursor = new Cursor(block);
  const entries = [];
  let last = Buffer.alloc(0);
  while (cursor.offset < limit) {
    const shared = cursor.number();
    const unshared = cursor.number();
    const valueLength = cursor.number();
    const key = Buffer.concat([last.subarray(0, shared), cursor.take(unshared)]);
    entries.push([key, cursor.take(valueLength)]);
    last = key;
  }
  return entries;
}

function tableEntries(file, add) {
  if (file.length < 48 || file.readBigUInt64LE(file.length - 8) !== TABLE_MAGIC) throw new Error('leveldb: not a table');
  const footer = new Cursor(file, file.length - 48);
  footer.number();
  footer.number();
  const indexOffset = footer.number();
  const indexSize = footer.number();
  const index = readBlock(file, Buffer.concat([encodeVarint(indexOffset), encodeVarint(indexSize)]));
  for (const [, handle] of blockEntries(index)) {
    for (const [internalKey, value] of blockEntries(readBlock(file, handle))) {
      const trailer = internalKey.readBigUInt64LE(internalKey.length - 8);
      const type = Number(trailer & 0xffn);
      add(internalKey.subarray(0, internalKey.length - 8), trailer >> 8n, type, type === TYPE_VALUE ? value : null);
    }
  }
}

function encodeVarint(value) {
  const bytes = [];
  let rest = BigInt(value);
  while (rest >= 0x80n) {
    bytes.push(Number(rest & 0x7fn) | 0x80);
    rest >>= 7n;
  }
  bytes.push(Number(rest));
  return Buffer.from(bytes);
}

/** Every live key of a LevelDB folder with its newest value, as Buffers (latin1 key string → value). */
function readLevelDb(directory, fileSystem = fs) {
  const newest = new Map();
  const add = (key, sequence, type, value) => {
    const name = key.toString('latin1');
    const seen = newest.get(name);
    if (!seen || sequence > seen.sequence) newest.set(name, { sequence, type, value: value && Buffer.from(value) });
  };
  const files = fileSystem.readdirSync(directory).sort();
  for (const name of files) {
    if (/\.(ldb|sst)$/.test(name)) tableEntries(fileSystem.readFileSync(path.join(directory, name)), add);
  }
  for (const name of files) {
    if (/\.log$/.test(name) && /^\d+\.log$/.test(name)) {
      for (const record of logRecords(fileSystem.readFileSync(path.join(directory, name)))) batchEntries(record, add);
    }
  }
  const live = new Map();
  for (const [name, entry] of newest) if (entry.type === TYPE_VALUE) live.set(name, entry.value);
  return live;
}

/** Chromium stores a localStorage string as one format byte, then UTF-16LE (0) or Latin-1 (1). */
function chromiumString(bytes) {
  if (bytes.length === 0) return '';
  if (bytes[0] === 0) return bytes.subarray(1).toString('utf16le');
  if (bytes[0] === 1) return bytes.subarray(1).toString('latin1');
  throw new Error(`localStorage: unknown string format ${bytes[0]}`);
}

/** One origin's localStorage entries from Chromium's "Local Storage/leveldb" folder; {} when there is none. */
function readLocalStorage(directory, origin, fileSystem = fs) {
  if (!fileSystem.existsSync(directory)) return {};
  const prefix = `_${origin}\u0000`;
  const entries = {};
  for (const [name, value] of readLevelDb(directory, fileSystem)) {
    if (!name.startsWith(prefix)) continue;
    entries[chromiumString(Buffer.from(name.slice(prefix.length), 'latin1'))] = chromiumString(value);
  }
  return entries;
}

module.exports = { readLevelDb, readLocalStorage, snappyDecompress };
