import { useEffect, useRef } from 'react'
import { initGameWorld } from './utils/game';
function App() {
  const gameWorld = useRef<ReturnType<typeof initGameWorld>>(null);
  const score = useRef(0);

  const onGameOver = () => {
    alert(`Game Over! Your score: ${score.current}`);
  }

  const onScoreIncrement = (increment: number) => {
    score.current += increment;
    console.log(`Score incremented by ${increment}. Current score: ${score.current}`);
  };

  useEffect(() => {
    if (gameWorld.current !== null) {
      return; // Prevent re-initialization
    }
    gameWorld.current = initGameWorld({ onGameOver, onScoreIncrement });
  }, []);

  return (
    <>
      <canvas id="webgl"></canvas>
      <canvas id="debug-physics"></canvas>
    </>
  )
}

export default App
