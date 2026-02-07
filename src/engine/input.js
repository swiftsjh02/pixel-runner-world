export function createInputSystem({ canvas }) {
  const down = new Set();
  const pressed = new Set();

  const mouse = {
    leftDown: false,
    rightDown: false,
    leftPressed: false,
    rightPressed: false,
    dx: 0,
    dy: 0,
  };

  let digitPressed = null;
  let debugToggle = false;

  function onKeyDown(event) {
    const code = event.code;
    if (!down.has(code)) {
      pressed.add(code);
    }
    down.add(code);

    if (code === "F3") {
      debugToggle = true;
      event.preventDefault();
    }

    if (code.startsWith("Digit")) {
      const value = Number(code.slice(5));
      if (value >= 1 && value <= 9) {
        digitPressed = value;
      }
    }
  }

  function onKeyUp(event) {
    down.delete(event.code);
  }

  function onMouseDown(event) {
    if (event.button === 0) {
      mouse.leftDown = true;
      mouse.leftPressed = true;
    } else if (event.button === 2) {
      mouse.rightDown = true;
      mouse.rightPressed = true;
    }
  }

  function onMouseUp(event) {
    if (event.button === 0) {
      mouse.leftDown = false;
    } else if (event.button === 2) {
      mouse.rightDown = false;
    }
  }

  function onMouseMove(event) {
    if (document.pointerLockElement !== canvas) {
      return;
    }
    mouse.dx += event.movementX;
    mouse.dy += event.movementY;
  }

  function onBlur() {
    down.clear();
    pressed.clear();
    mouse.leftDown = false;
    mouse.rightDown = false;
    mouse.leftPressed = false;
    mouse.rightPressed = false;
    mouse.dx = 0;
    mouse.dy = 0;
    digitPressed = null;
  }

  window.addEventListener("keydown", onKeyDown);
  window.addEventListener("keyup", onKeyUp);
  window.addEventListener("blur", onBlur);

  window.addEventListener("mousedown", onMouseDown);
  window.addEventListener("mouseup", onMouseUp);
  window.addEventListener("mousemove", onMouseMove);
  window.addEventListener("contextmenu", (event) => event.preventDefault());

  return {
    isDown(code) {
      return down.has(code);
    },
    consumePressed(code) {
      if (pressed.has(code)) {
        pressed.delete(code);
        return true;
      }
      return false;
    },
    consumeLookDelta() {
      const out = { dx: mouse.dx, dy: mouse.dy };
      mouse.dx = 0;
      mouse.dy = 0;
      return out;
    },
    consumeLeftClick() {
      if (mouse.leftPressed) {
        mouse.leftPressed = false;
        return true;
      }
      return false;
    },
    consumeRightClick() {
      if (mouse.rightPressed) {
        mouse.rightPressed = false;
        return true;
      }
      return false;
    },
    consumeDigitPress() {
      if (digitPressed == null) {
        return null;
      }
      const value = digitPressed;
      digitPressed = null;
      return value;
    },
    consumeDebugToggle() {
      if (!debugToggle) {
        return false;
      }
      debugToggle = false;
      return true;
    },
    endFrame() {
      pressed.clear();
      mouse.leftPressed = false;
      mouse.rightPressed = false;
    },
    destroy() {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
      window.removeEventListener("blur", onBlur);
      window.removeEventListener("mousedown", onMouseDown);
      window.removeEventListener("mouseup", onMouseUp);
      window.removeEventListener("mousemove", onMouseMove);
    },
  };
}
