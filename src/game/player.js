import { PLAYER } from "../config.js";

export function createPlayerState(spawn) {
  return {
    x: spawn.x,
    y: spawn.y,
    z: spawn.z,
    vx: 0,
    vy: 0,
    vz: 0,
    onGround: false,
    stepTravel: 0,
  };
}

export function getPlayerAabb(player) {
  const halfW = PLAYER.width * 0.5;
  return {
    minX: player.x - halfW,
    maxX: player.x + halfW,
    minY: player.y,
    maxY: player.y + PLAYER.height,
    minZ: player.z - halfW,
    maxZ: player.z + halfW,
  };
}

export function getEyePosition(player) {
  return {
    x: player.x,
    y: player.y + PLAYER.eyeHeight,
    z: player.z,
  };
}
