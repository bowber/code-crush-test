import { Bodies, Body, Composite, Engine, Render, Runner } from "matter-js";
import { get_canvas_size } from "./helpers";
import { DEBUG_PHYSICS } from "./config";

// Only show the physics debug renderer in development mode
const SHOW_RENDER = DEBUG_PHYSICS;

export const initPhysicsWorld = (canvasId = "debug-physics") => {
  const canvas = document.getElementById(canvasId);
  if (!(canvas instanceof HTMLCanvasElement)) {
    throw new Error("Canvas element with id 'debug-physics' not found.");
  }
  const engine = Engine.create({
    gravity: {
      x: 0,
      y: 0.0,
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
  const ground = Bodies.rectangle(width / 2, height, width * 2, height / 60, {
    isStatic: true,
    friction: 1,
    label: "ground",
  });

  const { bucket } = loadBucket();

  Composite.add(engine.world, [ground, bucket]);
  if (SHOW_RENDER) {
    Render.run(render);
  }

  const runner = Runner.create();
  Runner.run(runner, engine);

  const addPopcorn = (x: number, y: number, label: string) => {
    const newPopcorn = createPopcorn(x, y);
    newPopcorn.label = label;
    Composite.add(engine.world, newPopcorn);
    return newPopcorn;
  };

  return { engine, render, runner, bucket, addPopcorn };
};

const loadBucket = () => {
  const { width, height } = get_canvas_size();
  const bucketColWidth = width / 50;
  const bucketColHeight = height / 6;
  const bucketColiderLeft = Bodies.rectangle(
    0,
    height - bucketColHeight / 2,
    bucketColWidth,
    bucketColHeight,
    {
      angle: -Math.PI / 25,
      frictionStatic: Infinity, // Don't allow the bucket parts to move
      isStatic: true,
    }
  );
  const bucketColiderRight = Bodies.rectangle(
    width / 5,
    height - bucketColHeight / 2,
    bucketColWidth,
    bucketColHeight,
    {
      angle: Math.PI / 25,
      frictionStatic: Infinity, // Don't allow the bucket parts to move
      isStatic: true,
    }
  );
  const bucketSensor = Bodies.rectangle(
    width / 10,
    height - bucketColHeight * 0.9,
    bucketColHeight * 0.75,
    bucketColWidth,
    {
      isStatic: true,
      isSensor: true,
      label: "bucketSensor",
      frictionStatic: Infinity, // Don't allow the bucket parts to move
    }
  );
  const bucketBottom = Bodies.rectangle(
    width / 10,
    height,
    bucketColHeight * 0.75,
    bucketColWidth,
    {
      isStatic: true,
      isSensor: true,
      frictionStatic: Infinity, // Don't allow the bucket parts to move
    }
  );
  const bucket = Body.create({
    parts: [bucketSensor, bucketColiderLeft, bucketColiderRight, bucketBottom],
    restitution: 1,
    density: 999999999999999999,
    frictionStatic: Infinity, // Don't allow the bucket parts to move
  });
  return {
    bucket,
  };
};

const createPopcorn = (x: number, y: number) => {
  const { width } = get_canvas_size();
  const popcorn = Bodies.circle(x, y, width / 25, {
    inertia: Infinity,
    force: {
      x: 0,
      y: 0.0002, // Adjusted to a more reasonable value
    },
    frictionAir: 0.0,
    mass: 0.01,
    collisionFilter: {
      group: -1,
    },
  });
  return popcorn;
};
