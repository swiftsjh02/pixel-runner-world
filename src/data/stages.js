import { TILE_SIZE } from "../constants.js";

function blankMap(width, height) {
  return Array.from({ length: height }, () => Array(width).fill("."));
}

function fillGround(map, fromY = 12) {
  for (let y = fromY; y < map.length; y += 1) {
    for (let x = 0; x < map[0].length; x += 1) {
      map[y][x] = "#";
    }
  }
}

function carvePit(map, fromX, toX) {
  for (let y = 12; y <= 13; y += 1) {
    for (let x = fromX; x <= toX; x += 1) {
      if (y >= 0 && y < map.length && x >= 0 && x < map[0].length) {
        map[y][x] = ".";
      }
    }
  }
}

function addBlock(map, x, y, w, h) {
  for (let ty = y; ty < y + h; ty += 1) {
    for (let tx = x; tx < x + w; tx += 1) {
      if (ty >= 0 && ty < map.length && tx >= 0 && tx < map[0].length) {
        map[ty][tx] = "#";
      }
    }
  }
}

function toPixels(tx, ty) {
  return { x: tx * TILE_SIZE, y: ty * TILE_SIZE };
}

function lineCoins(startTx, ty, count, spacing = 2) {
  const coins = [];
  for (let i = 0; i < count; i += 1) {
    coins.push({
      x: (startTx + i * spacing) * TILE_SIZE + 4,
      y: ty * TILE_SIZE + 4,
    });
  }
  return coins;
}

function createStage({
  id,
  name,
  widthTiles,
  pits,
  blocks,
  requiredCoins,
  coins,
  hearts,
  checkpoints,
  platforms,
  hazards,
  enemies,
}) {
  const heightTiles = 14;
  const map = blankMap(widthTiles, heightTiles);
  fillGround(map);

  for (const pit of pits) {
    carvePit(map, pit.from, pit.to);
  }

  for (const block of blocks) {
    addBlock(map, block.x, block.y, block.w, block.h);
  }

  const tilemap = map.map((row) => row.join(""));
  const spawn = toPixels(3, 11);
  const goal = {
    x: (widthTiles - 4) * TILE_SIZE,
    y: 10 * TILE_SIZE,
    w: TILE_SIZE,
    h: TILE_SIZE * 2,
  };

  return {
    id,
    name,
    widthTiles,
    heightTiles,
    tilemap,
    spawn,
    goal,
    requiredCoins,
    checkpoints,
    coins,
    hearts,
    platforms,
    hazards,
    enemies,
  };
}

const stage11 = createStage({
  id: "1-1",
  name: "Sunny Step",
  widthTiles: 120,
  pits: [
    { from: 22, to: 24 },
    { from: 46, to: 48 },
    { from: 82, to: 85 },
  ],
  blocks: [
    { x: 12, y: 9, w: 5, h: 1 },
    { x: 30, y: 8, w: 4, h: 1 },
    { x: 57, y: 9, w: 6, h: 1 },
    { x: 70, y: 7, w: 5, h: 1 },
    { x: 95, y: 8, w: 7, h: 1 },
  ],
  requiredCoins: 12,
  coins: [
    ...lineCoins(8, 9, 6),
    ...lineCoins(26, 8, 5),
    ...lineCoins(52, 7, 4),
    ...lineCoins(73, 8, 5),
  ],
  hearts: [{ x: 66 * TILE_SIZE + 3, y: 6 * TILE_SIZE + 2 }],
  checkpoints: [
    { x: 40 * TILE_SIZE, y: 11 * TILE_SIZE + 2 },
    { x: 86 * TILE_SIZE, y: 11 * TILE_SIZE + 2 },
  ],
  platforms: [
    {
      id: "p11-h-1",
      type: "horizontal",
      x: 40 * TILE_SIZE,
      y: 9 * TILE_SIZE + 6,
      w: 32,
      h: 8,
      speed: 30,
      range: 40,
    },
    {
      id: "p11-v-1",
      type: "vertical",
      x: 88 * TILE_SIZE,
      y: 9 * TILE_SIZE + 4,
      w: 32,
      h: 8,
      speed: 26,
      range: 30,
    },
  ],
  hazards: [
    { x: 18 * TILE_SIZE, y: 11 * TILE_SIZE + 8, w: 16, h: 8 },
    { x: 62 * TILE_SIZE, y: 11 * TILE_SIZE + 8, w: 16, h: 8 },
    { x: 76 * TILE_SIZE, y: 11 * TILE_SIZE + 8, w: 16, h: 8 },
  ],
  enemies: [
    {
      kind: "patrol",
      x: 54 * TILE_SIZE,
      y: 11 * TILE_SIZE + 4,
      minX: 52 * TILE_SIZE,
      maxX: 60 * TILE_SIZE,
      speed: 34,
    },
  ],
});

