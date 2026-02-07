import { GAME_STATE, LOGICAL_HEIGHT, LOGICAL_WIDTH } from "./constants.js";
import { stages } from "./data/stages.js";
import { createInputSystem } from "./systems/input.js";
import { createAudioSystem } from "./systems/audio.js";
import { loadSaveData, persistSaveData } from "./systems/save.js";
import { createWorldMapScene } from "./scenes/worldMapScene.js";
import { createStageScene } from "./scenes/stageScene.js";

const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");
ctx.imageSmoothingEnabled = false;

const hudStage = document.getElementById("hudStage");
const hudScore = document.getElementById("hudScore");
const hudCoins = document.getElementById("hudCoins");
const hudLives = document.getElementById("hudLives");

const saveData = loadSaveData();
const audio = createAudioSystem(saveData.sfxVolume);
const input = createInputSystem({ touchContainer: document.getElementById("touchPanel") });
const worldMapScene = createWorldMapScene({ stages, saveData });
const stageScene = createStageScene({ stages });

const game = {
  canvas,
  ctx,
  input,
  audio,
  stages,
  saveData,
  worldMapScene,
  stageScene,
  currentScene: null,
  currentState: GAME_STATE.WORLD_MAP,
  debugEnabled: true,
  time: 0,
  fps: 60,

  openWorldMap() {
    this.currentState = GAME_STATE.WORLD_MAP;
    this.currentScene = worldMapScene;
    if (typeof this.currentScene.onEnter === "function") {
      this.currentScene.onEnter(this);
    }
    this.updateHud({
      stageLabel: "WORLD MAP",
      scoreLabel: "SCORE --",
      coinLabel: "COIN --",
      lifeLabel: "LIFE ---",
    });
  },

  startStage(stageId) {
    this.currentState = GAME_STATE.STAGE_PLAY;
    this.currentScene = stageScene;
    stageScene.loadStage(stageId, this);
    if (typeof this.currentScene.onEnter === "function") {
      this.currentScene.onEnter(this);
    }
  },

  updateHud(data) {
    hudStage.textContent = data.stageLabel;
    hudScore.textContent = data.scoreLabel;
    hudCoins.textContent = data.coinLabel;
    hudLives.textContent = data.lifeLabel;
  },

  persistSave() {
    persistSaveData(this.saveData);
  },
};

resizeCanvas();
window.addEventListener("resize", resizeCanvas);

const unlockAudio = () => audio.unlock();
window.addEventListener("pointerdown", unlockAudio, { once: true });
window.addEventListener("keydown", unlockAudio, { once: true });

game.openWorldMap();

let lastTime = performance.now();
requestAnimationFrame(loop);

function loop(now) {
  const dt = Math.min((now - lastTime) / 1000, 1 / 30);
  lastTime = now;

  game.time += dt;
  game.fps = dt > 0 ? 1 / dt : 60;

  if (input.consumeDebugToggle()) {
    game.debugEnabled = !game.debugEnabled;
  }

  if (game.currentScene) {
    game.currentScene.update(dt, game);
    game.currentScene.render(ctx, game);

    if (typeof game.currentScene.getHudData === "function") {
      const hudData = game.currentScene.getHudData();
      if (hudData) {
        game.updateHud(hudData);
      }
    }

    if (game.currentScene === worldMapScene) {
      const selectedStage = game.stages[worldMapScene.selectedIndex];
      game.updateHud({
        stageLabel: `WORLD ${selectedStage.id}`,
        scoreLabel: `BEST ${game.saveData.bestScoresByStage[selectedStage.id] ?? 0}`,
        coinLabel: "COIN --",
        lifeLabel: `UNLOCK ${game.saveData.unlockedStageIndex + 1}/3`,
      });
    }
  }

  input.endFrame();
  requestAnimationFrame(loop);
}

function resizeCanvas() {
  const hasCoarsePointer = window.matchMedia("(pointer: coarse)").matches;
  const maxWidth = window.innerWidth - 24;
  const maxHeight = window.innerHeight - (hasCoarsePointer ? 270 : 150);

  let scale = Math.floor(Math.min(maxWidth / LOGICAL_WIDTH, maxHeight / LOGICAL_HEIGHT));
  if (!Number.isFinite(scale) || scale < 1) {
    scale = 1;
  }

  canvas.style.width = `${LOGICAL_WIDTH * scale}px`;
  canvas.style.height = `${LOGICAL_HEIGHT * scale}px`;
}
