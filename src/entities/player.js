import { ACTION, PHYSICS, SCORE, START_LIVES, MAX_LIVES } from "../constants.js";
import { applyGravity, approach } from "../systems/physics.js";

export function createPlayer(spawn) {
  return {
    x: spawn.x,
    y: spawn.y,
    w: 12,
    h: 14,
    vx: 0,
    vy: 0,
    onGround: false,
    facing: 1,
    lives: START_LIVES,
    score: 0,
    coinsCollected: 0,
    checkpoint: { ...spawn },
    coyoteTimer: 0,
    jumpBufferTimer: 0,
    dashTimer: 0,
    dashCooldown: 0,
    invulnTimer: 0,
    respawnTimer: 0,
    animTimer: 0,
  };
}

export function startStageRun(player, spawn) {
  player.x = spawn.x;
  player.y = spawn.y;
  player.vx = 0;
  player.vy = 0;
  player.onGround = false;
  player.facing = 1;
  player.lives = START_LIVES;
  player.score = 0;
  player.coinsCollected = 0;
  player.checkpoint = { ...spawn };
  player.coyoteTimer = 0;
  player.jumpBufferTimer = 0;
  player.dashTimer = 0;
  player.dashCooldown = 0;
  player.invulnTimer = 0;
  player.respawnTimer = 0;
  player.animTimer = 0;
}

export function setCheckpoint(player, checkpoint) {
  player.checkpoint = { ...checkpoint };
}

export function addCoinScore(player) {
  player.coinsCollected += 1;
  player.score += SCORE.coin;
}

export function addHeart(player) {
  if (player.lives < MAX_LIVES) {
    player.lives += 1;
    return;
  }
  player.score += SCORE.heartOverflow;
}

export function applyPlayerControls(player, input, dt) {
  const left = input.isDown(ACTION.MOVE_LEFT);
  const right = input.isDown(ACTION.MOVE_RIGHT);
  const jumpPressed = input.consumePress(ACTION.JUMP);
  const dashPressed = input.consumePress(ACTION.DASH);
  let didDash = false;

  if (jumpPressed) {
    player.jumpBufferTimer = PHYSICS.jumpBufferTime;
  }

  if (dashPressed && player.dashCooldown <= 0 && player.dashTimer <= 0) {
    player.dashTimer = PHYSICS.dashDuration;
    player.dashCooldown = PHYSICS.dashCooldown;
    didDash = true;
    if (left && !right) {
      player.facing = -1;
    } else if (right && !left) {
      player.facing = 1;
    }
  }

  if (player.dashTimer > 0) {
    player.dashTimer -= dt;
    player.vx = PHYSICS.dashSpeed * player.facing;
    player.vy = Math.min(player.vy, 60);
  } else {
    let axis = 0;
    if (left) {
      axis -= 1;
    }
    if (right) {
      axis += 1;
    }

    if (axis !== 0) {
      player.facing = axis;
    }

    const target = axis * PHYSICS.moveSpeed;
    player.vx = approach(player.vx, target, 620 * dt);

    if (Math.abs(player.vx) < 0.4 && axis === 0) {
      player.vx = 0;
    }
  }

  if (player.jumpBufferTimer > 0) {
    player.jumpBufferTimer -= dt;
  }

  if (player.dashCooldown > 0) {
    player.dashCooldown -= dt;
  }

  if (player.onGround) {
    player.coyoteTimer = PHYSICS.coyoteTime;
  } else if (player.coyoteTimer > 0) {
    player.coyoteTimer -= dt;
  }

  if (player.jumpBufferTimer > 0 && (player.onGround || player.coyoteTimer > 0)) {
    player.vy = PHYSICS.jumpVelocity;
    player.onGround = false;
    player.jumpBufferTimer = 0;
    player.coyoteTimer = 0;
    return { jumped: true, dashed: didDash };
  }

  if (!player.onGround && player.dashTimer <= 0) {
    player.vy = applyGravity(player.vy, dt);
  }

  player.animTimer += dt;
  return { jumped: false, dashed: didDash };
}

export function applyDamage(player, sourceX) {
  if (player.invulnTimer > 0 || player.respawnTimer > 0) {
    return { tookDamage: false, gameOver: false };
  }

  player.lives -= 1;
  player.invulnTimer = PHYSICS.invulnTime;
  player.respawnTimer = PHYSICS.hitRespawnDelay;

  const knockSign = player.x + player.w * 0.5 < sourceX ? -1 : 1;
  player.vx = PHYSICS.knockbackX * knockSign;
  player.vy = PHYSICS.knockbackY;

  return {
    tookDamage: true,
    gameOver: player.lives <= 0,
  };
}

export function tickPlayerTimers(player, dt) {
  if (player.invulnTimer > 0) {
    player.invulnTimer -= dt;
  }

  if (player.respawnTimer > 0) {
    player.respawnTimer -= dt;
  }
}

export function forceRespawnToCheckpoint(player) {
  player.x = player.checkpoint.x;
  player.y = player.checkpoint.y;
  player.vx = 0;
  player.vy = 0;
  player.onGround = false;
  player.dashTimer = 0;
  player.jumpBufferTimer = 0;
}
