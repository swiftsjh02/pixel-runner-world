import { BLOCK_INTERACT_DISTANCE } from "../config.js";
import { BlockId } from "./blockTypes.js";

export function raycastBlock(origin, direction, getBlockAtWorld, maxDistance = BLOCK_INTERACT_DISTANCE) {
  const dir = normalize(direction.x, direction.y, direction.z);
  if (dir.len === 0) {
    return null;
  }

  let x = Math.floor(origin.x);
  let y = Math.floor(origin.y);
  let z = Math.floor(origin.z);

  const stepX = Math.sign(dir.x);
  const stepY = Math.sign(dir.y);
  const stepZ = Math.sign(dir.z);

  const tDeltaX = stepX !== 0 ? Math.abs(1 / dir.x) : Number.POSITIVE_INFINITY;
  const tDeltaY = stepY !== 0 ? Math.abs(1 / dir.y) : Number.POSITIVE_INFINITY;
  const tDeltaZ = stepZ !== 0 ? Math.abs(1 / dir.z) : Number.POSITIVE_INFINITY;

  let tMaxX = intBound(origin.x, dir.x);
  let tMaxY = intBound(origin.y, dir.y);
  let tMaxZ = intBound(origin.z, dir.z);

  let faceNormal = { x: 0, y: 0, z: 0 };
  let distance = 0;

  while (distance <= maxDistance) {
    const blockId = getBlockAtWorld(x, y, z);
    if (blockId !== BlockId.AIR) {
      return { x, y, z, normal: faceNormal, distance };
    }

    if (tMaxX < tMaxY) {
      if (tMaxX < tMaxZ) {
        x += stepX;
        distance = tMaxX;
        tMaxX += tDeltaX;
        faceNormal = { x: -stepX, y: 0, z: 0 };
      } else {
        z += stepZ;
        distance = tMaxZ;
        tMaxZ += tDeltaZ;
        faceNormal = { x: 0, y: 0, z: -stepZ };
      }
    } else if (tMaxY < tMaxZ) {
      y += stepY;
      distance = tMaxY;
      tMaxY += tDeltaY;
      faceNormal = { x: 0, y: -stepY, z: 0 };
    } else {
      z += stepZ;
      distance = tMaxZ;
      tMaxZ += tDeltaZ;
      faceNormal = { x: 0, y: 0, z: -stepZ };
    }
  }

  return null;
}

function intBound(s, ds) {
  if (ds === 0) {
    return Number.POSITIVE_INFINITY;
  }

  const step = ds > 0 ? 1 : 0;
  const sIsInteger = Math.floor(s) === s;
  const nextBoundary = sIsInteger ? s + step : Math.floor(s) + step;
  return (nextBoundary - s) / ds;
}

function normalize(x, y, z) {
  const len = Math.hypot(x, y, z);
  if (len <= 1e-8) {
    return { x: 0, y: 0, z: 0, len: 0 };
  }
  return { x: x / len, y: y / len, z: z / len, len };
}
