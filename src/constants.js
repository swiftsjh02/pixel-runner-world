export const LOGICAL_WIDTH = 384;
export const LOGICAL_HEIGHT = 224;
export const TILE_SIZE = 16;

export const GAME_STATE = Object.freeze({
  WORLD_MAP: "WORLD_MAP",
  STAGE_PLAY: "STAGE_PLAY",
  STAGE_CLEAR: "STAGE_CLEAR",
  GAME_OVER: "GAME_OVER",
  PAUSED: "PAUSED",
});

export const ACTION = Object.freeze({
  MOVE_LEFT: "MOVE_LEFT",
  MOVE_RIGHT: "MOVE_RIGHT",
  JUMP: "JUMP",
  DASH: "DASH",
  PAUSE: "PAUSE",
});

export const SAVE_KEY = "pixel_runner_save_v1";

export const PHYSICS = Object.freeze({
  moveSpeed: 90,
  jumpVelocity: -250,
  gravity: 700,
  maxFall: 360,
  dashSpeed: 180,
  dashDuration: 0.16,
  dashCooldown: 0.8,
  coyoteTime: 0.1,
  jumpBufferTime: 0.12,
  invulnTime: 1.0,
  hitRespawnDelay: 0.35,
  knockbackX: 120,
  knockbackY: -120,
});

export const SCORE = Object.freeze({
  coin: 100,
  clear: 1000,
  lifeBonus: 300,
  heartOverflow: 100,
});

export const MAX_LIVES = 5;
export const START_LIVES = 3;
export const SAVE_VERSION = 1;
