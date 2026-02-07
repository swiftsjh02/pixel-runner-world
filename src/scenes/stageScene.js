import {
  ACTION,
  GAME_STATE,
  LOGICAL_HEIGHT,
  LOGICAL_WIDTH,
  SCORE,
  TILE_SIZE,
} from "../constants.js";
import { resolveTileCollision } from "../systems/collision.js";
import { clamp, intersects } from "../systems/physics.js";
import {
  addCoinScore,
  addHeart,
  applyDamage,
  applyPlayerControls,
  createPlayer,
  forceRespawnToCheckpoint,
  setCheckpoint,
  startStageRun,
  tickPlayerTimers,
} from "../entities/player.js";
import { createPlatforms, resolvePlayerOnPlatforms, updatePlatforms } from "../entities/platform.js";
import { createItems, collectItems } from "../entities/item.js";
import { checkEnemyHit, createEnemies, updateEnemies } from "../entities/enemy.js";

export function createStageScene({ stages }) {
  const scene = {
    key: GAME_STATE.STAGE_PLAY,
    mode: GAME_STATE.STAGE_PLAY,
    stage: null,
    stageIndex: 0,
    player: null,
    platforms: [],
    items: { coins: [], hearts: [] },
    enemies: [],
    camera: { x: 0, y: 0 },
    insufficientTimer: 0,
    clearInfo: null,

    loadStage(stageId, game) {
      const stageIndex = stages.findIndex((stage) => stage.id === stageId);
      if (stageIndex < 0) {
        return;
      }

      this.stage = stages[stageIndex];
      this.stageIndex = stageIndex;
      this.mode = GAME_STATE.STAGE_PLAY;
      this.insufficientTimer = 0;
      this.clearInfo = null;

      if (!this.player) {
        this.player = createPlayer(this.stage.spawn);
      }
      startStageRun(this.player, this.stage.spawn);

      this.platforms = createPlatforms(this.stage.platforms);
      this.items = createItems(this.stage);
      this.enemies = createEnemies(this.stage.enemies);

      game.saveData.lastPlayedStageId = this.stage.id;
      game.persistSave();
      this.updateCamera();
    },

    onEnter(game) {
      if (!this.stage) {
        this.loadStage(game.saveData.lastPlayedStageId ?? "1-1", game);
      }
    },

    restartCurrent(game) {
      this.loadStage(this.stage.id, game);
    },

    update(dt, game) {
      if (!this.stage || !this.player) {
        return;
      }

      if (game.input.consumePress(ACTION.PAUSE)) {
        if (this.mode === GAME_STATE.STAGE_PLAY) {
          this.mode = GAME_STATE.PAUSED;
        } else if (this.mode === GAME_STATE.PAUSED) {
          this.mode = GAME_STATE.STAGE_PLAY;
        }
      }

      if (this.mode === GAME_STATE.PAUSED) {
        if (game.input.consumePress(ACTION.JUMP)) {
          this.mode = GAME_STATE.STAGE_PLAY;
        }
        return;
      }

      if (this.mode === GAME_STATE.STAGE_CLEAR) {
        if (game.input.consumePress(ACTION.JUMP) || game.input.consumePress(ACTION.DASH)) {
          const nextIndex = this.stageIndex + 1;
          if (nextIndex < stages.length) {
            this.loadStage(stages[nextIndex].id, game);
          } else {
            game.openWorldMap();
          }
        }
        return;
      }

      if (this.mode === GAME_STATE.GAME_OVER) {
        if (game.input.consumePress(ACTION.JUMP) || game.input.consumePress(ACTION.DASH)) {
          this.restartCurrent(game);
        }
        return;
      }

      this.updatePlay(dt, game);
    },

    updatePlay(dt, game) {
      const previousRespawnTimer = this.player.respawnTimer;
      const control = applyPlayerControls(this.player, game.input, dt);
      if (control.jumped) {
        game.audio.playJump();
      }
      if (control.dashed) {
        game.audio.playDash();
      }

      updatePlatforms(this.platforms, dt);
      updateEnemies(this.enemies, this.player, dt);
      resolveTileCollision(this.player, this.stage, dt);
      resolvePlayerOnPlatforms(this.player, this.platforms, dt);
      tickPlayerTimers(this.player, dt);

      if (previousRespawnTimer > 0 && this.player.respawnTimer <= 0 && this.player.lives > 0) {
        forceRespawnToCheckpoint(this.player);
      }

      this.updateCheckpointTouches();
      this.updateItemCollections(game);
      this.checkHazardDamage(game);
      if (this.mode === GAME_STATE.GAME_OVER) {
        this.updateCamera();
        return;
      }
      this.checkGoal(game);

      if (this.insufficientTimer > 0) {
        this.insufficientTimer -= dt;
      }

      this.updateCamera();
    },

    updateCheckpointTouches() {
      for (const checkpoint of this.stage.checkpoints) {
        const box = {
          x: checkpoint.x,
          y: checkpoint.y - 20,
          w: 10,
          h: 24,
        };
        if (
          intersects({ x: this.player.x, y: this.player.y, w: this.player.w, h: this.player.h }, box)
        ) {
          setCheckpoint(this.player, { x: checkpoint.x, y: checkpoint.y });
        }
      }
    },

    updateItemCollections(game) {
      const collected = collectItems(this.player, this.items);
      for (const coin of collected.collectedCoins) {
        void coin;
        addCoinScore(this.player);
        game.audio.playCoin();
      }

      for (const heart of collected.collectedHearts) {
        void heart;
        addHeart(this.player);
        game.audio.playHeart();
      }
    },

    checkHazardDamage(game) {
      const playerBox = { x: this.player.x, y: this.player.y, w: this.player.w, h: this.player.h };

      for (const hazard of this.stage.hazards) {
        if (!intersects(playerBox, hazard)) {
          continue;
        }
        this.applyDamageFrom(game, hazard.x + hazard.w * 0.5);
        return;
      }

      const hitEnemy = checkEnemyHit(this.player, this.enemies);
      if (hitEnemy) {
        this.applyDamageFrom(game, hitEnemy.x + hitEnemy.w * 0.5);
      }
    },

    applyDamageFrom(game, sourceX) {
      const result = applyDamage(this.player, sourceX);
      if (!result.tookDamage) {
        return;
      }
      game.audio.playHurt();
      if (result.gameOver) {
        this.mode = GAME_STATE.GAME_OVER;
      }
    },

    checkGoal(game) {
      if (!intersects(this.player, this.stage.goal)) {
        return;
      }

      if (this.player.coinsCollected < this.stage.requiredCoins) {
        this.insufficientTimer = 1.2;
        return;
      }

      this.player.score += SCORE.clear + this.player.lives * SCORE.lifeBonus;
      this.mode = GAME_STATE.STAGE_CLEAR;
      this.clearInfo = {
        baseCoins: this.player.coinsCollected * SCORE.coin,
        clearBonus: SCORE.clear,
        lifeBonus: this.player.lives * SCORE.lifeBonus,
        total: this.player.score,
      };

      const currentBest = game.saveData.bestScoresByStage[this.stage.id] ?? 0;
      game.saveData.bestScoresByStage[this.stage.id] = Math.max(currentBest, this.player.score);

      game.saveData.unlockedStageIndex = Math.max(
        game.saveData.unlockedStageIndex,
        Math.min(stages.length - 1, this.stageIndex + 1),
      );
      game.persistSave();
      game.audio.playClear();
    },

    updateCamera() {
      const worldWidth = this.stage.widthTiles * TILE_SIZE;
      const worldHeight = this.stage.heightTiles * TILE_SIZE;

      const lookAhead = this.player.facing > 0 ? 42 : -18;
      const targetX = this.player.x - LOGICAL_WIDTH * 0.35 + lookAhead;
      const targetY = this.player.y - LOGICAL_HEIGHT * 0.55;

      this.camera.x = clamp(targetX, 0, Math.max(0, worldWidth - LOGICAL_WIDTH));
      this.camera.y = clamp(targetY, 0, Math.max(0, worldHeight - LOGICAL_HEIGHT));
    },

    render(ctx, game) {
      if (!this.stage || !this.player) {
        return;
      }

      drawStageBackground(ctx);
      drawTilemap(ctx, this.stage, this.camera);
      drawGoal(ctx, this.stage.goal, this.camera);
      drawCheckpoints(ctx, this.stage.checkpoints, this.player.checkpoint, this.camera);
      drawPlatforms(ctx, this.platforms, this.camera);
      drawHazards(ctx, this.stage.hazards, this.camera);
      drawItems(ctx, this.items, this.camera, game.time);
      drawEnemies(ctx, this.enemies, this.camera, game.time);
      drawPlayer(ctx, this.player, this.camera, game.time);
      drawStageHudText(ctx, this.stage);

      if (this.insufficientTimer > 0) {
        drawToast(ctx, "코인이 부족합니다!");
      }

      if (this.mode === GAME_STATE.PAUSED) {
        drawOverlayPanel(ctx, "PAUSED", "SPACE/ENTER: CONTINUE");
      }

      if (this.mode === GAME_STATE.GAME_OVER) {
        drawOverlayPanel(ctx, "GAME OVER", "SPACE/ENTER: RESTART");
      }

      if (this.mode === GAME_STATE.STAGE_CLEAR && this.clearInfo) {
        drawClearPanel(ctx, this.clearInfo);
      }

      if (game.debugEnabled) {
        drawDebugOverlay(ctx, this, game);
      }
    },

    getHudData() {
      if (!this.stage || !this.player) {
        return null;
      }

      return {
        stageLabel: `STAGE ${this.stage.id}`,
        scoreLabel: `SCORE ${this.player.score}`,
        coinLabel: `COIN ${this.player.coinsCollected}/${this.stage.requiredCoins}`,
        lifeLabel: `LIFE ${"❤".repeat(this.player.lives)}${"·".repeat(Math.max(0, 5 - this.player.lives))}`,
      };
    },
  };

  return scene;
}

