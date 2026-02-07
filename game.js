const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");
ctx.imageSmoothingEnabled = false;

const LOGICAL_WIDTH = 320;
const LOGICAL_HEIGHT = 180;
const TILE_SIZE = 16;
const WORLD_WIDTH = 56;
const WORLD_HEIGHT = 36;
const TARGET_GEMS = 10;

const TILE = {
  GRASS: 0,
  PATH: 1,
  WATER: 2,
  STONE: 3,
  FLOWER: 4,
};

const keys = { up: false, down: false, left: false, right: false, run: false };
const camera = { x: 0, y: 0 };
const world = Array.from({ length: WORLD_HEIGHT }, () =>
  Array(WORLD_WIDTH).fill(TILE.GRASS),
);
const gems = [];

const player = {
  x: TILE_SIZE * 8 + TILE_SIZE / 2,
  y: TILE_SIZE * 18 + 14,
  dir: "down",
  moving: false,
  anim: 0,
  score: 0,
};

let elapsed = 0;
let won = false;

buildWorld();
spawnGems(TARGET_GEMS);
registerInputs();
resizeCanvas();
window.addEventListener("resize", resizeCanvas);
window.addEventListener("blur", clearInputs);

let lastTime = performance.now();
requestAnimationFrame(loop);

function loop(now) {
  const dt = Math.min((now - lastTime) / 1000, 1 / 30);
  lastTime = now;
  elapsed += dt;

  if (!won) {
    update(dt);
  }
  render();

  requestAnimationFrame(loop);
}

function update(dt) {
  const speed = keys.run ? 94 : 66;
  let dx = (keys.right ? 1 : 0) - (keys.left ? 1 : 0);
  let dy = (keys.down ? 1 : 0) - (keys.up ? 1 : 0);

  if (dx !== 0 || dy !== 0) {
    const len = Math.hypot(dx, dy);
    dx /= len;
    dy /= len;
    player.moving = true;
    player.anim += dt * (keys.run ? 14 : 9);
    if (Math.abs(dx) > Math.abs(dy)) {
      player.dir = dx < 0 ? "left" : "right";
    } else {
      player.dir = dy < 0 ? "up" : "down";
    }
  } else {
    player.moving = false;
  }

  movePlayer(dx * speed * dt, dy * speed * dt);
  collectGems();
  updateCamera();
}

function movePlayer(stepX, stepY) {
  const nextX = player.x + stepX;
  if (!collides(nextX, player.y)) {
    player.x = nextX;
  }

  const nextY = player.y + stepY;
  if (!collides(player.x, nextY)) {
    player.y = nextY;
  }
}

function collides(px, py) {
  // 하단 중심 기준 hit box로 충돌 판정
  const left = px - 4;
  const right = px + 4;
  const top = py - 8;
  const bottom = py - 1;

  return (
    isSolidPixel(left, top) ||
    isSolidPixel(right, top) ||
    isSolidPixel(left, bottom) ||
    isSolidPixel(right, bottom)
  );
}

function isSolidPixel(px, py) {
  const tx = Math.floor(px / TILE_SIZE);
  const ty = Math.floor(py / TILE_SIZE);
  if (tx < 0 || ty < 0 || tx >= WORLD_WIDTH || ty >= WORLD_HEIGHT) {
    return true;
  }
  const tile = world[ty][tx];
  return tile === TILE.WATER || tile === TILE.STONE;
}

function collectGems() {
  for (let i = gems.length - 1; i >= 0; i -= 1) {
    const gem = gems[i];
    if (Math.hypot(player.x - gem.x, player.y - gem.y) <= 8) {
      gems.splice(i, 1);
      player.score += 1;
      if (player.score >= TARGET_GEMS) {
        won = true;
      }
    }
  }
}

function updateCamera() {
  const worldPxW = WORLD_WIDTH * TILE_SIZE;
  const worldPxH = WORLD_HEIGHT * TILE_SIZE;

  camera.x = clamp(player.x - LOGICAL_WIDTH / 2, 0, worldPxW - LOGICAL_WIDTH);
  camera.y = clamp(player.y - LOGICAL_HEIGHT / 2, 0, worldPxH - LOGICAL_HEIGHT);
}

