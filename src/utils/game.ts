import {
  InstancedMesh,
  Matrix4,
  Mesh,
  MeshBasicMaterial,
  OrthographicCamera,
  PlaneGeometry,
  Scene,
  TextureLoader,
  Vector3,
  WebGLRenderer,
} from "three";
import {
  get_canvas_size,
  hideInstancedMeshAt,
  mapBodyToInstancedMeshPosition,
  mapMeshToBodyPosition,
} from "./helpers";
import { initPhysicsWorld } from "./physics";
import { DragControls } from "three/examples/jsm/Addons.js";
import { Events, World, type Body } from "matter-js";

const BUCKET_GROUND_Y = -0.75; // The y position of the bucket on the ground
const BUCKET_MOVEMENT_BOUNDS = 0.75; // The x bounds for the bucket movement
const IM_MAX_COUNT = 50; // Maximum number of instanced meshes
const GOLDEN_SCORE_INCREMENT = 2; // Score increment for golden popcorn
const BROWN_SCORE_INCREMENT = -1; // Score increment for brown popcorn
const POPCORN_GENERATION_INTERVAL = 1000; // Interval in milliseconds for generating popcorn
const loader = new TextureLoader();

const loadBackground = () => {
  const txt = loader.load("/bg.webp");
  const bg = new Mesh(
    new PlaneGeometry(2, 2),
    new MeshBasicMaterial({
      map: txt,
    })
  );
  bg.scale.set(1, 1, 1);
  return bg;
};

const loadBucket = () => {
  const txt_back = loader.load("/bucket_back.webp");
  const txt_front = loader.load("/bucket_front.webp");
  const bucket = new Mesh(
    new PlaneGeometry(0.75, 0.5), // Create a plane geometry
    new MeshBasicMaterial({
      map: txt_back,
      transparent: true,
    })
  );
  bucket.add(
    new Mesh(
      new PlaneGeometry(0.75, 0.5), // Create a plane geometry
      new MeshBasicMaterial({
        map: txt_front,
        transparent: true,
      })
    )
  );
  bucket.position.set(0, BUCKET_GROUND_Y, 0); // Position the bucket above the ground
  bucket.children[0].position.set(0, 0, 10); // Position the front part of the bucket in front of the back part
  return bucket;
};

const loadPopcorns = (type: "golden" | "brown" = "golden") => {
  const txt = loader.load(`/popcorn_${type}.webp`);
  const popcornIM = new InstancedMesh(
    new PlaneGeometry(0.2, 0.2), // Create a plane geometry
    new MeshBasicMaterial({
      map: txt,
      transparent: true,
    }),
    IM_MAX_COUNT
  );

  // Mix in random rotation and scale
  for (let i = 0; i < popcornIM.count; i++) {
    const mtx = new Matrix4();
    const scale = 1 + (Math.random() - 0.5) * 0.01 + 0.05; // Random scale between 0.05 and 0.15
    mtx.makeRotationX(Math.random() * Math.PI * 2);
    mtx.makeRotationY(Math.random() * Math.PI * 2);
    mtx.makeRotationZ(Math.random() * Math.PI * 2);
    mtx.scale(new Vector3(scale, scale, scale));
    // mtx.setPosition(-10, 0, 0); // Initial position off-screen
    popcornIM.setMatrixAt(i, mtx);
  }
  popcornIM.count = 0; // Set initial count to 0
  return popcornIM;
};

const loadGoldenPopcorns = () => loadPopcorns("golden");
const loadBrownPopcorns = () => loadPopcorns("brown");