function drawStageBackground(ctx) {
  ctx.fillStyle = "#5e9ce8";
  ctx.fillRect(0, 0, LOGICAL_WIDTH, LOGICAL_HEIGHT);

  ctx.fillStyle = "#7db6ec";
  ctx.fillRect(0, LOGICAL_HEIGHT - 130, LOGICAL_WIDTH, 130);

  ctx.fillStyle = "#568dc8";
  ctx.fillRect(0, LOGICAL_HEIGHT - 88, LOGICAL_WIDTH, 88);
}

function drawTilemap(ctx, stage, camera) {
  const startX = Math.floor(camera.x / TILE_SIZE);
  const endX = Math.ceil((camera.x + LOGICAL_WIDTH) / TILE_SIZE);

  for (let ty = 0; ty < stage.heightTiles; ty += 1) {
    const row = stage.tilemap[ty];
    for (let tx = startX; tx <= endX; tx += 1) {
      if (tx < 0 || tx >= stage.widthTiles) {
        continue;
      }

      const tile = row[tx];
      if (tile !== "#") {
        continue;
      }

      const sx = tx * TILE_SIZE - camera.x;
      const sy = ty * TILE_SIZE - camera.y;
      drawGroundTile(ctx, sx, sy);
    }
  }
}

function drawGroundTile(ctx, x, y) {
  ctx.fillStyle = "#7f5b34";
  ctx.fillRect(x, y, TILE_SIZE, TILE_SIZE);
  ctx.fillStyle = "#6f4f2d";
  ctx.fillRect(x, y + 9, TILE_SIZE, 2);
  ctx.fillStyle = "#9a7449";
  ctx.fillRect(x + 2, y + 2, 3, 2);
  ctx.fillRect(x + 10, y + 5, 3, 2);
}

