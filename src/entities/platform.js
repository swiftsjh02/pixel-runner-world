export function createPlatforms(definitions) {
  return definitions.map((platformDef, index) => ({
    id: platformDef.id ?? `platform-${index}`,
    type: platformDef.type,
    x: platformDef.x,
    y: platformDef.y,
    w: platformDef.w,
    h: platformDef.h,
    speed: platformDef.speed ?? 30,
    range: platformDef.range ?? 48,
    dir: 1,
    baseX: platformDef.x,
    baseY: platformDef.y,
    collapseDelay: platformDef.collapseDelay ?? 0.5,
    restoreDelay: platformDef.restoreDelay ?? 2.5,
    state: "solid",
    timer: 0,
    dx: 0,
    dy: 0,
  }));
}

export function updatePlatforms(platforms, dt) {
  for (const platform of platforms) {
    platform.dx = 0;
    platform.dy = 0;

    if (platform.type === "crumbly") {
      updateCrumbly(platform, dt);
      continue;
    }

    if (platform.type === "horizontal") {
      const prevX = platform.x;
      platform.x += platform.speed * platform.dir * dt;
      const minX = platform.baseX - platform.range;
      const maxX = platform.baseX + platform.range;
      if (platform.x < minX) {
        platform.x = minX;
        platform.dir = 1;
      }
      if (platform.x > maxX) {
        platform.x = maxX;
        platform.dir = -1;
      }
      platform.dx = platform.x - prevX;
      continue;
    }

    if (platform.type === "vertical") {
      const prevY = platform.y;
      platform.y += platform.speed * platform.dir * dt;
      const minY = platform.baseY - platform.range;
      const maxY = platform.baseY + platform.range;
      if (platform.y < minY) {
        platform.y = minY;
        platform.dir = 1;
      }
      if (platform.y > maxY) {
        platform.y = maxY;
        platform.dir = -1;
      }
      platform.dy = platform.y - prevY;
    }
  }
}

function updateCrumbly(platform, dt) {
  if (platform.state === "crumbling") {
    platform.timer -= dt;
    if (platform.timer <= 0) {
      platform.state = "broken";
      platform.timer = platform.restoreDelay;
    }
    return;
  }

  if (platform.state === "broken") {
    platform.timer -= dt;
    if (platform.timer <= 0) {
      platform.state = "solid";
      platform.timer = 0;
    }
  }
}

export function resolvePlayerOnPlatforms(player, platforms, dt) {
  let groundedByPlatform = false;
  const playerLeft = player.x;
  const playerRight = player.x + player.w;
  const currentFeet = player.y + player.h;
  const previousFeet = currentFeet - player.vy * dt;

  for (const platform of platforms) {
    if (platform.type === "crumbly" && platform.state === "broken") {
      continue;
    }

    const platformLeft = platform.x;
    const platformRight = platform.x + platform.w;

    if (playerRight <= platformLeft + 1 || playerLeft >= platformRight - 1) {
      continue;
    }

    const top = platform.y;
    if (player.vy >= 0 && previousFeet <= top + 2 && currentFeet >= top - 2) {
      player.y = top - player.h;
      player.vy = 0;
      player.onGround = true;
      player.x += platform.dx;
      player.y += platform.dy;
      groundedByPlatform = true;

      if (platform.type === "crumbly" && platform.state === "solid") {
        platform.state = "crumbling";
        platform.timer = platform.collapseDelay;
      }
    }
  }

  return groundedByPlatform;
}
