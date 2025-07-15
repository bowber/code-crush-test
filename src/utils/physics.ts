import { Bodies, Body, Composite, Engine, Render, Runner } from "matter-js";
import { get_canvas_size } from "./helpers";

// Only show the physics debug renderer in development mode
const SHOW_RENDER = import.meta.env.PROD === false;

export const initPhysicsWorld = (canvasId = "debug-physics") => {
  const canvas = document.getElementById(canvasId);
  if (!(canvas instanceof HTMLCanvasElement)) {
    throw new Error("Canvas element with id 'debug-physics' not found.");
  }
  const engine = Engine.create({
    gravity: {
      x: 0,
      y: 0.01,
    },
  });
  const { width, height } = get_canvas_size();
  const render = Render.create({
    options: {
      wireframeBackground: "#000000aa",
      pixelRatio: window.devicePixelRatio,
      width,
      height,
    },
    canvas,
    engine,
  });
  const circleA = Bodies.circle(222, 0, 20, {
    inertia: Infinity,
    force: { x: 0, y: 0.01 },
    frictionAir: 0.0,
    density: 0.001,
  });

  const ground = Bodies.rectangle(width / 2, height, width * 2, height / 60, {
    isStatic: true,
    friction: 1,
  });

  const bucket = loadBucket();

  Composite.add(engine.world, [circleA, ground, bucket]);
  if (SHOW_RENDER) {
    Render.run(render);
  }

  const runner = Runner.create();
  Runner.run(runner, engine);

  return { engine, render, runner, boxA: circleA, bucket };
};

const loadBucket = () => {
  const { width, height } = get_canvas_size();
  const bucketColWidth = width / 50;
  const bucketColHeight = height / 5.5;
  const bucketColiderLeft = Bodies.rectangle(
    0,
    height,
    bucketColWidth,
    bucketColHeight,
    {
      angle: -Math.PI / 25,
      isStatic: true,
      collisionFilter: {
        group: -2,
        category: 0b00011,
      },
    }
  );
  const bucketColiderRight = Bodies.rectangle(
    width / 5,
    height,
    bucketColWidth,
    bucketColHeight,
    {
      angle: Math.PI / 25,
      isStatic: true,
      collisionFilter: {
        group: -2,
        category: 0b00011,
      },
    }
  );
  const bucketBottom = Bodies.rectangle(
    width / 10,
    height,
    bucketColHeight / 2,
    bucketColWidth,
    {
      isStatic: true,
      collisionFilter: {
        group: -2,
        category: 0b00011,
      },
    }
  );
  const bucket = Body.create({
    // frictionAir: Infinity,
    parts: [bucketColiderLeft, bucketColiderRight, bucketBottom],
    friction: 1,
    inertia: Infinity,
    isSensor: true,
    collisionFilter: {
      group: 2,
      category: 0b00011,
    },
  });
  return bucket;
};