function drawGoal(ctx, goal, camera) {
  const x = goal.x - camera.x;
  const y = goal.y - camera.y;
  ctx.fillStyle = "#f5f5f5";
  ctx.fillRect(x, y, 3, goal.h);
  ctx.fillStyle = "#ff5151";
  ctx.fillRect(x + 3, y + 2, goal.w - 3, 10);
}

function drawCheckpoints(ctx, checkpoints, currentCheckpoint, camera) {
  for (const checkpoint of checkpoints) {
    const x = checkpoint.x - camera.x;
    const y = checkpoint.y - camera.y;

    const active = checkpoint.x === currentCheckpoint.x && checkpoint.y === currentCheckpoint.y;
    ctx.fillStyle = "#f6f6f6";
    ctx.fillRect(x, y - 20, 2, 20);
    ctx.fillStyle = active ? "#8ceb75" : "#ffd64d";
    ctx.fillRect(x + 2, y - 18, 10, 7);
  }
}

function drawPlatforms(ctx, platforms, camera) {
  for (const platform of platforms) {
    if (platform.type === "crumbly" && platform.state === "broken") {
      continue;
    }

    const x = platform.x - camera.x;
    const y = platform.y - camera.y;

    ctx.fillStyle = platform.type === "crumbly" ? "#a05f52" : "#4f7899";
    ctx.fillRect(x, y, platform.w, platform.h);
    ctx.fillStyle = "rgba(255,255,255,0.3)";
    ctx.fillRect(x + 2, y + 1, platform.w - 4, 2);

    if (platform.type === "crumbly" && platform.state === "crumbling") {
      ctx.fillStyle = "#f6d2c6";
      ctx.fillRect(x + 4, y + 4, platform.w - 8, 1);
    }
  }
}

