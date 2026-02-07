import { PHYSICS } from "../constants.js";

export function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

export function applyGravity(vy, dt) {
  return clamp(vy + PHYSICS.gravity * dt, -9999, PHYSICS.maxFall);
}

export function approach(current, target, delta) {
  if (current < target) {
    return Math.min(target, current + delta);
  }
  if (current > target) {
    return Math.max(target, current - delta);
  }
  return current;
}

export function intersects(a, b) {
  return (
    a.x < b.x + b.w &&
    a.x + a.w > b.x &&
    a.y < b.y + b.h &&
    a.y + a.h > b.y
  );
}