function render() {
  ctx.fillStyle = "#0b1322";
  ctx.fillRect(0, 0, LOGICAL_WIDTH, LOGICAL_HEIGHT);

  drawWorld();
  drawGems();
  drawPlayer();
  drawHud();
}

function drawWorld() {
  const startTileX = Math.floor(camera.x / TILE_SIZE);
  const startTileY = Math.floor(camera.y / TILE_SIZE);
  const endTileX = Math.min(
    WORLD_WIDTH - 1,
    Math.ceil((camera.x + LOGICAL_WIDTH) / TILE_SIZE),
  );
  const endTileY = Math.min(
    WORLD_HEIGHT - 1,
    Math.ceil((camera.y + LOGICAL_HEIGHT) / TILE_SIZE),
  );

  for (let ty = startTileY; ty <= endTileY; ty += 1) {
    for (let tx = startTileX; tx <= endTileX; tx += 1) {
      const sx = tx * TILE_SIZE - camera.x;
      const sy = ty * TILE_SIZE - camera.y;
      drawTile(world[ty][tx], tx, ty, sx, sy);
    }
  }
}

function drawTile(type, tx, ty, sx, sy) {
  if (type === TILE.GRASS || type === TILE.FLOWER) {
    ctx.fillStyle = "#5ca55f";
    ctx.fillRect(sx, sy, TILE_SIZE, TILE_SIZE);
    if ((tx + ty) % 3 === 0) {
      ctx.fillStyle = "#6fbc72";
      ctx.fillRect(sx + 2, sy + 2, 3, 3);
    }
    if ((tx + ty) % 4 === 0) {
      ctx.fillStyle = "#4b8f53";
      ctx.fillRect(sx + 11, sy + 9, 2, 4);
    }
    if (type === TILE.FLOWER) {
      ctx.fillStyle = "#f8d3ef";
      ctx.fillRect(sx + 6, sy + 6, 2, 2);
      ctx.fillStyle = "#f17dc8";
      ctx.fillRect(sx + 5, sy + 7, 4, 1);
    }
    return;
  }

  if (type === TILE.PATH) {
    ctx.fillStyle = "#c39f66";
    ctx.fillRect(sx, sy, TILE_SIZE, TILE_SIZE);
    ctx.fillStyle = "#a98752";
    ctx.fillRect(sx, sy + 10, TILE_SIZE, 2);
    ctx.fillRect(sx + 4, sy + 2, 2, 2);
    ctx.fillRect(sx + 10, sy + 6, 3, 2);
    return;
  }

  if (type === TILE.WATER) {
    const wave = Math.sin(elapsed * 3 + tx * 0.8 + ty * 0.6) * 0.5 + 0.5;
    ctx.fillStyle = "#2f5cab";
    ctx.fillRect(sx, sy, TILE_SIZE, TILE_SIZE);
    ctx.fillStyle = wave > 0.5 ? "#5c8be0" : "#4775c7";
    ctx.fillRect(sx + 2, sy + 3, 12, 2);
    ctx.fillRect(sx + 3, sy + 10, 10, 2);
    return;
  }

  if (type === TILE.STONE) {
    ctx.fillStyle = "#4a5161";
    ctx.fillRect(sx, sy, TILE_SIZE, TILE_SIZE);
    ctx.fillStyle = "#616b7f";
    ctx.fillRect(sx + 2, sy + 2, 4, 3);
    ctx.fillRect(sx + 9, sy + 7, 3, 3);
    ctx.fillStyle = "#303643";
    ctx.fillRect(sx + 5, sy + 11, 5, 2);
  }
}

function drawGems() {
  for (const gem of gems) {
    const x = Math.round(gem.x - camera.x);
    const y = Math.round(gem.y - camera.y);
    if (x < -8 || y < -8 || x > LOGICAL_WIDTH + 8 || y > LOGICAL_HEIGHT + 8) {
      continue;
    }

    const blink = Math.sin(elapsed * 7 + gem.phase) * 0.5 + 0.5;
    const c = blink > 0.55 ? "#70f0ff" : "#48c3eb";
    const c2 = blink > 0.55 ? "#d9fbff" : "#a4ebff";

    ctx.fillStyle = c;
    ctx.fillRect(x - 1, y - 4, 2, 8);
    ctx.fillRect(x - 4, y - 1, 8, 2);
    ctx.fillStyle = c2;
    ctx.fillRect(x - 1, y - 2, 2, 4);
    ctx.fillRect(x - 2, y - 1, 4, 2);
  }
}

