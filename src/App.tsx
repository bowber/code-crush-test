import { useEffect, useRef } from 'react'
import { initGameWorld } from './utils/game';
function App() {
  const gameWorld = useRef<ReturnType<typeof initGameWorld>>(null);
  const score = useRef(0);
  const scoreboardValueRef = useRef<HTMLHeadingElement>(null);
  const isGameOver = useRef(false);

  const onGameOver = () => {
    isGameOver.current = true;
    alert(`Game Over! Your score: ${score.current}`);
  }

  const onScoreIncrement = (increment: number) => {
    if (isGameOver.current) return; // Prevent score increment after game over
    score.current += increment;
    if (scoreboardValueRef.current) {
      scoreboardValueRef.current.textContent = `Score: ${score.current}`;
    }
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
      <div id="scoreboard">
        <h1 ref={scoreboardValueRef}>Score: {score.current}</h1>
      </div>
    </>
  )
}

export default App