const stage12 = createStage({
  id: "1-2",
  name: "Cloud Bridge",
  widthTiles: 130,
  pits: [
    { from: 18, to: 20 },
    { from: 40, to: 43 },
    { from: 67, to: 69 },
    { from: 101, to: 104 },
  ],
  blocks: [
    { x: 10, y: 10, w: 4, h: 1 },
    { x: 24, y: 8, w: 6, h: 1 },
    { x: 48, y: 7, w: 5, h: 1 },
    { x: 61, y: 9, w: 4, h: 1 },
    { x: 78, y: 8, w: 5, h: 1 },
    { x: 111, y: 7, w: 7, h: 1 },
  ],
  requiredCoins: 15,
  coins: [
    ...lineCoins(6, 9, 8),
    ...lineCoins(30, 8, 6),
    ...lineCoins(57, 7, 5),
    ...lineCoins(90, 8, 5),
  ],
  hearts: [
    { x: 52 * TILE_SIZE + 3, y: 6 * TILE_SIZE + 2 },
    { x: 108 * TILE_SIZE + 3, y: 6 * TILE_SIZE + 2 },
  ],
  checkpoints: [
    { x: 45 * TILE_SIZE, y: 11 * TILE_SIZE + 2 },
    { x: 95 * TILE_SIZE, y: 11 * TILE_SIZE + 2 },
  ],
  platforms: [
    {
      id: "p12-v-1",
      type: "vertical",
      x: 33 * TILE_SIZE,
      y: 9 * TILE_SIZE,
      w: 32,
      h: 8,
      speed: 28,
      range: 34,
    },
    {
      id: "p12-v-2",
      type: "vertical",
      x: 72 * TILE_SIZE,
      y: 9 * TILE_SIZE + 2,
      w: 32,
      h: 8,
      speed: 24,
      range: 40,
    },
    {
      id: "p12-h-1",
      type: "horizontal",
      x: 103 * TILE_SIZE,
      y: 8 * TILE_SIZE + 8,
      w: 32,
      h: 8,
      speed: 34,
      range: 36,
    },
  ],
  hazards: [
    { x: 28 * TILE_SIZE, y: 11 * TILE_SIZE + 8, w: 16, h: 8 },
    { x: 58 * TILE_SIZE, y: 11 * TILE_SIZE + 8, w: 16, h: 8 },
    { x: 84 * TILE_SIZE, y: 11 * TILE_SIZE + 8, w: 16, h: 8 },
    { x: 115 * TILE_SIZE, y: 11 * TILE_SIZE + 8, w: 16, h: 8 },
  ],
  enemies: [
    {
      kind: "patrol",
      x: 36 * TILE_SIZE,
      y: 11 * TILE_SIZE + 4,
      minX: 34 * TILE_SIZE,
      maxX: 43 * TILE_SIZE,
      speed: 42,
    },
    {
      kind: "patrol",
      x: 88 * TILE_SIZE,
      y: 11 * TILE_SIZE + 4,
      minX: 86 * TILE_SIZE,
      maxX: 96 * TILE_SIZE,
      speed: 45,
    },
  ],
});

