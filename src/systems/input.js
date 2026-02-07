import { ACTION } from "../constants.js";

const KEY_MAP = {
  ArrowLeft: ACTION.MOVE_LEFT,
  ArrowRight: ACTION.MOVE_RIGHT,
  a: ACTION.MOVE_LEFT,
  d: ACTION.MOVE_RIGHT,
  A: ACTION.MOVE_LEFT,
  D: ACTION.MOVE_RIGHT,
  " ": ACTION.JUMP,
  Spacebar: ACTION.JUMP,
  Space: ACTION.JUMP,
  ArrowUp: ACTION.JUMP,
  w: ACTION.JUMP,
  W: ACTION.JUMP,
  Shift: ACTION.DASH,
  ShiftLeft: ACTION.DASH,
  ShiftRight: ACTION.DASH,
  Enter: ACTION.JUMP,
  Escape: ACTION.PAUSE,
};

export function createInputSystem({ touchContainer }) {
  const down = new Map();
  const pressed = new Map();

  for (const action of Object.values(ACTION)) {
    down.set(action, false);
    pressed.set(action, false);
  }

  let debugToggleRequested = false;

  function setAction(action, value) {
    const prev = down.get(action);
    down.set(action, value);
    if (value && !prev) {
      pressed.set(action, true);
    }
  }

  function keyToAction(event) {
    if (event.key in KEY_MAP) {
      return KEY_MAP[event.key];
    }
    if (event.code in KEY_MAP) {
      return KEY_MAP[event.code];
    }
    return null;
  }

  function onKeyDown(event) {
    if (event.key === "F3") {
      debugToggleRequested = true;
      event.preventDefault();
      return;
    }

    const action = keyToAction(event);
    if (!action) {
      return;
    }

    setAction(action, true);
    event.preventDefault();
  }

  function onKeyUp(event) {
    const action = keyToAction(event);
    if (!action) {
      return;
    }

    setAction(action, false);
    event.preventDefault();
  }

  function onBlur() {
    for (const action of Object.values(ACTION)) {
      down.set(action, false);
      pressed.set(action, false);
    }
  }

  window.addEventListener("keydown", onKeyDown);
  window.addEventListener("keyup", onKeyUp);
  window.addEventListener("blur", onBlur);

  if (touchContainer) {
    const buttons = touchContainer.querySelectorAll("button[data-action]");
    for (const button of buttons) {
      const action = button.dataset.action;
      if (!down.has(action)) {
        continue;
      }

      const release = () => setAction(action, false);

      button.addEventListener("pointerdown", (event) => {
        event.preventDefault();
        setAction(action, true);
        button.setPointerCapture(event.pointerId);
      });
      button.addEventListener("pointerup", release);
      button.addEventListener("pointercancel", release);
      button.addEventListener("pointerleave", release);
    }
  }

  return {
    isDown(action) {
      return down.get(action) === true;
    },
    consumePress(action) {
      if (pressed.get(action)) {
        pressed.set(action, false);
        return true;
      }
      return false;
    },
    consumeDebugToggle() {
      if (!debugToggleRequested) {
        return false;
      }
      debugToggleRequested = false;
      return true;
    },
    endFrame() {
      for (const action of Object.values(ACTION)) {
        pressed.set(action, false);
      }
    },
    destroy() {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
      window.removeEventListener("blur", onBlur);
    },
  };
}
