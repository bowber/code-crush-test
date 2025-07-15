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
  mapBodyToInstancedMeshPosition,
  mapMeshToBodyPosition,
} from "./helpers";
import { initPhysicsWorld } from "./physics";
import { DragControls } from "three/examples/jsm/Addons.js";

const BUCKET_GROUND_Y = -0.75; // The y position of the bucket on the ground
const BUCKET_MOVEMENT_BOUNDS = 0.75; // The x bounds for the bucket movement

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
    200
  );

  // Mix in random rotation and scale
  for (let i = 0; i < popcornIM.count; i++) {
    const mtx = new Matrix4();
    const scale = 1 + (Math.random() - 0.5) * 0.01 + 0.05; // Random scale between 0.05 and 0.15
    mtx.makeRotationX(Math.random() * Math.PI * 2);
    mtx.makeRotationY(Math.random() * Math.PI * 2);
    mtx.makeRotationZ(Math.random() * Math.PI * 2);
    mtx.scale(new Vector3(scale, scale, scale));
    popcornIM.setMatrixAt(i, mtx);
  }
  return popcornIM;
};

const loadGoldenPopcorns = () => loadPopcorns("golden");
const loadBrownPopcorns = () => loadPopcorns("brown");

export const initGameWorld = (
  canvasId = "webgl",
  physicsCanvasId = "debug-physics"
) => {
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

  // Load assets and add them to the scene
  const assets = loadGameAssets();
  Object.values(assets).forEach((asset) => {
    scene.add(asset);
  });

  // Drag Control
  const dragControl = new DragControls([assets.bucket], camera, document.body);
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
  // Game loop
  const animate = () => {
    requestAnimationFrame(animate);

    mapBodyToInstancedMeshPosition(physicsWorld.boxA, assets.brownPopcornIM, 0);
    mapMeshToBodyPosition(assets.bucket, physicsWorld.bucket);
    assets.brownPopcornIM.instanceMatrix.needsUpdate = true;
    renderer.render(scene, camera);
  };
  animate();

  return { renderer, scene, canvas, camera, assets, physicsWorld };
};

const loadGameAssets = () => {
  // Load background
  const bg = loadBackground();
  // Load bucket
  const bucket = loadBucket();
  // Load golden popcorns
  const popcornIM = loadGoldenPopcorns();
  // Load brown popcorns
  const brownPopcornIM = loadBrownPopcorns();

  return {
    bg,
    bucket,
    popcornIM,
    brownPopcornIM,
  };
};
