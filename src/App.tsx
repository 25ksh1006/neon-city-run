
import React, { useRef, useEffect, useState, useCallback } from 'react';
import './App.css';

const GAME_WIDTH = 800;
const GAME_HEIGHT = 400;
const GROUND_Y = 320;
const GRAVITY = 0.5;
const JUMP_STRENGTH = -10;
const OBSTACLE_SPEED = 5;

interface GameObject {
  x: number;
  y: number;
  width: number;
  height: number;
  color: string;
}

interface Runner extends GameObject {
  dy: number;
  jumpCount: number;
}

const App: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [gameState, setGameState] = useState<'IDLE' | 'PLAYING' | 'GAMEOVER'>('IDLE');
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(0);

  // Game references
  const runnerRef = useRef<Runner>({
    x: 100,
    y: GROUND_Y - 40,
    width: 40,
    height: 40,
    color: '#00f2ff',
    dy: 0,
    jumpCount: 0
  });

  const obstaclesRef = useRef<GameObject[]>([]);
  const frameRef = useRef<number>(0);
  const backgroundRef = useRef<number>(0);

  // Restart Game
  const startGame = () => {
    runnerRef.current = {
      x: 100,
      y: GROUND_Y - 40,
      width: 40,
      height: 40,
      color: '#00f2ff',
      dy: 0,
      jumpCount: 0
    };
    obstaclesRef.current = [];
    setScore(0);
    setGameState('PLAYING');
    frameRef.current = 0;
  };

  // Jump Action
  const handleJump = useCallback(() => {
    if (gameState !== 'PLAYING') return;

    if (runnerRef.current.jumpCount < 2) {
      runnerRef.current.dy = JUMP_STRENGTH;
      runnerRef.current.jumpCount += 1;
    }
  }, [gameState]);

  // Handle Keys
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        if (gameState === 'IDLE' || gameState === 'GAMEOVER') {
          startGame();
        } else {
          handleJump();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [gameState, handleJump]);

  // Game Loop
  useEffect(() => {
    if (gameState !== 'PLAYING') return;

    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!ctx) return;

    let animationId: number;

    const update = () => {
      // 1. Update Score
      setScore(s => s + 1);

      // 2. Update Runner
      const runner = runnerRef.current;
      runner.y += runner.dy;
      runner.dy += GRAVITY;

      if (runner.y + runner.height > GROUND_Y) {
        runner.y = GROUND_Y - runner.height;
        runner.dy = 0;
        runner.jumpCount = 0;
      }

      // 3. Update Background
      backgroundRef.current = (backgroundRef.current - 2) % 800;

      // 4. Update Obstacles
      if (frameRef.current % 100 === 0) {
        obstaclesRef.current.push({
          x: GAME_WIDTH,
          y: GROUND_Y - 30,
          width: 30,
          height: 30,
          color: '#ff00c8'
        });
      }

      obstaclesRef.current = obstaclesRef.current
        .map(obs => ({ ...obs, x: obs.x - (OBSTACLE_SPEED + Math.floor(score / 500)) }))
        .filter(obs => obs.x + obs.width > 0);

      // 5. Collision Detection
      for (const obs of obstaclesRef.current) {
        if (
          runner.x < obs.x + obs.width &&
          runner.x + runner.width > obs.x &&
          runner.y < obs.y + obs.height &&
          runner.y + runner.height > obs.y
        ) {
          setGameState('GAMEOVER');
          return;
        }
      }

      frameRef.current += 1;
      draw();
      animationId = requestAnimationFrame(update);
    };

    const draw = () => {
      if (!ctx) return;
      ctx.clearRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

      // Background - Neon Stars
      ctx.fillStyle = '#0d0221';
      ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

      // Draw Distant Buildings (Simple Rects)
      ctx.fillStyle = '#1a0b3d';
      for(let i=0; i<10; i++) {
        const bx = (backgroundRef.current + i * 150) % 1500 - 400;
        ctx.fillRect(bx, 100 + (i % 3) * 20, 100, 300);
      }

      // Draw Ground
      ctx.strokeStyle = '#00f2ff';
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.moveTo(0, GROUND_Y);
      ctx.lineTo(GAME_WIDTH, GROUND_Y);
      ctx.stroke();

      // Neon Glow for Ground
      ctx.shadowBlur = 15;
      ctx.shadowColor = '#00f2ff';
      ctx.stroke();
      ctx.shadowBlur = 0;

      // Draw Runner
      ctx.fillStyle = runnerRef.current.color;
      ctx.shadowBlur = 20;
      ctx.shadowColor = runnerRef.current.color;
      ctx.fillRect(runnerRef.current.x, runnerRef.current.y, runnerRef.current.width, runnerRef.current.height);
      ctx.shadowBlur = 0;

      // Draw Obstacles
      obstaclesRef.current.forEach(obs => {
        ctx.fillStyle = obs.color;
        ctx.shadowBlur = 15;
        ctx.shadowColor = obs.color;
        ctx.fillRect(obs.x, obs.y, obs.width, obs.height);
        ctx.shadowBlur = 0;
      });
    };

    animationId = requestAnimationFrame(update);
    return () => cancelAnimationFrame(animationId);
  }, [gameState, score]);

  useEffect(() => {
    if (score > highScore) {
      setHighScore(score);
    }
  }, [score, highScore]);

  return (
    <div className="App">
      <h1>NEON CITY RUNNER</h1>
      <div className="game-container" onClick={handleJump}>
        <canvas 
          ref={canvasRef} 
          width={GAME_WIDTH} 
          height={GAME_HEIGHT}
        />
        
        {gameState === 'IDLE' && (
          <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)' }}>
            <h2>PRESS SPACE TO START</h2>
            <button onClick={startGame}>START GAME</button>
          </div>
        )}

        {gameState === 'GAMEOVER' && (
          <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', background: 'rgba(0,0,0,0.8)', padding: '20px', borderRadius: '15px' }}>
            <h2 style={{ color: '#ff00c8' }}>GAME OVER</h2>
            <p>SCORE: {score}</p>
            <p>HIGH SCORE: {highScore}</p>
            <button onClick={startGame}>TRY AGAIN</button>
          </div>
        )}
      </div>

      <div className="score">SCORE: {score}</div>
      <div className="instructions">SPACEBAR or CLICK to JUMP (Double Jump Available!)</div>
    </div>
  );
};

export default App;
