import { CHUNK_HEIGHT, CHUNK_SIZE, WORLD } from "../config.js";
import { BlockId } from "./blockTypes.js";
import { CHUNK_VOLUME, localIndex } from "./chunk.js";

export function generateChunkBlocks(seed, cx, cz) {
  const blocks = new Uint16Array(CHUNK_VOLUME).fill(BlockId.AIR);

  for (let lz = 0; lz < CHUNK_SIZE; lz += 1) {
    for (let lx = 0; lx < CHUNK_SIZE; lx += 1) {
      const wx = cx * CHUNK_SIZE + lx;
      const wz = cz * CHUNK_SIZE + lz;
      const height = terrainHeight(seed, wx, wz);

      for (let y = WORLD.minY; y <= height; y += 1) {
        if (isCave(seed, wx, y, wz, height)) {
          continue;
        }

        const index = localIndex(lx, y, lz);
        blocks[index] = chooseBlockForLayer(y, height);
      }

      maybePlaceTree(seed, wx, wz, lx, lz, height, blocks);
    }
  }

  return blocks;
}

export function terrainHeight(seed, wx, wz) {
  const base = fbm2(seed, wx * 0.010, wz * 0.010, 4, 2, 0.5);
  const detail = fbm2(seed ^ 0x9341, wx * 0.03, wz * 0.03, 3, 2.4, 0.45);
  const mountain = fbm2(seed ^ 0x4217, wx * 0.004, wz * 0.004, 2, 2, 0.5);

  const combined = (base - 0.5) * 26 + (detail - 0.5) * 8 + (mountain - 0.5) * 22;
  const h = Math.floor(WORLD.seaLevel + combined);
  return clamp(h, 8, CHUNK_HEIGHT - 8);
}

function chooseBlockForLayer(y, height) {
  if (height <= WORLD.seaLevel + 1) {
    if (y >= height - 2) {
      return BlockId.SAND;
    }
    return BlockId.STONE;
  }

  if (y === height) {
    return BlockId.GRASS;
  }

  if (y >= height - 3) {
    return BlockId.DIRT;
  }

  return BlockId.STONE;
}

function isCave(seed, wx, y, wz, terrainTop) {
  if (y >= terrainTop - 3 || y < 6) {
    return false;
  }

  const caveSignal = fbm3(seed ^ 0x77aa, wx * 0.045, y * 0.05, wz * 0.045, 3, 2, 0.5);
  return caveSignal > 0.68;
}

function maybePlaceTree(seed, wx, wz, lx, lz, height, blocks) {
  if (height <= WORLD.seaLevel + 1) {
    return;
  }

  if (lx < 2 || lx > CHUNK_SIZE - 3 || lz < 2 || lz > CHUNK_SIZE - 3) {
    return;
  }

  const noise = noise2(seed ^ 0xa6f, wx * 0.18, wz * 0.18);
  if (noise >= WORLD.treeChance) {
    return;
  }

  const trunkHeight = 4 + (Math.floor(noise2(seed ^ 0x90f1, wx * 0.4, wz * 0.4) * 3) % 3);
  const trunkTop = clamp(height + trunkHeight, 0, CHUNK_HEIGHT - 2);

  for (let y = height + 1; y <= trunkTop; y += 1) {
    setIfInside(blocks, lx, y, lz, BlockId.WOOD);
  }

  for (let oy = -2; oy <= 1; oy += 1) {
    const radius = oy >= 1 ? 1 : 2;
    for (let oz = -radius; oz <= radius; oz += 1) {
      for (let ox = -radius; ox <= radius; ox += 1) {
        const dist = Math.abs(ox) + Math.abs(oz);
        if (dist > radius + 1) {
          continue;
        }
        setIfInside(blocks, lx + ox, trunkTop + oy, lz + oz, BlockId.LEAVES);
      }
    }
  }

  setIfInside(blocks, lx, trunkTop + 2, lz, BlockId.LEAVES);
}

