import { BLOCK_INTERACT_DISTANCE, DEFAULT_SEED } from "./config.js";
import { createCameraController } from "./engine/cameraController.js";
import { createInputSystem } from "./engine/input.js";
import { createRenderer } from "./engine/renderer.js";
import { createHotbar, getSelectedBlock, selectByDigit } from "./game/hotbar.js";
import { updatePlayerPhysics } from "./game/physics.js";
import { createPlayerState, getEyePosition, getPlayerAabb } from "./game/player.js";
import { createAudioSystem } from "./systems/audio.js";
import {
  defaultWorldMeta,
  loadChunkFromDb,
  loadWorldMeta,
  saveChunkToDb,
  saveWorldMeta,
} from "./systems/saveIndexedDb.js";
import { createHotbarView } from "./ui/hotbarView.js";
import { createHud } from "./ui/hud.js";
import { BlockId } from "./world/blockTypes.js";
import { createChunkManager } from "./world/chunkManager.js";
import { raycastBlock } from "./world/raycast.js";
import { terrainHeight } from "./world/worldGen.js";

void bootstrap();

async function bootstrap() {
  const canvas = document.getElementById("gameCanvas");
  const hotbarRoot = document.getElementById("hotbar");
  const hudTop = document.querySelector(".hud-top");

  if (!(canvas instanceof HTMLCanvasElement)) {
    throw new Error("Missing #gameCanvas element.");
  }
  if (!(hotbarRoot instanceof HTMLElement)) {
    throw new Error("Missing #hotbar element.");
  }
  if (!(hudTop instanceof HTMLElement)) {
    throw new Error("Missing HUD top element.");
  }

  const renderer = createRenderer(canvas);
  const input = createInputSystem({ canvas });
  const hud = createHud();
  const hotbarView = createHotbarView({ root: hotbarRoot });

  const savedMeta = await safeLoadMeta();
  const seed = Number.isFinite(savedMeta?.seed) ? savedMeta.seed : DEFAULT_SEED;
  const baseSpawn = {
    x: 0,
    y: terrainHeight(seed, 0, 0) + 2,
    z: 0,
  };

  const meta = savedMeta ?? defaultWorldMeta(seed);
  const spawn = normalizePlayerMeta(meta.player, baseSpawn);
  const player = createPlayerState(spawn);
  const hotbar = createHotbar(meta.selectedHotbar ?? 0);
  const audio = createAudioSystem(meta.volume ?? 0.7);

  const chunkManager = createChunkManager({
    scene: renderer.scene,
    seed,
    saveStore: {
      loadChunk: loadChunkFromDb,
      saveChunk: saveChunkToDb,
    },
  });

  const cameraController = createCameraController({
    camera: renderer.camera,
    canvas,
    input,
  });
  cameraController.setOrientation(spawn.yaw, spawn.pitch);

  let debugVisible = true;
  let metaSaveTimer = null;
  let lastTs = performance.now();
  let fps = 60;

  window.addEventListener("resize", renderer.resize);
  window.addEventListener(
    "pointerdown",
    () => {
      audio.unlock();
    },
    { passive: true }
  );
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "hidden") {
      void flushAndSaveNow();
    }
  });
  window.addEventListener("beforeunload", () => {
    void flushAndSaveNow();
  });

  chunkManager.ensureAround(player);
  {
    const eye = getEyePosition(player);
    cameraController.setPosition(eye.x, eye.y, eye.z);
  }
  hotbarView.render(hotbar);
  renderer.resize();

  requestAnimationFrame(loop);

  function loop(ts) {
    const dt = Math.min((ts - lastTs) / 1000, 0.05);
    lastTs = ts;

    if (input.consumeDebugToggle()) {
      debugVisible = !debugVisible;
      hudTop.style.display = debugVisible ? "flex" : "none";
    }

    const digit = input.consumeDigitPress();
    if (digit != null) {
      selectByDigit(hotbar, digit);
      hotbarView.render(hotbar);
      scheduleMetaSave();
    }

    cameraController.update();
    chunkManager.ensureAround(player);

    if (isChunkNeighborhoodReady(player.x, player.z)) {
      const controls = captureControls();
      const events = updatePlayerPhysics(player, controls, chunkManager, dt);

      if (events.jumped) {
        audio.playJump();
      }

      if (player.onGround && events.movedDistance > 0) {
        player.stepTravel += events.movedDistance;
        if (player.stepTravel >= 1.9) {
          audio.playStep();
          player.stepTravel = 0;
        }
      }

      handleBlockInteraction();
    }

    if (player.y < -20) {
      respawnPlayer(baseSpawn);
    }

    chunkManager.rebuildDirtyMeshes();

    const eye = getEyePosition(player);
    cameraController.setPosition(eye.x, eye.y, eye.z);

    const instantFps = dt > 0 ? 1 / dt : 60;
    fps = fps * 0.9 + instantFps * 0.1;

    hud.render({
      fps,
      player,
      chunk: chunkManager.getChunkCoordAt(player.x, player.z),
      loadedChunks: chunkManager.getLoadedChunkCount(),
    });
    hotbarView.render(hotbar);
    renderer.renderFrame();

    input.endFrame();
    requestAnimationFrame(loop);
  }

  function captureControls() {
    const moveX =
      toAxis(input.isDown("KeyD") || input.isDown("ArrowRight")) -
      toAxis(input.isDown("KeyA") || input.isDown("ArrowLeft"));
    const moveZ =
      toAxis(input.isDown("KeyS") || input.isDown("ArrowDown")) -
      toAxis(input.isDown("KeyW") || input.isDown("ArrowUp"));

    return {
      moveX,
      moveZ,
      jumpPressed: input.consumePressed("Space"),
      sprint: input.isDown("ShiftLeft") || input.isDown("ShiftRight"),
      yaw: cameraController.getYaw(),
    };
  }

  function handleBlockInteraction() {
    if (!cameraController.isPointerLocked()) {
      input.consumeLeftClick();
      input.consumeRightClick();
      return;
    }

    const eye = getEyePosition(player);
    const forward = cameraController.getForwardVector();
    const hit = raycastBlock(eye, forward, chunkManager.getBlock, BLOCK_INTERACT_DISTANCE);

    if (input.consumeLeftClick() && hit) {
      if (chunkManager.setBlock(hit.x, hit.y, hit.z, BlockId.AIR)) {
        audio.playBreak();
        scheduleMetaSave();
      }
    }

    if (input.consumeRightClick() && hit) {
      const px = hit.x + hit.normal.x;
      const py = hit.y + hit.normal.y;
      const pz = hit.z + hit.normal.z;
      const selected = getSelectedBlock(hotbar);

      if (selected !== BlockId.AIR && canPlaceBlock(px, py, pz)) {
        if (chunkManager.setBlock(px, py, pz, selected)) {
          audio.playPlace();
          scheduleMetaSave();
        }
      }
    }
  }

  function canPlaceBlock(x, y, z) {
    if (chunkManager.getBlock(x, y, z) !== BlockId.AIR) {
      return false;
    }

    const blockAabb = {
      minX: x,
      maxX: x + 1,
      minY: y,
      maxY: y + 1,
      minZ: z,
      maxZ: z + 1,
    };
    const playerAabb = getPlayerAabb(player);

    return !aabbOverlap(playerAabb, blockAabb);
  }

  function isChunkNeighborhoodReady(x, z) {
    const center = chunkManager.getChunkCoordAt(x, z);
    for (let dz = -1; dz <= 1; dz += 1) {
      for (let dx = -1; dx <= 1; dx += 1) {
        const chunk = chunkManager.getChunkForDebug({ cx: center.cx + dx, cz: center.cz + dz });
        if (!chunk) {
          return false;
        }
      }
    }
    return true;
  }

  function respawnPlayer(spawnPoint) {
    player.x = spawnPoint.x;
    player.y = spawnPoint.y;
    player.z = spawnPoint.z;
    player.vx = 0;
    player.vy = 0;
    player.vz = 0;
    player.onGround = false;
    player.stepTravel = 0;
    scheduleMetaSave();
  }

  function scheduleMetaSave() {
    if (metaSaveTimer) {
      clearTimeout(metaSaveTimer);
    }

    metaSaveTimer = setTimeout(() => {
      metaSaveTimer = null;
      void saveWorldMeta(buildMetaPayload());
    }, 900);
  }

  async function flushAndSaveNow() {
    if (metaSaveTimer) {
      clearTimeout(metaSaveTimer);
      metaSaveTimer = null;
    }

    const payload = buildMetaPayload();
    await Promise.allSettled([chunkManager.flushDirtyChunks(), saveWorldMeta(payload)]);
  }

  function buildMetaPayload() {
    return {
      version: 1,
      seed,
      player: {
        x: player.x,
        y: player.y,
        z: player.z,
        yaw: cameraController.getYaw(),
        pitch: cameraController.getPitch(),
      },
      selectedHotbar: hotbar.selectedIndex,
      volume: audio.getVolume(),
    };
  }
}

async function safeLoadMeta() {
  try {
    const loaded = await loadWorldMeta();
    if (!loaded || loaded.version !== 1) {
      return null;
    }
    return loaded;
  } catch {
    return null;
  }
}

function normalizePlayerMeta(savedPlayer, fallbackSpawn) {
  if (!savedPlayer) {
    return {
      ...fallbackSpawn,
      yaw: 0,
      pitch: 0,
    };
  }

  return {
    x: finiteOr(savedPlayer.x, fallbackSpawn.x),
    y: finiteOr(savedPlayer.y, fallbackSpawn.y),
    z: finiteOr(savedPlayer.z, fallbackSpawn.z),
    yaw: finiteOr(savedPlayer.yaw, 0),
    pitch: finiteOr(savedPlayer.pitch, 0),
  };
}

function aabbOverlap(a, b) {
  return (
    a.minX < b.maxX &&
    a.maxX > b.minX &&
    a.minY < b.maxY &&
    a.maxY > b.minY &&
    a.minZ < b.maxZ &&
    a.maxZ > b.minZ
  );
}

function finiteOr(value, fallback) {
  return Number.isFinite(value) ? value : fallback;
}

function toAxis(active) {
  return active ? 1 : 0;
}