function drawHazards(ctx, hazards, camera) {
  for (const hazard of hazards) {
    const x = hazard.x - camera.x;
    const y = hazard.y - camera.y;

    ctx.fillStyle = "#d84f4f";
    ctx.fillRect(x, y, hazard.w, hazard.h);

    for (let i = 0; i < hazard.w; i += 4) {
      ctx.fillStyle = i % 8 === 0 ? "#ff9c9c" : "#7b2626";
      ctx.fillRect(x + i, y, 2, hazard.h);
    }
  }
}

function drawItems(ctx, items, camera, elapsed) {
  for (const coin of items.coins) {
    if (coin.collected) {
      continue;
    }
    const x = coin.x - camera.x;
    const y = coin.y - camera.y;
    const blink = Math.sin(elapsed * 8 + coin.x * 0.03) * 0.5 + 0.5;

    ctx.fillStyle = blink > 0.5 ? "#ffe26e" : "#ffd255";
    ctx.fillRect(x, y, 8, 8);
    ctx.fillStyle = "#b17b1f";
    ctx.fillRect(x + 2, y + 2, 4, 4);
  }

  for (const heart of items.hearts) {
    if (heart.collected) {
      continue;
    }
    const x = heart.x - camera.x;
    const y = heart.y - camera.y;

    ctx.fillStyle = "#ff6f8a";
    ctx.fillRect(x + 2, y + 2, 6, 6);
    ctx.fillRect(x, y + 4, 10, 4);
    ctx.fillStyle = "#ffd4de";
    ctx.fillRect(x + 2, y + 4, 2, 2);
  }
}

function drawEnemies(ctx, enemies, camera, elapsed) {
  for (const enemy of enemies) {
    const x = enemy.x - camera.x;
    const y = enemy.y - camera.y;

    if (enemy.kind === "patrol") {
      ctx.fillStyle = "#5b2f8f";
      ctx.fillRect(x, y, enemy.w, enemy.h);
      ctx.fillStyle = "#d5b9ff";
      ctx.fillRect(x + 2, y + 3, enemy.w - 4, 2);
      continue;
    }

    const pulse = Math.sin(elapsed * 10 + enemy.x * 0.01) * 0.5 + 0.5;
    ctx.fillStyle = pulse > 0.5 ? "#dc4d4d" : "#b23535";
    ctx.fillRect(x, y, enemy.w, enemy.h);
    ctx.fillStyle = "#ffe2e2";
    ctx.fillRect(x + 2, y + 2, enemy.w - 4, 2);
  }
}

