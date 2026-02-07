import * as THREE from "three";
import {
  CHUNK_HEIGHT,
  CHUNK_SIZE,
  MESH_REBUILD_PER_FRAME,
  RENDER_DISTANCE,
  SAVE_FLUSH_DEBOUNCE_MS,
} from "../config.js";
import {
  chunkKey,
  createChunkData,
  getBlockLocal,
  parseChunkKey,
  setBlockLocal,
  worldToChunkCoord,
  worldToLocalCoord,
} from "./chunk.js";
import { BlockId } from "./blockTypes.js";
import { generateChunkBlocks } from "./worldGen.js";
import { buildChunkGeometry } from "./mesher.js";

export function createChunkManager({ scene, seed, saveStore }) {
  const chunkGroup = new THREE.Group();
  chunkGroup.name = "chunk-group";
  scene.add(chunkGroup);

  const materialOpaque = new THREE.MeshLambertMaterial({
    vertexColors: true,
    transparent: false,
  });

  const materialTransparent = new THREE.MeshLambertMaterial({
    vertexColors: true,
    transparent: true,
    opacity: 0.72,
    depthWrite: false,
  });

  const chunks = new Map();
  const pendingLoads = new Map();
  const dirtyMeshKeys = new Set();

  let flushTimer = null;
  let lastCenter = { cx: Infinity, cz: Infinity };

  function ensureAround(playerPos) {
    const centerCx = worldToChunkCoord(playerPos.x);
    const centerCz = worldToChunkCoord(playerPos.z);

    if (centerCx === lastCenter.cx && centerCz === lastCenter.cz) {
      return;
    }

    lastCenter = { cx: centerCx, cz: centerCz };
    const neededKeys = new Set();

    for (let dz = -RENDER_DISTANCE; dz <= RENDER_DISTANCE; dz += 1) {
      for (let dx = -RENDER_DISTANCE; dx <= RENDER_DISTANCE; dx += 1) {
        if (dx * dx + dz * dz > RENDER_DISTANCE * RENDER_DISTANCE) {
          continue;
        }

        const cx = centerCx + dx;
        const cz = centerCz + dz;
        const key = chunkKey(cx, cz);
        neededKeys.add(key);
        void ensureChunkLoaded(cx, cz);
      }
    }

    unloadOutOfRange(centerCx, centerCz, neededKeys);
  }

  async function ensureChunkLoaded(cx, cz) {
    const key = chunkKey(cx, cz);
    if (chunks.has(key)) {
      return chunks.get(key);
    }

    if (pendingLoads.has(key)) {
      return pendingLoads.get(key);
    }

    const promise = (async () => {
      let blocks = null;
      try {
        blocks = await saveStore.loadChunk(cx, cz);
      } catch {
        blocks = null;
      }

      if (!blocks) {
        blocks = generateChunkBlocks(seed, cx, cz);
      }

      const chunk = createChunkData(cx, cz, blocks);
      chunks.set(key, chunk);
      dirtyMeshKeys.add(key);

      markNeighborDirtyIfLoaded(cx - 1, cz);
      markNeighborDirtyIfLoaded(cx + 1, cz);
      markNeighborDirtyIfLoaded(cx, cz - 1);
      markNeighborDirtyIfLoaded(cx, cz + 1);

      return chunk;
    })();

    pendingLoads.set(key, promise);

    try {
      return await promise;
    } finally {
      pendingLoads.delete(key);
    }
  }

  function unloadOutOfRange(centerCx, centerCz, neededKeys) {
    for (const [key, chunk] of chunks) {
      if (neededKeys.has(key)) {
        continue;
      }

      const dx = chunk.cx - centerCx;
      const dz = chunk.cz - centerCz;
      if (dx * dx + dz * dz <= (RENDER_DISTANCE + 1) * (RENDER_DISTANCE + 1)) {
        continue;
      }

      disposeChunkMesh(chunk);
      chunks.delete(key);
      dirtyMeshKeys.delete(key);
    }
  }

  function getBlock(x, y, z) {
    if (y < 0 || y >= CHUNK_HEIGHT) {
      return BlockId.AIR;
    }

    const cx = worldToChunkCoord(x);
    const cz = worldToChunkCoord(z);
    const key = chunkKey(cx, cz);
    const chunk = chunks.get(key);

    if (!chunk) {
      return BlockId.AIR;
    }

    const lx = worldToLocalCoord(x);
    const lz = worldToLocalCoord(z);
    return getBlockLocal(chunk, lx, Math.floor(y), lz);
  }

  function setBlock(x, y, z, blockId) {
    const iy = Math.floor(y);
    if (iy < 0 || iy >= CHUNK_HEIGHT) {
      return false;
    }

    const cx = worldToChunkCoord(x);
    const cz = worldToChunkCoord(z);
    const key = chunkKey(cx, cz);

    let chunk = chunks.get(key);
    if (!chunk) {
      chunk = createChunkData(cx, cz, generateChunkBlocks(seed, cx, cz));
      chunks.set(key, chunk);
      dirtyMeshKeys.add(key);
    }

    const lx = worldToLocalCoord(x);
    const lz = worldToLocalCoord(z);

    const changed = setBlockLocal(chunk, lx, iy, lz, blockId);
    if (!changed) {
      return false;
    }

    dirtyMeshKeys.add(key);

    if (lx === 0) {
      markNeighborDirtyIfLoaded(cx - 1, cz);
    }
    if (lx === CHUNK_SIZE - 1) {
      markNeighborDirtyIfLoaded(cx + 1, cz);
    }
    if (lz === 0) {
      markNeighborDirtyIfLoaded(cx, cz - 1);
    }
    if (lz === CHUNK_SIZE - 1) {
      markNeighborDirtyIfLoaded(cx, cz + 1);
    }

    scheduleFlush();
    return true;
  }

  function markNeighborDirtyIfLoaded(cx, cz) {
    const key = chunkKey(cx, cz);
    const chunk = chunks.get(key);
    if (!chunk) {
      return;
    }
    chunk.dirty = true;
    dirtyMeshKeys.add(key);
  }

  function rebuildDirtyMeshes(limit = MESH_REBUILD_PER_FRAME) {
    let built = 0;

    for (const key of dirtyMeshKeys) {
      const chunk = chunks.get(key);
      if (!chunk || !chunk.dirty) {
        dirtyMeshKeys.delete(key);
        continue;
      }

      rebuildChunkMesh(chunk);
      chunk.dirty = false;
      dirtyMeshKeys.delete(key);
      built += 1;

      if (built >= limit) {
        break;
      }
    }
  }

  function rebuildChunkMesh(chunk) {
    const geometry = buildChunkGeometry(chunk, getBlock);

    disposeChunkMesh(chunk);

    if (geometry.opaque) {
      const mesh = new THREE.Mesh(geometry.opaque, materialOpaque);
      mesh.position.set(chunk.cx * CHUNK_SIZE, 0, chunk.cz * CHUNK_SIZE);
      mesh.frustumCulled = true;
      chunkGroup.add(mesh);
      chunk.meshOpaque = mesh;
    }

    if (geometry.transparent) {
      const mesh = new THREE.Mesh(geometry.transparent, materialTransparent);
      mesh.position.set(chunk.cx * CHUNK_SIZE, 0, chunk.cz * CHUNK_SIZE);
      mesh.renderOrder = 1;
      chunkGroup.add(mesh);
      chunk.meshTransparent = mesh;
    }
  }

  function disposeChunkMesh(chunk) {
    if (chunk.meshOpaque) {
      chunkGroup.remove(chunk.meshOpaque);
      chunk.meshOpaque.geometry.dispose();
      chunk.meshOpaque = null;
    }

    if (chunk.meshTransparent) {
      chunkGroup.remove(chunk.meshTransparent);
      chunk.meshTransparent.geometry.dispose();
      chunk.meshTransparent = null;
    }
  }

  async function flushDirtyChunks() {
    if (flushTimer) {
      clearTimeout(flushTimer);
      flushTimer = null;
    }

    const saves = [];
    for (const chunk of chunks.values()) {
      if (!chunk.modified) {
        continue;
      }
      chunk.modified = false;
      saves.push(saveStore.saveChunk(chunk.cx, chunk.cz, chunk.blocks));
    }

    if (saves.length === 0) {
      return;
    }

    await Promise.allSettled(saves);
  }

  function scheduleFlush() {
    if (flushTimer) {
      clearTimeout(flushTimer);
    }

    flushTimer = setTimeout(() => {
      void flushDirtyChunks();
    }, SAVE_FLUSH_DEBOUNCE_MS);
  }

  function getLoadedChunkCount() {
    return chunks.size;
  }

  function getChunkCoordAt(x, z) {
    return { cx: worldToChunkCoord(x), cz: worldToChunkCoord(z) };
  }

  function destroy() {
    if (flushTimer) {
      clearTimeout(flushTimer);
      flushTimer = null;
    }

    for (const chunk of chunks.values()) {
      disposeChunkMesh(chunk);
    }
    chunks.clear();

    materialOpaque.dispose();
    materialTransparent.dispose();
    scene.remove(chunkGroup);
  }

  function hasSolidBlockInAabb(minX, minY, minZ, maxX, maxY, maxZ) {
    const fromX = Math.floor(minX);
    const toX = Math.floor(maxX - 1e-6);
    const fromY = Math.floor(minY);
    const toY = Math.floor(maxY - 1e-6);
    const fromZ = Math.floor(minZ);
    const toZ = Math.floor(maxZ - 1e-6);

    for (let y = fromY; y <= toY; y += 1) {
      for (let z = fromZ; z <= toZ; z += 1) {
        for (let x = fromX; x <= toX; x += 1) {
          if (getBlock(x, y, z) !== BlockId.AIR) {
            return true;
          }
        }
      }
    }

    return false;
  }

  function getChunkForDebug(key) {
    const parsed = typeof key === "string" ? parseChunkKey(key) : key;
    return chunks.get(chunkKey(parsed.cx, parsed.cz)) ?? null;
  }

  return {
    ensureAround,
    getBlock,
    setBlock,
    rebuildDirtyMeshes,
    flushDirtyChunks,
    getLoadedChunkCount,
    getChunkCoordAt,
    hasSolidBlockInAabb,
    getChunkForDebug,
    destroy,
  };
}
