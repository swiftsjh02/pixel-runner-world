export const CHUNK_SIZE = 16;
export const CHUNK_HEIGHT = 96;
export const RENDER_DISTANCE = 6;

export const BLOCK_INTERACT_DISTANCE = 6;

export const PLAYER = Object.freeze({
  width: 0.6,
  height: 1.8,
  eyeHeight: 1.62,
  walkSpeed: 4.4,
  runSpeed: 7.1,
  jumpVelocity: 5.9,
  gravity: 18.0,
  maxFallSpeed: 32,
  groundDrag: 12,
  airDrag: 3,
});

export const WORLD = Object.freeze({
  seaLevel: 36,
  minY: 0,
  maxY: CHUNK_HEIGHT - 1,
  treeChance: 0.016,
});

export const SAVE_DB_NAME = "voxel_world_v1";
export const SAVE_DB_VERSION = 1;

export const SAVE_FLUSH_DEBOUNCE_MS = 1200;
export const MESH_REBUILD_PER_FRAME = 2;

export const DEFAULT_SEED = 23021990;

export const MATERIALS = Object.freeze({
  opaqueOpacity: 1,
  transparentOpacity: 0.72,
});
