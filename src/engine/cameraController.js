import * as THREE from "three";

const LOOK_SENSITIVITY = 0.0023;
const MAX_PITCH = Math.PI / 2 - 0.01;

export function createCameraController({ camera, canvas, input }) {
  let yaw = 0;
  let pitch = 0;

  function applyRotation() {
    camera.rotation.order = "YXZ";
    camera.rotation.y = yaw;
    camera.rotation.x = pitch;
  }

  function lockPointer() {
    if (document.pointerLockElement !== canvas) {
      canvas.requestPointerLock({ unadjustedMovement: true });
    }
  }

  function unlockPointer() {
    if (document.pointerLockElement === canvas) {
      document.exitPointerLock();
    }
  }

  function onPointerLockChange() {
    const locked = document.pointerLockElement === canvas;
    document.body.classList.toggle("pointer-locked", locked);
  }

  function onCanvasClick() {
    lockPointer();
  }

  canvas.addEventListener("click", onCanvasClick);
  document.addEventListener("pointerlockchange", onPointerLockChange);

  function update() {
    if (document.pointerLockElement !== canvas) {
      return;
    }

    const look = input.consumeLookDelta();
    if (look.dx !== 0 || look.dy !== 0) {
      yaw -= look.dx * LOOK_SENSITIVITY;
      pitch -= look.dy * LOOK_SENSITIVITY;
      pitch = Math.max(-MAX_PITCH, Math.min(MAX_PITCH, pitch));
      applyRotation();
    }
  }

  function setPosition(x, y, z) {
    camera.position.set(x, y, z);
  }

  function setOrientation(nextYaw, nextPitch) {
    yaw = nextYaw;
    pitch = Math.max(-MAX_PITCH, Math.min(MAX_PITCH, nextPitch));
    applyRotation();
  }

  function getForwardVector() {
    const forward = new THREE.Vector3(0, 0, -1);
    forward.applyEuler(camera.rotation);
    return forward.normalize();
  }

  function getYaw() {
    return yaw;
  }

  function getPitch() {
    return pitch;
  }

  function isPointerLocked() {
    return document.pointerLockElement === canvas;
  }

  function destroy() {
    canvas.removeEventListener("click", onCanvasClick);
    document.removeEventListener("pointerlockchange", onPointerLockChange);
    unlockPointer();
  }

  applyRotation();

  return {
    update,
    lockPointer,
    unlockPointer,
    setPosition,
    setOrientation,
    getForwardVector,
    getYaw,
    getPitch,
    isPointerLocked,
    destroy,
  };
}
