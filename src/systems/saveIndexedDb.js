import { SAVE_DB_NAME, SAVE_DB_VERSION } from "../config.js";
import { CHUNK_VOLUME } from "../world/chunk.js";

let dbPromise = null;

export function defaultWorldMeta(seed) {
  return {
    version: 1,
    seed,
    player: {
      x: 0,
      y: 52,
      z: 0,
      yaw: 0,
      pitch: 0,
    },
    selectedHotbar: 0,
    volume: 0.7,
  };
}

export async function loadWorldMeta() {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction("meta", "readonly");
    const req = tx.objectStore("meta").get("world");
    req.onsuccess = () => resolve(req.result?.value ?? null);
    req.onerror = () => reject(req.error);
  });
}

export async function saveWorldMeta(meta) {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction("meta", "readwrite");
    tx.objectStore("meta").put({ key: "world", value: meta });
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

export async function loadChunkFromDb(cx, cz) {
  const key = `${cx},${cz}`;
  const db = await openDb();

  return new Promise((resolve, reject) => {
    const tx = db.transaction("chunks", "readonly");
    const req = tx.objectStore("chunks").get(key);
    req.onsuccess = () => {
      const row = req.result;
      if (!row) {
        resolve(null);
        return;
      }
      resolve(decompressBlocks(row.data));
    };
    req.onerror = () => reject(req.error);
  });
}

export async function saveChunkToDb(cx, cz, blocks) {
  const key = `${cx},${cz}`;
  const compressed = compressBlocks(blocks);
  const db = await openDb();

  return new Promise((resolve, reject) => {
    const tx = db.transaction("chunks", "readwrite");
    tx.objectStore("chunks").put({ key, data: compressed, dirtyAt: Date.now() });
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

function openDb() {
  if (dbPromise) {
    return dbPromise;
  }

  dbPromise = new Promise((resolve, reject) => {
    const request = indexedDB.open(SAVE_DB_NAME, SAVE_DB_VERSION);

    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains("meta")) {
        db.createObjectStore("meta", { keyPath: "key" });
      }
      if (!db.objectStoreNames.contains("chunks")) {
        db.createObjectStore("chunks", { keyPath: "key" });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });

  return dbPromise;
}

function compressBlocks(blocks) {
  const out = [];
  let prev = blocks[0];
  let count = 1;

  for (let i = 1; i < blocks.length; i += 1) {
    const curr = blocks[i];
    if (curr === prev && count < 65535) {
      count += 1;
      continue;
    }
    out.push(prev, count);
    prev = curr;
    count = 1;
  }
  out.push(prev, count);
  return out;
}

function decompressBlocks(encoded) {
  const blocks = new Uint16Array(CHUNK_VOLUME);
  let cursor = 0;

  for (let i = 0; i < encoded.length; i += 2) {
    const value = encoded[i];
    const count = encoded[i + 1];
    for (let j = 0; j < count && cursor < blocks.length; j += 1) {
      blocks[cursor] = value;
      cursor += 1;
    }
  }

  return blocks;
}
