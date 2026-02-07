import { CHUNK_HEIGHT, CHUNK_SIZE } from "../config.js";
import { BlockId } from "./blockTypes.js";

export const CHUNK_VOLUME = CHUNK_SIZE * CHUNK_SIZE * CHUNK_HEIGHT;

export function chunkKey(cx, cz) {
  return `${cx},${cz}`;
}

export function parseChunkKey(key) {
  const [cxRaw, czRaw] = key.split(",");
  return { cx: Number(cxRaw), cz: Number(czRaw) };
}

export function worldToChunkCoord(value) {
  return Math.floor(value / CHUNK_SIZE);
}

export function worldToLocalCoord(value) {
  const m = Math.floor(value) % CHUNK_SIZE;
  return m < 0 ? m + CHUNK_SIZE : m;
}

export function localIndex(lx, ly, lz) {
  return lx + lz * CHUNK_SIZE + ly * CHUNK_SIZE * CHUNK_SIZE;
}

export function createChunkData(cx, cz, blocks) {
  return {
    cx,
    cz,
    blocks: blocks ?? new Uint16Array(CHUNK_VOLUME).fill(BlockId.AIR),
    dirty: true,
    meshVersion: 0,
    meshOpaque: null,
    meshTransparent: null,
    modified: false,
  };
}

export function getBlockLocal(chunk, lx, ly, lz) {
  if (ly < 0 || ly >= CHUNK_HEIGHT) {
    return BlockId.AIR;
  }
  return chunk.blocks[localIndex(lx, ly, lz)];
}

export function setBlockLocal(chunk, lx, ly, lz, blockId) {
  if (ly < 0 || ly >= CHUNK_HEIGHT) {
    return false;
  }
  const index = localIndex(lx, ly, lz);
  if (chunk.blocks[index] === blockId) {
    return false;
  }
  chunk.blocks[index] = blockId;
  chunk.dirty = true;
  chunk.modified = true;
  chunk.meshVersion += 1;
  return true;
}