function drawPlayer(ctx, player, camera, elapsed) {
  const x = Math.round(player.x - camera.x);
  const y = Math.round(player.y - camera.y);
  const step = Math.sin(elapsed * 12 + player.animTimer * 10) > 0 ? 1 : -1;

  if (player.invulnTimer > 0 && Math.floor(elapsed * 20) % 2 === 0) {
    return;
  }

  ctx.fillStyle = "rgba(0,0,0,0.32)";
  ctx.fillRect(x + 1, y + player.h, player.w - 2, 2);

  ctx.fillStyle = "#f4cfa1";
  ctx.fillRect(x + 2, y + 1, 8, 5);

  ctx.fillStyle = "#cc2f2f";
  ctx.fillRect(x + 1, y, 10, 3);

  ctx.fillStyle = "#2d69d8";
  ctx.fillRect(x + 1, y + 6, 10, 6);

  ctx.fillStyle = "#3a2b29";
  if (player.onGround) {
    ctx.fillRect(x + 2, y + 12 + step, 3, 2);
    ctx.fillRect(x + 7, y + 12 - step, 3, 2);
  } else {
    ctx.fillRect(x + 2, y + 12, 3, 2);
    ctx.fillRect(x + 7, y + 12, 3, 2);
  }
}

function drawStageHudText(ctx, stage) {
  ctx.fillStyle = "rgba(0,0,0,0.5)";
  ctx.fillRect(8, LOGICAL_HEIGHT - 20, 132, 14);
  ctx.fillStyle = "#eaf8ff";
  ctx.font = "9px monospace";
  ctx.fillText(`GOAL: ${stage.requiredCoins} COINS`, 14, LOGICAL_HEIGHT - 10);
}

function drawToast(ctx, text) {
  ctx.fillStyle = "rgba(0,0,0,0.72)";
  ctx.fillRect(LOGICAL_WIDTH / 2 - 70, 28, 140, 18);
  ctx.fillStyle = "#ffecc8";
  ctx.font = "10px monospace";
  ctx.fillText(text, LOGICAL_WIDTH / 2 - 46, 40);
}

function drawOverlayPanel(ctx, title, subtitle) {
  ctx.fillStyle = "rgba(0,0,0,0.7)";
  ctx.fillRect(88, 78, 208, 68);
  ctx.strokeStyle = "#e4f2ff";
  ctx.strokeRect(88.5, 78.5, 207, 67);
  ctx.fillStyle = "#f4fbff";
  ctx.font = "14px monospace";
  ctx.fillText(title, 144, 104);
  ctx.font = "10px monospace";
  ctx.fillText(subtitle, 114, 126);
}

function drawClearPanel(ctx, clearInfo) {
  ctx.fillStyle = "rgba(0,0,0,0.74)";
  ctx.fillRect(84, 62, 220, 96);
  ctx.strokeStyle = "#9eff8a";
  ctx.strokeRect(84.5, 62.5, 219, 95);

  ctx.fillStyle = "#ebffe6";
  ctx.font = "13px monospace";
  ctx.fillText("STAGE CLEAR", 138, 84);

  ctx.font = "10px monospace";
  ctx.fillText(`COIN SCORE  +${clearInfo.baseCoins}`, 102, 104);
  ctx.fillText(`CLEAR BONUS +${clearInfo.clearBonus}`, 102, 118);
  ctx.fillText(`LIFE BONUS  +${clearInfo.lifeBonus}`, 102, 132);

  ctx.fillStyle = "#fff1b0";
  ctx.fillText(`TOTAL ${clearInfo.total}`, 102, 146);
}

function drawDebugOverlay(ctx, scene, game) {
  ctx.fillStyle = "rgba(0,0,0,0.6)";
  ctx.fillRect(LOGICAL_WIDTH - 130, 8, 122, 48);
  ctx.fillStyle = "#c1ffb8";
  ctx.font = "9px monospace";
  ctx.fillText(`FPS ${Math.round(game.fps)}`, LOGICAL_WIDTH - 122, 22);
  ctx.fillText(`MODE ${scene.mode}`, LOGICAL_WIDTH - 122, 34);
  ctx.fillText(
    `P ${scene.player.x.toFixed(1)},${scene.player.y.toFixed(1)}`,
    LOGICAL_WIDTH - 122,
    46,
  );
}