function setIfInside(blocks, lx, y, lz, blockId) {
  if (lx < 0 || lx >= CHUNK_SIZE || lz < 0 || lz >= CHUNK_SIZE) {
    return;
  }
  if (y < 0 || y >= CHUNK_HEIGHT) {
    return;
  }
  const idx = localIndex(lx, y, lz);
  if (blocks[idx] === BlockId.AIR || blockId === BlockId.WOOD) {
    blocks[idx] = blockId;
  }
}

function fbm2(seed, x, z, octaves, lacunarity, gain) {
  let amplitude = 1;
  let frequency = 1;
  let total = 0;
  let norm = 0;

  for (let i = 0; i < octaves; i += 1) {
    total += valueNoise2(seed + i * 911, x * frequency, z * frequency) * amplitude;
    norm += amplitude;
    amplitude *= gain;
    frequency *= lacunarity;
  }

  return norm > 0 ? total / norm : 0;
}

function fbm3(seed, x, y, z, octaves, lacunarity, gain) {
  let amplitude = 1;
  let frequency = 1;
  let total = 0;
  let norm = 0;

  for (let i = 0; i < octaves; i += 1) {
    total += valueNoise3(seed + i * 613, x * frequency, y * frequency, z * frequency) * amplitude;
    norm += amplitude;
    amplitude *= gain;
    frequency *= lacunarity;
  }

  return norm > 0 ? total / norm : 0;
}

function valueNoise2(seed, x, z) {
  const x0 = Math.floor(x);
  const z0 = Math.floor(z);
  const x1 = x0 + 1;
  const z1 = z0 + 1;

  const tx = fade(x - x0);
  const tz = fade(z - z0);

  const v00 = hash2(seed, x0, z0);
  const v10 = hash2(seed, x1, z0);
  const v01 = hash2(seed, x0, z1);
  const v11 = hash2(seed, x1, z1);

  const i0 = lerp(v00, v10, tx);
  const i1 = lerp(v01, v11, tx);
  return lerp(i0, i1, tz);
}

function valueNoise3(seed, x, y, z) {
  const x0 = Math.floor(x);
  const y0 = Math.floor(y);
  const z0 = Math.floor(z);

  const tx = fade(x - x0);
  const ty = fade(y - y0);
  const tz = fade(z - z0);

  const c000 = hash3(seed, x0, y0, z0);
  const c100 = hash3(seed, x0 + 1, y0, z0);
  const c010 = hash3(seed, x0, y0 + 1, z0);
  const c110 = hash3(seed, x0 + 1, y0 + 1, z0);
  const c001 = hash3(seed, x0, y0, z0 + 1);
  const c101 = hash3(seed, x0 + 1, y0, z0 + 1);
  const c011 = hash3(seed, x0, y0 + 1, z0 + 1);
  const c111 = hash3(seed, x0 + 1, y0 + 1, z0 + 1);

  const ix00 = lerp(c000, c100, tx);
  const ix10 = lerp(c010, c110, tx);
  const ix01 = lerp(c001, c101, tx);
  const ix11 = lerp(c011, c111, tx);

  const iy0 = lerp(ix00, ix10, ty);
  const iy1 = lerp(ix01, ix11, ty);
  return lerp(iy0, iy1, tz);
}

function noise2(seed, x, z) {
  return valueNoise2(seed, x, z);
}

function hash2(seed, x, z) {
  let h = seed ^ (x * 374761393) ^ (z * 668265263);
  h = (h ^ (h >> 13)) * 1274126177;
  h ^= h >> 16;
  return (h >>> 0) / 4294967295;
}

function hash3(seed, x, y, z) {
  let h = seed ^ (x * 374761393) ^ (y * 1103515245) ^ (z * 668265263);
  h = (h ^ (h >> 13)) * 1274126177;
  h ^= h >> 16;
  return (h >>> 0) / 4294967295;
}

function fade(t) {
  return t * t * (3 - 2 * t);
}

function lerp(a, b, t) {
  return a + (b - a) * t;
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}