export const initGameWorld = (opts: {
  canvasId?: string;
  physicsCanvasId?: string;
  onScoreIncrement?: (increment: number) => void;
  onGameOver: () => void;
}) => {
  const canvasId = opts.canvasId || "webgl";
  const physicsCanvasId = opts.physicsCanvasId || "debug-physics";
  const onGameOver = opts.onGameOver;
  const canvas = document.getElementById(canvasId);
  if (canvas === null) {
    throw new Error(`Canvas with id ${canvasId} not found`);
  }
  const renderer = new WebGLRenderer({
    canvas,
    antialias: true,
  });
  const scene = new Scene();

  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(window.devicePixelRatio);
  renderer.setClearColor(0x000000, 1); // Set background color to black
  const { width, height } = get_canvas_size();

  const camera = new OrthographicCamera();
  camera.position.set(0, 0, 100); // Set camera position
  camera.lookAt(0, 0, 0); // Look at the center of the scene

  scene.add(camera);

  renderer.render(scene, camera); // Initial render
  const updateSize = () => {
    renderer.setSize(width, height);
    camera.updateProjectionMatrix();
    renderer.render(scene, camera);
  };
  updateSize(); // Initial size update

  //   Initialize physics engine
  const physicsWorld = initPhysicsWorld(physicsCanvasId);

  // Add Events for collision detection
  Events.on(physicsWorld.engine, "collisionStart", (event) => {
    event.pairs.forEach((pair) => {
      const { bodyA, bodyB } = pair;

      const ground =
        bodyA.label === "ground"
          ? bodyA
          : bodyB.label === "ground"
          ? bodyB
          : null;
      const bucket =
        bodyA.label === "bucketSensor"
          ? bodyA
          : bodyB.label === "bucketSensor"
          ? bodyB
          : null;

      // Remove popcorn whenever it collides with ground or bucketSensor
      if (bucket || ground) {
        // Remove the popcorn body
        if (bodyA === bucket || bodyA === ground) {
          World.remove(physicsWorld.engine.world, bodyB);
        } else {
          World.remove(physicsWorld.engine.world, bodyA);
        }
      }

      if (!bucket) return;
      const isGoldenPopcorn =
        bodyA.label.startsWith("golden-") || bodyB.label.startsWith("golden-");
      const isBrownPopcorn =
        bodyA.label.startsWith("brown-") || bodyB.label.startsWith("brown-");
      const popcornBody = bodyA === bucket ? bodyB : bodyA;
      if (isGoldenPopcorn) {
        opts.onScoreIncrement?.(GOLDEN_SCORE_INCREMENT); // Increment score for golden popcorn
        // Move the popcorn out of scene
        const index = parseInt(popcornBody.label.split("-")[1]);
        hideInstancedMeshAt(assets.goldenPopcornIM, index);
        console.log(
          `Collected golden popcorn: ${bodyA.label} or ${bodyB.label}`
        );
      } else if (isBrownPopcorn) {
        opts.onScoreIncrement?.(BROWN_SCORE_INCREMENT); // Increment score for brown popcorn
        console.log(
          `Collected brown popcorn: ${bodyA.label} or ${bodyB.label}`
        );
        const index = parseInt(popcornBody.label.split("-")[1]);
        hideInstancedMeshAt(assets.brownPopcornIM, index);
      } else {
        console.warn("Unknown body collected:", bodyA, bodyB);
      }
    });
  });

  // Load assets and add them to the scene
  const assets = loadGameAssets();
  Object.values(assets).forEach((asset) => {
    scene.add(asset);
  });

  // Drag Control
  const dragControl = new DragControls(
    [assets.bucket],
    camera,
    renderer.domElement
  );
  dragControl.addEventListener("drag", (event) => {
    const bucket = event.object as Mesh;
    // Clamp the bucket's x position to the defined bounds
    bucket.position.x = Math.max(
      -BUCKET_MOVEMENT_BOUNDS,
      Math.min(BUCKET_MOVEMENT_BOUNDS, bucket.position.x)
    );
    // Set the y position to the ground level
    bucket.position.y = BUCKET_GROUND_Y;
  });
  let lastGoldenPopcornIndex = 0;
  let lastBrownPopcornIndex = 0;
  const brownPopcornMap = {} as Record<string, { body: Body }>;
  const goldenPopcornMap = {} as Record<string, { body: Body }>;

  const generatePopcorn = (type: "golden" | "brown") => {
    const map = type === "golden" ? goldenPopcornMap : brownPopcornMap;
    const im =
      type === "golden" ? assets.goldenPopcornIM : assets.brownPopcornIM;
    let index =
      type === "golden"
        ? lastGoldenPopcornIndex + 1
        : lastBrownPopcornIndex + 1;
    if (index >= IM_MAX_COUNT) {
      index = 0; // Reset index if it exceeds the maximum count, this is useful for testing unlimited popcorn generation
      console.warn(`Maximum popcorn instances reached for type: ${type}`);
      return;
    }

    im.count = index + 1; // Update the count of the instanced mesh

    const newBody = physicsWorld.addPopcorn(
      Math.random() * width * 0.8 + width * 0.1, // Random x position within bounds
      0,
      `${type}-${index}` // e.g. "golden-0", "brown-1"
    );

    // Remove old body if it exists
    const oldBody = map[index];
    if (oldBody?.body) {
      World.remove(physicsWorld.engine.world, oldBody.body);
    }
    map[index] = { body: newBody };

    if (type === "golden") {
      lastGoldenPopcornIndex = index;
    }
    if (type === "brown") {
      lastBrownPopcornIndex = index;
    }
  };
  // Game loop
  const animate = () => {
    requestAnimationFrame(animate);

    Object.entries(brownPopcornMap).forEach(([key, { body }]) => {
      mapBodyToInstancedMeshPosition(
        body,
        assets.brownPopcornIM,
        parseInt(key)
      );
    });
    Object.entries(goldenPopcornMap).forEach(([key, { body }]) => {
      mapBodyToInstancedMeshPosition(
        body,
        assets.goldenPopcornIM,
        parseInt(key)
      );
    });

    // Update bucket physics
    mapMeshToBodyPosition(assets.bucket, physicsWorld.bucket);
    assets.brownPopcornIM.instanceMatrix.needsUpdate = true;
    assets.goldenPopcornIM.instanceMatrix.needsUpdate = true;
    renderer.render(scene, camera);
  };
  animate();

  let interval = setInterval(() => {
    generatePopcorn("golden");
    generatePopcorn("brown");
    if (lastBrownPopcornIndex >= IM_MAX_COUNT - 1) {
      clearInterval(interval);
      onGameOver();
    }
  }, POPCORN_GENERATION_INTERVAL); // Generate popcorn every N second

  return { renderer, scene, canvas, camera, assets, physicsWorld };
};

const loadGameAssets = () => {
  // Load background
  const bg = loadBackground();
  // Load bucket
  const bucket = loadBucket();
  // Load golden popcorns
  const goldenPopcornIM = loadGoldenPopcorns();
  // Load brown popcorns
  const brownPopcornIM = loadBrownPopcorns();

  return {
    bg,
    bucket,
    goldenPopcornIM,
    brownPopcornIM,
  };
};
