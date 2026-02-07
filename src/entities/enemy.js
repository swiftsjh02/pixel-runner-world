import { intersects } from "../systems/physics.js";

export function createEnemies(definitions) {
  return definitions.map((enemyDef, index) => {
    if (enemyDef.kind === "patrol") {
      return {
        id: `enemy-patrol-${index}`,
        kind: "patrol",
        x: enemyDef.x,
        y: enemyDef.y,
        w: enemyDef.w ?? 12,
        h: enemyDef.h ?? 12,
        speed: enemyDef.speed ?? 42,
        minX: enemyDef.minX,
        maxX: enemyDef.maxX,
        dir: 1,
      };
    }

    return {
      id: `enemy-charger-${index}`,
      kind: "charger",
      x: enemyDef.x,
      y: enemyDef.y,
      w: enemyDef.w ?? 13,
      h: enemyDef.h ?? 13,
      homeX: enemyDef.x,
      triggerRange: enemyDef.triggerRange ?? 90,
      speed: enemyDef.speed ?? 190,
      dashDuration: enemyDef.dashDuration ?? 0.45,
      cooldownDuration: enemyDef.cooldownDuration ?? 1.2,
      dir: -1,
      state: "idle",
      timer: 0,
      vx: 0,
    };
  });
}

export function updateEnemies(enemies, player, dt) {
  for (const enemy of enemies) {
    if (enemy.kind === "patrol") {
      enemy.x += enemy.speed * enemy.dir * dt;
      if (enemy.x < enemy.minX) {
        enemy.x = enemy.minX;
        enemy.dir = 1;
      }
      if (enemy.x + enemy.w > enemy.maxX) {
        enemy.x = enemy.maxX - enemy.w;
        enemy.dir = -1;
      }
      continue;
    }

    updateCharger(enemy, player, dt);
  }
}

function updateCharger(enemy, player, dt) {
  if (enemy.state === "idle") {
    const dx = player.x - enemy.x;
    const dy = Math.abs(player.y - enemy.y);

    if (Math.abs(dx) < enemy.triggerRange && dy < 24) {
      enemy.state = "dash";
      enemy.timer = enemy.dashDuration;
      enemy.dir = dx >= 0 ? 1 : -1;
      enemy.vx = enemy.speed * enemy.dir;
    }
    return;
  }

  if (enemy.state === "dash") {
    enemy.x += enemy.vx * dt;
    enemy.timer -= dt;
    if (enemy.timer <= 0) {
      enemy.state = "cooldown";
      enemy.timer = enemy.cooldownDuration;
      enemy.vx = 0;
    }
    return;
  }

  if (enemy.state === "cooldown") {
    enemy.timer -= dt;
    const homeDx = enemy.homeX - enemy.x;
    enemy.x += Math.sign(homeDx) * Math.min(Math.abs(homeDx), 60 * dt);
    if (enemy.timer <= 0) {
      enemy.state = "idle";
      enemy.timer = 0;
    }
  }
}

export function checkEnemyHit(player, enemies) {
  const playerBox = { x: player.x, y: player.y, w: player.w, h: player.h };
  for (const enemy of enemies) {
    if (
      intersects(playerBox, {
        x: enemy.x,
        y: enemy.y,
        w: enemy.w,
        h: enemy.h,
      })
    ) {
      return enemy;
    }
  }
  return null;
}
