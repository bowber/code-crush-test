import { BoxGeometry, Mesh, MeshBasicMaterial, PerspectiveCamera, PlaneGeometry, Scene, WebGLRenderer } from "three";

export const initGameWorld = (canvasId="webgl") => {
    const canvas = document.getElementById(canvasId);
    if (canvas === null) {
        throw new Error(`Canvas with id ${canvasId} not found`);
    }
    console.assert(canvas !== null, `Canvas with id ${canvasId} not found`);
    const renderer = new WebGLRenderer({
        canvas,
        antialias: true,
    })
    const scene = new Scene();
    
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setClearColor(0x000000, 1); // Set background color to black

    const camera = new PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.set(0, 0, 5); // Set camera position
    camera.lookAt(0, 0, 0); // Look at the center of the scene

    const sampleObject = new Mesh(
        new PlaneGeometry(1, 1), // Create a plane geometry
        new MeshBasicMaterial({ color: 0x00ffff }) // Green color
    );
    scene.add(sampleObject); // Add a sample object to the scene
    scene.add(camera);

    renderer.render(scene, camera); // Initial render
    window.addEventListener('resize', () => {
        const width = window.innerWidth;
        const height = window.innerHeight;
        renderer.setSize(width, height);
        camera.aspect = width / height;
        camera.updateProjectionMatrix();
        renderer.render(scene, camera);
    });

    // Game loop
    const animate = () => {
        requestAnimationFrame(animate);
        // Update game logic here
        renderer.render(scene, camera);
    };
    animate();
    return { renderer, scene, canvas };
}