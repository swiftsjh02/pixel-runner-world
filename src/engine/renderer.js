import * as THREE from "three";

export function createRenderer(canvas) {
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x7fb6ea);
  scene.fog = new THREE.Fog(0x7fb6ea, 70, 220);

  const camera = new THREE.PerspectiveCamera(75, 1, 0.1, 500);

  const renderer = new THREE.WebGLRenderer({
    canvas,
    antialias: false,
    powerPreference: "high-performance",
  });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setSize(window.innerWidth, window.innerHeight, false);

  const hemi = new THREE.HemisphereLight(0xdff2ff, 0x5a6f4b, 0.78);
  scene.add(hemi);

  const sun = new THREE.DirectionalLight(0xfff3d4, 0.76);
  sun.position.set(36, 72, 25);
  scene.add(sun);

  const grid = new THREE.GridHelper(240, 48, 0x7a907a, 0x7a907a);
  grid.position.y = 0.01;
  grid.material.opacity = 0.16;
  grid.material.transparent = true;
  scene.add(grid);

  function resize() {
    const width = window.innerWidth;
    const height = window.innerHeight;
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    renderer.setSize(width, height, false);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  }

  function renderFrame() {
    renderer.render(scene, camera);
  }

  function destroy() {
    grid.geometry.dispose();
    grid.material.dispose();
    renderer.dispose();
  }

  return {
    scene,
    camera,
    renderer,
    resize,
    renderFrame,
    destroy,
  };
}
