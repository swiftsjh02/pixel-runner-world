import { ACTION, GAME_STATE, LOGICAL_HEIGHT, LOGICAL_WIDTH } from "../constants.js";

export function createWorldMapScene({ stages, saveData }) {
  const scene = {
    key: GAME_STATE.WORLD_MAP,
    selectedIndex: Math.min(saveData.unlockedStageIndex, stages.length - 1),
    pulse: 0,
    onEnter(game) {
      const latestIndex = Math.min(game.saveData.unlockedStageIndex, stages.length - 1);
      this.selectedIndex = Math.min(this.selectedIndex, latestIndex);
    },
    update(dt, game) {
      this.pulse += dt;

      const unlockedIndex = game.saveData.unlockedStageIndex;
      if (game.input.consumePress(ACTION.MOVE_LEFT)) {
        this.selectedIndex = Math.max(0, this.selectedIndex - 1);
      }
      if (game.input.consumePress(ACTION.MOVE_RIGHT)) {
        this.selectedIndex = Math.min(unlockedIndex, this.selectedIndex + 1);
      }

      if (game.input.consumePress(ACTION.JUMP) || game.input.consumePress(ACTION.DASH)) {
        const target = stages[this.selectedIndex];
        if (target && this.selectedIndex <= unlockedIndex) {
          game.startStage(target.id);
        }
      }
    },
    render(ctx, game) {
      drawBackground(ctx);
      drawNodes(ctx, game, this.selectedIndex);
      drawMapUi(ctx, game, this.selectedIndex);
    },
  };

  return scene;
}

function drawBackground(ctx) {
  ctx.fillStyle = "#5ea0e8";
  ctx.fillRect(0, 0, LOGICAL_WIDTH, LOGICAL_HEIGHT);

  ctx.fillStyle = "#7cb7f0";
  ctx.fillRect(0, LOGICAL_HEIGHT - 82, LOGICAL_WIDTH, 82);

  ctx.fillStyle = "#4f9f4f";
  ctx.fillRect(0, LOGICAL_HEIGHT - 52, LOGICAL_WIDTH, 52);

  for (let i = 0; i < 8; i += 1) {
    const x = 20 + i * 48;
    const y = 18 + (i % 2) * 6;
    drawCloud(ctx, x, y);
  }
}

function drawCloud(ctx, x, y) {
  ctx.fillStyle = "rgba(255,255,255,0.9)";
  ctx.fillRect(x, y, 24, 8);
  ctx.fillRect(x + 4, y - 4, 14, 4);
}

function drawNodes(ctx, game, selectedIndex) {
  const nodes = [
    { x: 80, y: 132 },
    { x: 188, y: 116 },
    { x: 296, y: 132 },
  ];

  ctx.strokeStyle = "#7a4e17";
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.moveTo(nodes[0].x, nodes[0].y);
  ctx.lineTo(nodes[1].x, nodes[1].y);
  ctx.lineTo(nodes[2].x, nodes[2].y);
  ctx.stroke();

  const unlockedIndex = game.saveData.unlockedStageIndex;

  for (let i = 0; i < nodes.length; i += 1) {
    const node = nodes[i];
    const unlocked = i <= unlockedIndex;
    const selected = i === selectedIndex;

    ctx.fillStyle = unlocked ? "#ffde59" : "#65758d";
    ctx.fillRect(node.x - 12, node.y - 12, 24, 24);

    ctx.fillStyle = unlocked ? "#7a4e17" : "#35414f";
    ctx.fillRect(node.x - 9, node.y - 9, 18, 18);

    ctx.fillStyle = unlocked ? "#fff4be" : "#8ea0b5";
    ctx.font = "10px monospace";
    ctx.fillText(`1-${i + 1}`, node.x - 10, node.y + 4);

    if (selected) {
      ctx.strokeStyle = "#ffffff";
      ctx.lineWidth = 2;
      ctx.strokeRect(node.x - 16, node.y - 16, 32, 32);
    }

    const stageId = `1-${i + 1}`;
    const best = game.saveData.bestScoresByStage[stageId] ?? 0;
    ctx.fillStyle = "rgba(0,0,0,0.6)";
    ctx.fillRect(node.x - 20, node.y + 18, 40, 12);
    ctx.fillStyle = "#d7ecff";
    ctx.font = "8px monospace";
    ctx.fillText(`${best}`, node.x - 16, node.y + 27);
  }
}

function drawMapUi(ctx, game, selectedIndex) {
  const stage = game.stages[selectedIndex];
  const unlocked = selectedIndex <= game.saveData.unlockedStageIndex;

  ctx.fillStyle = "rgba(0,0,0,0.65)";
  ctx.fillRect(14, 10, 356, 36);
  ctx.strokeStyle = "rgba(226,248,255,0.4)";
  ctx.strokeRect(14.5, 10.5, 355, 35);

  ctx.fillStyle = "#f5feff";
  ctx.font = "11px monospace";
  ctx.fillText(`WORLD MAP  ${stage.id} ${stage.name}`, 24, 26);
  ctx.fillText(
    unlocked ? "ENTER/SPACE: START" : "LOCKED STAGE",
    24,
    40,
  );
}
