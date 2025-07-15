import {
  Euler,
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

export const initGameWorld = (canvasId = "webgl") => {
  const canvas = document.getElementById(canvasId);
  if (canvas === null) {
    throw new Error(`Canvas with id ${canvasId} not found`);
  }
  console.assert(canvas !== null, `Canvas with id ${canvasId} not found`);
  const renderer = new WebGLRenderer({
    canvas,
    antialias: true,
  });
  const scene = new Scene();

  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(window.devicePixelRatio);
  renderer.setClearColor(0x000000, 1); // Set background color to black

  const camera = new OrthographicCamera();
  camera.position.set(0, 0, 100); // Set camera position
  camera.lookAt(0, 0, 0); // Look at the center of the scene

  const bucket = loadBucket();

  const bg = loadBackground();
  scene.add(bg);
  scene.add(bucket); // Add a sample object to the scene
  scene.add(camera);

  renderer.render(scene, camera); // Initial render
  const updateSize = () => {
    const aspect = 600 / 1000; // Maintain aspect ratio of 600/1000
    const width = window.innerHeight * aspect;
    const height = window.innerHeight;
    renderer.setSize(width, height);
    camera.updateProjectionMatrix();
    renderer.render(scene, camera);
  };
  updateSize(); // Initial size update
  window.addEventListener("resize", updateSize);

  //  Controls
  const controls = new DragControls([bucket], camera, document.body);
  // prevent y movement
  controls.addEventListener("drag", (event) => {
    event.object.position.y = BUCKET_GROUND_Y; // Keep the object on the ground
    // Keep the object within x bounds
    event.object.position.x = Math.max(
      -BUCKET_MOVEMENT_BOUNDS,
      Math.min(BUCKET_MOVEMENT_BOUNDS, event.object.position.x)
    );
  });

  // Game loop
  const animate = () => {
    requestAnimationFrame(animate);
    // Update game logic here
    renderer.render(scene, camera);
  };
  animate();

  // Load golden popcorns
  const popcornIM = loadGoldenPopcorns();
  scene.add(popcornIM);
  // Load brown popcorns
  const brownPopcornIM = loadBrownPopcorns();
  scene.add(brownPopcornIM);

  return { renderer, scene, canvas };
};
