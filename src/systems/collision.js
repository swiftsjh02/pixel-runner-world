import { TILE_SIZE } from "../constants.js";

export function tileAt(stage, tx, ty) {
  if (tx < 0 || ty < 0 || tx >= stage.widthTiles || ty >= stage.heightTiles) {
    return "#";
  }
  return stage.tilemap[ty][tx];
}

export function isSolidTile(stage, tx, ty) {
  return tileAt(stage, tx, ty) === "#";
}

export function resolveTileCollision(body, stage, dt) {
  body.onGround = false;

  body.x += body.vx * dt;
  resolveX(body, stage);

  body.y += body.vy * dt;
  resolveY(body, stage);
}

function resolveX(body, stage) {
  if (body.vx === 0) {
    return;
  }

  const minTy = Math.floor(body.y / TILE_SIZE);
  const maxTy = Math.floor((body.y + body.h - 1) / TILE_SIZE);

  if (body.vx > 0) {
    const right = body.x + body.w - 1;
    const tx = Math.floor(right / TILE_SIZE);
    for (let ty = minTy; ty <= maxTy; ty += 1) {
      if (isSolidTile(stage, tx, ty)) {
        body.x = tx * TILE_SIZE - body.w;
        body.vx = 0;
        return;
      }
    }
    return;
  }

  const left = body.x;
  const tx = Math.floor(left / TILE_SIZE);
  for (let ty = minTy; ty <= maxTy; ty += 1) {
    if (isSolidTile(stage, tx, ty)) {
      body.x = (tx + 1) * TILE_SIZE;
      body.vx = 0;
      return;
    }
  }
}

function resolveY(body, stage) {
  if (body.vy === 0) {
    return;
  }

  const minTx = Math.floor(body.x / TILE_SIZE);
  const maxTx = Math.floor((body.x + body.w - 1) / TILE_SIZE);

  if (body.vy > 0) {
    const bottom = body.y + body.h - 1;
    const ty = Math.floor(bottom / TILE_SIZE);
    for (let tx = minTx; tx <= maxTx; tx += 1) {
      if (isSolidTile(stage, tx, ty)) {
        body.y = ty * TILE_SIZE - body.h;
        body.vy = 0;
        body.onGround = true;
        return;
      }
    }
    return;
  }

  const top = body.y;
  const ty = Math.floor(top / TILE_SIZE);
  for (let tx = minTx; tx <= maxTx; tx += 1) {
    if (isSolidTile(stage, tx, ty)) {
      body.y = (ty + 1) * TILE_SIZE;
      body.vy = 0;
      return;
    }
  }
}
