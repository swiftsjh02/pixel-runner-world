import { BLOCK_LIST } from "../world/blockTypes.js";

export function createHotbar(selectedIndex = 0) {
  return {
    slots: [...BLOCK_LIST],
    selectedIndex: clampIndex(selectedIndex),
  };
}

export function getSelectedBlock(hotbar) {
  return hotbar.slots[hotbar.selectedIndex];
}

export function selectHotbarIndex(hotbar, index) {
  hotbar.selectedIndex = clampIndex(index);
}

export function selectByDigit(hotbar, digit) {
  if (digit == null) {
    return;
  }
  const idx = digit - 1;
  if (idx < 0 || idx >= hotbar.slots.length) {
    return;
  }
  hotbar.selectedIndex = idx;
}

function clampIndex(index) {
  if (!Number.isFinite(index)) {
    return 0;
  }
  return Math.max(0, Math.min(BLOCK_LIST.length - 1, Math.floor(index)));
}
