import { intersects } from "../systems/physics.js";

export function createItems(stage) {
  const coins = stage.coins.map((coin, index) => ({
    id: `coin-${index}`,
    x: coin.x,
    y: coin.y,
    w: 8,
    h: 8,
    collected: false,
  }));

  const hearts = stage.hearts.map((heart, index) => ({
    id: `heart-${index}`,
    x: heart.x,
    y: heart.y,
    w: 10,
    h: 10,
    collected: false,
  }));

  return { coins, hearts };
}

export function collectItems(player, items) {
  const playerBox = { x: player.x, y: player.y, w: player.w, h: player.h };
  const collectedCoins = [];
  const collectedHearts = [];

  for (const coin of items.coins) {
    if (coin.collected) {
      continue;
    }
    if (intersects(playerBox, coin)) {
      coin.collected = true;
      collectedCoins.push(coin);
    }
  }

  for (const heart of items.hearts) {
    if (heart.collected) {
      continue;
    }
    if (intersects(playerBox, heart)) {
      heart.collected = true;
      collectedHearts.push(heart);
    }
  }

  return { collectedCoins, collectedHearts };
}
