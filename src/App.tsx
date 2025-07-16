import { useEffect, useRef, useState } from 'react'
import { initGameWorld } from './utils/game';
import { isSignedIn, signin, subscribeTopScores, updateHighScore, type Score } from './api/firebase';

function App() {
  const gameWorld = useRef<ReturnType<typeof initGameWorld>>(null);
  const score = useRef(0);
  const scoreboardValueRef = useRef<HTMLHeadingElement>(null);
  const replayButtonRef = useRef<HTMLAnchorElement>(null);
  const [topScores, setTopScores] = useState<Score[]>([]);
  const isGameOver = useRef(false);

  const [isPlaying, setIsPlaying] = useState(false);

  const onGameOver = () => {
    isGameOver.current = true;
    updateHighScore(score.current)

    alert(`Game Over! Your score: ${score.current}`);
    replayButtonRef.current?.classList.remove('hidden');
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
    if (!isPlaying) return; // Prevent initialization if not playing
    if (gameWorld.current !== null) {
      return; // Prevent re-initialization
    }
    gameWorld.current = initGameWorld({ onGameOver, onScoreIncrement });
  }, [isPlaying]);

  useEffect(() => {
    let unsubscribe: () => void = () => { };
    subscribeTopScores((docs: Score[]) => {
      setTopScores(docs.sort((a, b) => b.highScore - a.highScore).slice(0, 10)); // Sort and limit to top 10 scores
    }).then((unsub) => {
      unsubscribe = unsub;
    });
    return () => {
      unsubscribe(); // Clean up subscription on unmount
    };
  }, []);

  // Redirect to sign-in if not authenticated
  const play = async () => {
    const signedIn = await isSignedIn();
    if (!signedIn) {
      await signin();
      return; // Wait for sign-in to complete
    }
    setIsPlaying(true);
  }

  return (
    <>
      <canvas id="webgl"></canvas>
      <canvas id="debug-physics"></canvas>
      <div id="scoreboard">
        <h1 ref={scoreboardValueRef}>Score: {score.current}</h1>
      </div>
      <div id="top-scores">
        <h2>Top Highscores</h2>
        {/* Top scores will be displayed here */}
        <div>
          {topScores.map((score, index) => (
            <div key={index}>
              <span>{score.userName}: </span>
              <span>{score.highScore}</span>
            </div>
          ))}
        </div>
      </div>
      <a href="/" id="replay-button" className='hidden' ref={replayButtonRef}>Replay</a>
      <button id="play-button" onClick={play} className={isPlaying ? 'hidden' : ''}>Play</button>
    </>
  )
}

export default App
