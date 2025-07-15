import type Matter from "matter-js";
import { Matrix4, type InstancedMesh, type Mesh } from "three";

export const get_canvas_size = () => {
  const aspect = 600 / 1000; // Maintain aspect ratio of 600/1000
  const width = window.innerHeight * aspect;
  const height = window.innerHeight;
  return { width, height };
};

export const mapBodyToMeshPosition = (body: Matter.Body, mesh: Mesh) => {
  const { position } = body;
  const { x, y } = physicsToGameCoords(position.x, position.y);
  mesh.position.setX(x);
  mesh.position.setY(y);
};

export const mapBodyToInstancedMeshPosition = (
  body: Matter.Body,
  instancedMesh: InstancedMesh,
  index: number
) => {
  const { position } = body;
  const { x, y } = physicsToGameCoords(position.x, position.y);
  const matrix = new Matrix4();
  instancedMesh.getMatrixAt(index, matrix);
  matrix.setPosition(x, y, 0);
  instancedMesh.setMatrixAt(index, matrix);
};

export const mapMeshToBodyPosition = (mesh: Mesh, body: Matter.Body) => {
  const { x, y } = gameToPhysicsCoords(mesh.position.x, mesh.position.y);
  body.position.x = x;
  body.position.y = y;
};

export const physicsToGameCoords = (x: number, y: number) => {
  const { width, height } = get_canvas_size();
  return {
    x: -1 + (x / width) * 2,
    y: 1 - (y / height) * 2,
  };
};

export const gameToPhysicsCoords = (x: number, y: number) => {
  const { width, height } = get_canvas_size();
  return {
    x: ((x + 1) / 2) * width,
    y: ((1 - y) / 2) * height,
  };
};
