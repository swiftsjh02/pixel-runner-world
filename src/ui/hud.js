export function createHud() {
  const fpsEl = document.getElementById("hudFps");
  const posEl = document.getElementById("hudPos");
  const chunkEl = document.getElementById("hudChunk");
  const chunksEl = document.getElementById("hudChunks");

  return {
    render({ fps, player, chunk, loadedChunks }) {
      fpsEl.textContent = `FPS ${Math.round(fps)}`;
      posEl.textContent = `POS ${Math.floor(player.x)} ${Math.floor(player.y)} ${Math.floor(player.z)}`;
      chunkEl.textContent = `CHUNK ${chunk.cx},${chunk.cz}`;
      chunksEl.textContent = `LOADED ${loadedChunks}`;
    },
  };
}