function drawPlayer() {
  const px = Math.round(player.x - camera.x);
  const py = Math.round(player.y - camera.y);
  const frame = player.moving ? Math.floor(player.anim) % 2 : 0;
  const step = frame === 0 ? -1 : 1;

  ctx.fillStyle = "rgba(0, 0, 0, 0.35)";
  ctx.fillRect(px - 5, py - 1, 10, 2);

  ctx.fillStyle = "#4c2e22";
  ctx.fillRect(px - 4, py - 14, 8, player.dir === "up" ? 3 : 2);

  ctx.fillStyle = "#f4cfa1";
  ctx.fillRect(px - 4, py - 12, 8, 5);

  ctx.fillStyle = "#202020";
  if (player.dir === "down") {
    ctx.fillRect(px - 2, py - 10, 1, 1);
    ctx.fillRect(px + 1, py - 10, 1, 1);
  } else if (player.dir === "left") {
    ctx.fillRect(px - 3, py - 10, 1, 1);
  } else if (player.dir === "right") {
    ctx.fillRect(px + 2, py - 10, 1, 1);
  }

  ctx.fillStyle = "#3194dd";
  ctx.fillRect(px - 4, py - 7, 8, 5);
  ctx.fillStyle = "#1d679f";
  ctx.fillRect(px - 4, py - 3, 8, 1);

  ctx.fillStyle = "#f4cfa1";
  if (player.dir === "left") {
    ctx.fillRect(px - 6, py - 7, 2, 4);
    ctx.fillRect(px + 4, py - 7, 2, 3);
  } else if (player.dir === "right") {
    ctx.fillRect(px - 6, py - 7, 2, 3);
    ctx.fillRect(px + 4, py - 7, 2, 4);
  } else {
    ctx.fillRect(px - 6, py - 7, 2, 3);
    ctx.fillRect(px + 4, py - 7, 2, 3);
  }

  ctx.fillStyle = "#352824";
  if (player.dir === "up") {
    ctx.fillRect(px - 3, py - 2 + step, 2, 3);
    ctx.fillRect(px + 1, py - 2 - step, 2, 3);
  } else {
    ctx.fillRect(px - 3, py - 2 - step, 2, 3);
    ctx.fillRect(px + 1, py - 2 + step, 2, 3);
  }
}

function drawHud() {
  ctx.fillStyle = "rgba(0, 0, 0, 0.5)";
  ctx.fillRect(6, 6, 136, 30);
  ctx.strokeStyle = "rgba(220, 240, 255, 0.35)";
  ctx.strokeRect(6.5, 6.5, 135, 29);

  ctx.fillStyle = "#e3f6ff";
  ctx.font = "10px monospace";
  ctx.fillText(`GEMS: ${player.score}/${TARGET_GEMS}`, 14, 18);
  ctx.fillStyle = "#90df6a";
  ctx.fillText("SHIFT = RUN", 14, 30);

  if (!won) {
    return;
  }

  ctx.fillStyle = "rgba(0, 0, 0, 0.75)";
  ctx.fillRect(48, 64, 224, 52);
  ctx.strokeStyle = "#8ce06e";
  ctx.strokeRect(48.5, 64.5, 223, 51);
  ctx.fillStyle = "#f3ffe8";
  ctx.font = "11px monospace";
  ctx.fillText("CLEAR! YOU FOUND ALL GEMS", 64, 86);
  ctx.fillText("WASD / ARROW TO KEEP WALKING", 58, 102);
}

function buildWorld() {
  setRect(0, 0, WORLD_WIDTH, 1, TILE.STONE);
  setRect(0, WORLD_HEIGHT - 1, WORLD_WIDTH, 1, TILE.STONE);
  setRect(0, 0, 1, WORLD_HEIGHT, TILE.STONE);
  setRect(WORLD_WIDTH - 1, 0, 1, WORLD_HEIGHT, TILE.STONE);

  setRect(2, 18, WORLD_WIDTH - 4, 2, TILE.PATH);
  setRect(20, 3, 2, WORLD_HEIGHT - 6, TILE.PATH);

  setRect(34, 7, 11, 8, TILE.WATER);
  setRect(9, 6, 6, 4, TILE.STONE);
  setRect(10, 25, 10, 4, TILE.STONE);
  setRect(43, 23, 9, 6, TILE.STONE);

  for (let i = 0; i < 170; i += 1) {
    const tx = randInt(1, WORLD_WIDTH - 2);
    const ty = randInt(1, WORLD_HEIGHT - 2);
    if (world[ty][tx] === TILE.GRASS) {
      world[ty][tx] = TILE.FLOWER;
    }
  }
}

