export const BlockId = Object.freeze({
  AIR: 0,
  GRASS: 1,
  DIRT: 2,
  STONE: 3,
  SAND: 4,
  WOOD: 5,
  LEAVES: 6,
  PLANKS: 7,
  COBBLESTONE: 8,
  GLASS: 9,
});

export const BLOCK_LIST = [
  BlockId.GRASS,
  BlockId.DIRT,
  BlockId.STONE,
  BlockId.SAND,
  BlockId.WOOD,
  BlockId.LEAVES,
  BlockId.PLANKS,
  BlockId.COBBLESTONE,
  BlockId.GLASS,
];

const BLOCK_META = {
  [BlockId.AIR]: { name: "Air", transparent: true, color: [0, 0, 0] },
  [BlockId.GRASS]: { name: "Grass", transparent: false, color: [0.31, 0.62, 0.28] },
  [BlockId.DIRT]: { name: "Dirt", transparent: false, color: [0.45, 0.30, 0.18] },
  [BlockId.STONE]: { name: "Stone", transparent: false, color: [0.53, 0.55, 0.58] },
  [BlockId.SAND]: { name: "Sand", transparent: false, color: [0.78, 0.72, 0.46] },
  [BlockId.WOOD]: { name: "Wood", transparent: false, color: [0.49, 0.35, 0.20] },
  [BlockId.LEAVES]: { name: "Leaves", transparent: true, color: [0.24, 0.50, 0.22] },
  [BlockId.PLANKS]: { name: "Planks", transparent: false, color: [0.66, 0.50, 0.29] },
  [BlockId.COBBLESTONE]: { name: "Cobblestone", transparent: false, color: [0.42, 0.44, 0.45] },
  [BlockId.GLASS]: { name: "Glass", transparent: true, color: [0.69, 0.85, 0.92] },
};

export function getBlockMeta(blockId) {
  return BLOCK_META[blockId] ?? BLOCK_META[BlockId.AIR];
}

export function isTransparent(blockId) {
  return getBlockMeta(blockId).transparent;
}
