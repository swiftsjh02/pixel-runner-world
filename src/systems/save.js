import { SAVE_KEY, SAVE_VERSION } from "../constants.js";

export function defaultSaveData() {
  return {
    version: SAVE_VERSION,
    unlockedStageIndex: 0,
    bestScoresByStage: {},
    lastPlayedStageId: "1-1",
    sfxVolume: 0.7,
  };
}

export function loadSaveData() {
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    if (!raw) {
      return defaultSaveData();
    }

    const parsed = JSON.parse(raw);
    return sanitizeSaveData(parsed);
  } catch {
    return defaultSaveData();
  }
}

export function persistSaveData(saveData) {
  try {
    localStorage.setItem(SAVE_KEY, JSON.stringify(sanitizeSaveData(saveData)));
  } catch {
    // 저장 실패 시 게임 진행은 계속한다.
  }
}

function sanitizeSaveData(value) {
  const fallback = defaultSaveData();
  if (!value || typeof value !== "object") {
    return fallback;
  }

  return {
    version: Number.isFinite(value.version) ? value.version : SAVE_VERSION,
    unlockedStageIndex: Number.isFinite(value.unlockedStageIndex)
      ? Math.max(0, Math.floor(value.unlockedStageIndex))
      : fallback.unlockedStageIndex,
    bestScoresByStage:
      value.bestScoresByStage && typeof value.bestScoresByStage === "object"
        ? value.bestScoresByStage
        : {},
    lastPlayedStageId:
      typeof value.lastPlayedStageId === "string" && value.lastPlayedStageId
        ? value.lastPlayedStageId
        : fallback.lastPlayedStageId,
    sfxVolume:
      typeof value.sfxVolume === "number" && value.sfxVolume >= 0 && value.sfxVolume <= 1
        ? value.sfxVolume
        : fallback.sfxVolume,
  };
}
