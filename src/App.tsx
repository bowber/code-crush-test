import { useEffect } from 'react'
import { initGameWorld } from './utils/game';

function App() {
  let gameWorld: ReturnType<typeof initGameWorld>;

  useEffect(() => {
    if (gameWorld) {
      return; // Prevent re-initialization
    }
    gameWorld = initGameWorld();
  }, []);

  return (
    <>
      <canvas id="webgl"></canvas>
      <canvas id="debug-physics"></canvas>
    </>
  )
}

export default App
