import { PLAYER } from "../config.js";
import { getPlayerAabb } from "./player.js";

export function updatePlayerPhysics(player, controls, world, dt) {
  const events = {
    jumped: false,
    movedDistance: 0,
  };

  const inputLen = Math.hypot(controls.moveX, controls.moveZ);
  let moveX = controls.moveX;
  let moveZ = controls.moveZ;

  if (inputLen > 1e-6) {
    moveX /= inputLen;
    moveZ /= inputLen;
  }

  const yaw = controls.yaw;
  const sin = Math.sin(yaw);
  const cos = Math.cos(yaw);

  // Rotate local input by camera yaw so WASD always matches look direction.
  const worldMoveX = moveX * cos + moveZ * sin;
  const worldMoveZ = -moveX * sin + moveZ * cos;

  const targetSpeed = controls.sprint ? PLAYER.runSpeed : PLAYER.walkSpeed;
  const targetVx = worldMoveX * targetSpeed;
  const targetVz = worldMoveZ * targetSpeed;

  const accel = player.onGround ? 32 : 14;
  player.vx = approach(player.vx, targetVx, accel * dt);
  player.vz = approach(player.vz, targetVz, accel * dt);

  if (inputLen < 0.001 && player.onGround) {
    player.vx = approach(player.vx, 0, PLAYER.groundDrag * dt);
    player.vz = approach(player.vz, 0, PLAYER.groundDrag * dt);
  }

  if (controls.jumpPressed && player.onGround) {
    player.vy = PLAYER.jumpVelocity;
    player.onGround = false;
    events.jumped = true;
  }

  player.vy -= PLAYER.gravity * dt;
  if (player.vy < -PLAYER.maxFallSpeed) {
    player.vy = -PLAYER.maxFallSpeed;
  }

  const startX = player.x;
  const startZ = player.z;

  moveAxis(player, world, "x", player.vx * dt);
  moveAxis(player, world, "z", player.vz * dt);

  player.onGround = false;
  moveAxis(player, world, "y", player.vy * dt);

  const dx = player.x - startX;
  const dz = player.z - startZ;
  events.movedDistance = Math.hypot(dx, dz);

  return events;
}

function moveAxis(player, world, axis, delta) {
  if (delta === 0) {
    return;
  }

  const stepSize = 0.25;
  const steps = Math.max(1, Math.ceil(Math.abs(delta) / stepSize));
  const step = delta / steps;

  for (let i = 0; i < steps; i += 1) {
    const prev = player[axis];
    player[axis] += step;

    const aabb = getPlayerAabb(player);
    if (!world.hasSolidBlockInAabb(aabb.minX, aabb.minY, aabb.minZ, aabb.maxX, aabb.maxY, aabb.maxZ)) {
      continue;
    }

    player[axis] = prev;

    if (axis === "x") {
      player.vx = 0;
    } else if (axis === "z") {
      player.vz = 0;
    } else if (axis === "y") {
      if (step < 0) {
        player.onGround = true;
      }
      player.vy = 0;
    }

    return;
  }
}

function approach(current, target, delta) {
  if (current < target) {
    return Math.min(target, current + delta);
  }
  if (current > target) {
    return Math.max(target, current - delta);
  }
  return current;
}