function spawnGems(count) {
  let tries = 0;
  while (gems.length < count && tries < 6000) {
    tries += 1;
    const tx = randInt(2, WORLD_WIDTH - 3);
    const ty = randInt(2, WORLD_HEIGHT - 3);
    const tile = world[ty][tx];
    if (tile === TILE.STONE || tile === TILE.WATER) {
      continue;
    }

    const gx = tx * TILE_SIZE + TILE_SIZE / 2;
    const gy = ty * TILE_SIZE + TILE_SIZE / 2;

    if (Math.hypot(gx - player.x, gy - player.y) < 48) {
      continue;
    }

    let overlapping = false;
    for (const gem of gems) {
      if (Math.hypot(gx - gem.x, gy - gem.y) < 14) {
        overlapping = true;
        break;
      }
    }
    if (!overlapping) {
      gems.push({ x: gx, y: gy, phase: Math.random() * Math.PI * 2 });
    }
  }
}

function setRect(x, y, w, h, tile) {
  for (let ty = y; ty < y + h; ty += 1) {
    for (let tx = x; tx < x + w; tx += 1) {
      if (ty >= 0 && ty < WORLD_HEIGHT && tx >= 0 && tx < WORLD_WIDTH) {
        world[ty][tx] = tile;
      }
    }
  }
}

function randInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function registerInputs() {
  window.addEventListener("keydown", (event) => {
    if (updateKeyboardState(event.key, true)) {
      event.preventDefault();
    }
  });

  window.addEventListener("keyup", (event) => {
    if (updateKeyboardState(event.key, false)) {
      event.preventDefault();
    }
  });

  const touchPad = document.getElementById("touchPad");
  const map = {
    ArrowUp: "up",
    ArrowDown: "down",
    ArrowLeft: "left",
    ArrowRight: "right",
  };

  for (const button of touchPad.querySelectorAll("button")) {
    const keyName = map[button.dataset.key];
    if (!keyName) {
      continue;
    }

    const release = () => {
      keys[keyName] = false;
    };

    button.addEventListener("pointerdown", (event) => {
      event.preventDefault();
      keys[keyName] = true;
      button.setPointerCapture(event.pointerId);
    });
    button.addEventListener("pointerup", release);
    button.addEventListener("pointercancel", release);
    button.addEventListener("pointerleave", release);
  }
}

function updateKeyboardState(rawKey, pressed) {
  const key = rawKey.toLowerCase();

  if (key === "arrowup" || key === "w") {
    keys.up = pressed;
    return true;
  }
  if (key === "arrowdown" || key === "s") {
    keys.down = pressed;
    return true;
  }
  if (key === "arrowleft" || key === "a") {
    keys.left = pressed;
    return true;
  }
  if (key === "arrowright" || key === "d") {
    keys.right = pressed;
    return true;
  }
  if (key === "shift") {
    keys.run = pressed;
    return true;
  }

  return false;
}

function clearInputs() {
  keys.up = false;
  keys.down = false;
  keys.left = false;
  keys.right = false;
  keys.run = false;
}

function resizeCanvas() {
  const hasCoarsePointer = window.matchMedia("(pointer: coarse)").matches;
  const reservedHeight = hasCoarsePointer ? 250 : 140;

  const maxWidth = window.innerWidth - 24;
  const maxHeight = window.innerHeight - reservedHeight;
  let scale = Math.floor(Math.min(maxWidth / LOGICAL_WIDTH, maxHeight / LOGICAL_HEIGHT));
  if (!Number.isFinite(scale) || scale < 1) {
    scale = 1;
  }

  canvas.style.width = `${LOGICAL_WIDTH * scale}px`;
  canvas.style.height = `${LOGICAL_HEIGHT * scale}px`;
}