const stage13 = createStage({
  id: "1-3",
  name: "Ruin Express",
  widthTiles: 144,
  pits: [
    { from: 14, to: 16 },
    { from: 31, to: 34 },
    { from: 55, to: 58 },
    { from: 80, to: 83 },
    { from: 111, to: 114 },
  ],
  blocks: [
    { x: 8, y: 9, w: 4, h: 1 },
    { x: 20, y: 7, w: 5, h: 1 },
    { x: 43, y: 8, w: 4, h: 1 },
    { x: 64, y: 7, w: 6, h: 1 },
    { x: 91, y: 8, w: 5, h: 1 },
    { x: 120, y: 7, w: 8, h: 1 },
  ],
  requiredCoins: 18,
  coins: [
    ...lineCoins(5, 9, 8),
    ...lineCoins(30, 8, 7),
    ...lineCoins(63, 7, 7),
    ...lineCoins(102, 8, 6),
  ],
  hearts: [
    { x: 47 * TILE_SIZE + 3, y: 6 * TILE_SIZE + 2 },
    { x: 118 * TILE_SIZE + 3, y: 6 * TILE_SIZE + 2 },
  ],
  checkpoints: [
    { x: 50 * TILE_SIZE, y: 11 * TILE_SIZE + 2 },
    { x: 104 * TILE_SIZE, y: 11 * TILE_SIZE + 2 },
  ],
  platforms: [
    {
      id: "p13-h-1",
      type: "horizontal",
      x: 26 * TILE_SIZE,
      y: 9 * TILE_SIZE,
      w: 32,
      h: 8,
      speed: 36,
      range: 44,
    },
    {
      id: "p13-v-1",
      type: "vertical",
      x: 73 * TILE_SIZE,
      y: 9 * TILE_SIZE,
      w: 32,
      h: 8,
      speed: 30,
      range: 34,
    },
    {
      id: "p13-c-1",
      type: "crumbly",
      x: 99 * TILE_SIZE,
      y: 8 * TILE_SIZE + 10,
      w: 32,
      h: 8,
      collapseDelay: 0.5,
      restoreDelay: 2.5,
    },
  ],
  hazards: [
    { x: 24 * TILE_SIZE, y: 11 * TILE_SIZE + 8, w: 16, h: 8 },
    { x: 52 * TILE_SIZE, y: 11 * TILE_SIZE + 8, w: 16, h: 8 },
    { x: 76 * TILE_SIZE, y: 11 * TILE_SIZE + 8, w: 16, h: 8 },
    { x: 96 * TILE_SIZE, y: 11 * TILE_SIZE + 8, w: 16, h: 8 },
    { x: 126 * TILE_SIZE, y: 11 * TILE_SIZE + 8, w: 16, h: 8 },
  ],
  enemies: [
    {
      kind: "patrol",
      x: 44 * TILE_SIZE,
      y: 11 * TILE_SIZE + 4,
      minX: 42 * TILE_SIZE,
      maxX: 51 * TILE_SIZE,
      speed: 47,
    },
    {
      kind: "charger",
      x: 90 * TILE_SIZE,
      y: 11 * TILE_SIZE + 3,
      triggerRange: 104,
      speed: 190,
      dashDuration: 0.45,
      cooldownDuration: 1.2,
    },
    {
      kind: "charger",
      x: 121 * TILE_SIZE,
      y: 11 * TILE_SIZE + 3,
      triggerRange: 96,
      speed: 205,
      dashDuration: 0.42,
      cooldownDuration: 1.2,
    },
  ],
});

const stages = [stage11, stage12, stage13];

for (const stage of stages) {
  if (stage.id === "1-1" && stage.coins.length !== 20) {
    throw new Error("Stage 1-1 coin count mismatch");
  }
  if (stage.id === "1-2" && stage.coins.length !== 24) {
    throw new Error("Stage 1-2 coin count mismatch");
  }
  if (stage.id === "1-3" && stage.coins.length !== 28) {
    throw new Error("Stage 1-3 coin count mismatch");
  }
}

export { stages };

export function getStageById(stageId) {
  return stages.find((stage) => stage.id === stageId) ?? null;
}
