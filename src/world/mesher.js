import * as THREE from "three";
import { CHUNK_HEIGHT, CHUNK_SIZE } from "../config.js";
import { getBlockMeta, isTransparent, BlockId } from "./blockTypes.js";
import { getBlockLocal } from "./chunk.js";

const FACE_DEFS = [
  {
    offset: [1, 0, 0],
    normal: [1, 0, 0],
    shade: 0.86,
    verts: [
      [1, 0, 0],
      [1, 1, 0],
      [1, 1, 1],
      [1, 0, 1],
    ],
  },
  {
    offset: [-1, 0, 0],
    normal: [-1, 0, 0],
    shade: 0.74,
    verts: [
      [0, 0, 1],
      [0, 1, 1],
      [0, 1, 0],
      [0, 0, 0],
    ],
  },
  {
    offset: [0, 1, 0],
    normal: [0, 1, 0],
    shade: 1.0,
    verts: [
      [0, 1, 1],
      [1, 1, 1],
      [1, 1, 0],
      [0, 1, 0],
    ],
  },
  {
    offset: [0, -1, 0],
    normal: [0, -1, 0],
    shade: 0.56,
    verts: [
      [0, 0, 0],
      [1, 0, 0],
      [1, 0, 1],
      [0, 0, 1],
    ],
  },
  {
    offset: [0, 0, 1],
    normal: [0, 0, 1],
    shade: 0.92,
    verts: [
      [1, 0, 1],
      [1, 1, 1],
      [0, 1, 1],
      [0, 0, 1],
    ],
  },
  {
    offset: [0, 0, -1],
    normal: [0, 0, -1],
    shade: 0.67,
    verts: [
      [0, 0, 0],
      [0, 1, 0],
      [1, 1, 0],
      [1, 0, 0],
    ],
  },
];

export function buildChunkGeometry(chunk, getBlockAtWorld) {
  const opaqueBuilder = createBuilder();
  const transparentBuilder = createBuilder();

  const chunkWorldX = chunk.cx * CHUNK_SIZE;
  const chunkWorldZ = chunk.cz * CHUNK_SIZE;

  for (let ly = 0; ly < CHUNK_HEIGHT; ly += 1) {
    for (let lz = 0; lz < CHUNK_SIZE; lz += 1) {
      for (let lx = 0; lx < CHUNK_SIZE; lx += 1) {
        const blockId = getBlockLocal(chunk, lx, ly, lz);
        if (blockId === BlockId.AIR) {
          continue;
        }

        const wx = chunkWorldX + lx;
        const wy = ly;
        const wz = chunkWorldZ + lz;

        const transparent = isTransparent(blockId);
        const builder = transparent ? transparentBuilder : opaqueBuilder;

        for (const face of FACE_DEFS) {
          const nx = wx + face.offset[0];
          const ny = wy + face.offset[1];
          const nz = wz + face.offset[2];
          const neighborId = getBlockAtWorld(nx, ny, nz);

          if (!shouldRenderFace(blockId, neighborId)) {
            continue;
          }

          addFace(builder, blockId, lx, ly, lz, face);
        }
      }
    }
  }

  return {
    opaque: toBufferGeometry(opaqueBuilder),
    transparent: toBufferGeometry(transparentBuilder),
  };
}

function shouldRenderFace(blockId, neighborId) {
  if (neighborId === BlockId.AIR) {
    return true;
  }

  const blockTransparent = isTransparent(blockId);
  const neighborTransparent = isTransparent(neighborId);

  if (!blockTransparent) {
    return neighborTransparent;
  }

  if (neighborId === blockId) {
    return false;
  }

  return neighborId === BlockId.AIR;
}

function addFace(builder, blockId, lx, ly, lz, face) {
  const base = builder.positions.length / 3;
  const [nr, ng, nb] = colorFor(blockId, face.shade);

  for (const vert of face.verts) {
    builder.positions.push(lx + vert[0], ly + vert[1], lz + vert[2]);
    builder.normals.push(face.normal[0], face.normal[1], face.normal[2]);
    builder.colors.push(nr, ng, nb);
  }

  builder.indices.push(base, base + 1, base + 2, base, base + 2, base + 3);
}

function colorFor(blockId, shade) {
  const meta = getBlockMeta(blockId);
  return [meta.color[0] * shade, meta.color[1] * shade, meta.color[2] * shade];
}

function createBuilder() {
  return {
    positions: [],
    normals: [],
    colors: [],
    indices: [],
  };
}

function toBufferGeometry(builder) {
  if (builder.indices.length === 0) {
    return null;
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.Float32BufferAttribute(builder.positions, 3));
  geometry.setAttribute("normal", new THREE.Float32BufferAttribute(builder.normals, 3));
  geometry.setAttribute("color", new THREE.Float32BufferAttribute(builder.colors, 3));
  geometry.setIndex(builder.indices);
  geometry.computeBoundingSphere();
  return geometry;
}
