import { useEffect, useState } from 'react'
import { initGameWorld } from './utils/game';

function App() {
  const [count, setCount] = useState(0)
  let gameWorld: ReturnType<typeof initGameWorld>;

  useEffect(() => {
    if (gameWorld) {
      return; // Prevent re-initialization
    }
    gameWorld = initGameWorld();
  }, []);

  return (
    <canvas id="webgl"></canvas>
  )
}

export default App
