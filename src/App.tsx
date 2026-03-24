import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Play, Pause, SkipForward, SkipBack, Volume2, VolumeX, RefreshCw, Trophy, ArrowUp, ArrowDown, ArrowLeft, ArrowRight } from 'lucide-react';

// --- Music Player Data ---
const TRACKS = [
  {
    id: 1,
    title: "Neon Nights (AI Generated)",
    artist: "SynthWave Bot",
    url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3",
    cover: "https://picsum.photos/seed/neon1/400/400"
  },
  {
    id: 2,
    title: "Cyber City Beats",
    artist: "Algorithm Audio",
    url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3",
    cover: "https://picsum.photos/seed/neon2/400/400"
  },
  {
    id: 3,
    title: "Digital Dreamscape",
    artist: "Neural Network",
    url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3",
    cover: "https://picsum.photos/seed/neon3/400/400"
  }
];

// --- Snake Game Constants ---
const GRID_SIZE = 20;
const INITIAL_SPEED = 150;

type Point = { x: number; y: number };
type Direction = 'UP' | 'DOWN' | 'LEFT' | 'RIGHT';

const INITIAL_SNAKE: Point[] = [
  { x: 10, y: 10 },
  { x: 10, y: 11 },
  { x: 10, y: 12 },
];
const INITIAL_DIRECTION: Direction = 'UP';

const generateFood = (snake: Point[]): Point => {
  let newFood: Point;
  while (true) {
    newFood = {
      x: Math.floor(Math.random() * GRID_SIZE),
      y: Math.floor(Math.random() * GRID_SIZE),
    };
    if (!snake.some(segment => segment.x === newFood.x && segment.y === newFood.y)) {
      break;
    }
  }
  return newFood;
};

export default function App() {
  // --- Music Player State ---
  const [currentTrackIndex, setCurrentTrackIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const currentTrack = TRACKS[currentTrackIndex];

  useEffect(() => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.play().catch(e => console.error("Audio play failed:", e));
      } else {
        audioRef.current.pause();
      }
    }
  }, [isPlaying, currentTrackIndex]);

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.muted = isMuted;
    }
  }, [isMuted]);

  const togglePlay = () => setIsPlaying(!isPlaying);
  const toggleMute = () => setIsMuted(!isMuted);
  const nextTrack = () => setCurrentTrackIndex((prev) => (prev + 1) % TRACKS.length);
  const prevTrack = () => setCurrentTrackIndex((prev) => (prev - 1 + TRACKS.length) % TRACKS.length);

  const handleTrackEnded = () => {
    nextTrack();
  };

  // --- Snake Game State ---
  const [snake, setSnake] = useState<Point[]>(INITIAL_SNAKE);
  const [direction, setDirection] = useState<Direction>(INITIAL_DIRECTION);
  const [food, setFood] = useState<Point>({ x: 5, y: 5 });
  const [isGameOver, setIsGameOver] = useState(false);
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(0);
  const [isGameRunning, setIsGameRunning] = useState(false);
  
  const directionRef = useRef<Direction>(INITIAL_DIRECTION);
  directionRef.current = direction;

  const startGame = () => {
    setSnake(INITIAL_SNAKE);
    setDirection(INITIAL_DIRECTION);
    directionRef.current = INITIAL_DIRECTION;
    setFood(generateFood(INITIAL_SNAKE));
    setIsGameOver(false);
    setScore(0);
    setIsGameRunning(true);
  };

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (!isGameRunning) return;
    
    // Prevent default scrolling for arrow keys
    if (["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight", " "].includes(e.key)) {
      e.preventDefault();
    }

    const currentDir = directionRef.current;
    switch (e.key) {
      case 'ArrowUp':
      case 'w':
      case 'W':
        if (currentDir !== 'DOWN') setDirection('UP');
        break;
      case 'ArrowDown':
      case 's':
      case 'S':
        if (currentDir !== 'UP') setDirection('DOWN');
        break;
      case 'ArrowLeft':
      case 'a':
      case 'A':
        if (currentDir !== 'RIGHT') setDirection('LEFT');
        break;
      case 'ArrowRight':
      case 'd':
      case 'D':
        if (currentDir !== 'LEFT') setDirection('RIGHT');
        break;
    }
  }, [isGameRunning]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown, { passive: false });
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  useEffect(() => {
    if (!isGameRunning || isGameOver) return;

    const moveSnake = () => {
      setSnake(prevSnake => {
        const head = prevSnake[0];
        const newHead = { ...head };

        switch (direction) {
          case 'UP': newHead.y -= 1; break;
          case 'DOWN': newHead.y += 1; break;
          case 'LEFT': newHead.x -= 1; break;
          case 'RIGHT': newHead.x += 1; break;
        }

        // Check collision with walls
        if (
          newHead.x < 0 ||
          newHead.x >= GRID_SIZE ||
          newHead.y < 0 ||
          newHead.y >= GRID_SIZE
        ) {
          handleGameOver();
          return prevSnake;
        }

        // Check collision with self
        if (prevSnake.some(segment => segment.x === newHead.x && segment.y === newHead.y)) {
          handleGameOver();
          return prevSnake;
        }

        const newSnake = [newHead, ...prevSnake];

        // Check food collision
        if (newHead.x === food.x && newHead.y === food.y) {
          setScore(s => s + 10);
          setFood(generateFood(newSnake));
        } else {
          newSnake.pop();
        }

        return newSnake;
      });
    };

    const speed = Math.max(50, INITIAL_SPEED - Math.floor(score / 50) * 10);
    const intervalId = setInterval(moveSnake, speed);

    return () => clearInterval(intervalId);
  }, [direction, food, isGameOver, isGameRunning, score]);

  const handleGameOver = () => {
    setIsGameOver(true);
    setIsGameRunning(false);
    if (score > highScore) {
      setHighScore(score);
    }
  };

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100 font-sans selection:bg-fuchsia-500/30 flex flex-col items-center justify-center p-4 sm:p-8 overflow-hidden relative">
      
      {/* Neon Background Glows */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-fuchsia-600/20 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-cyan-600/20 blur-[120px] pointer-events-none" />

      <header className="mb-8 text-center z-10">
        <h1 className="text-4xl sm:text-6xl font-black tracking-tighter uppercase italic text-transparent bg-clip-text bg-gradient-to-r from-fuchsia-500 to-cyan-400 drop-shadow-[0_0_15px_rgba(217,70,239,0.5)]">
          Neon Snake & Beats
        </h1>
        <p 
          className="mt-4 text-xl sm:text-2xl font-digital uppercase tracking-[0.2em] font-bold glitch-text drop-shadow-[0_0_10px_rgba(255,255,255,0.8)]"
          data-text="Cybernetic Arcade Experience"
        >
          Cybernetic Arcade Experience
        </p>
      </header>

      <div className="flex flex-col lg:flex-row gap-8 w-full max-w-6xl z-10 items-center lg:items-start justify-center">
        
        {/* Left Column: Music Player */}
        <div className="w-full max-w-sm bg-neutral-900/80 backdrop-blur-xl border border-neutral-800 rounded-3xl p-6 shadow-[0_0_40px_rgba(0,0,0,0.5)] flex flex-col items-center relative overflow-hidden group">
          <div className="absolute inset-0 bg-gradient-to-br from-fuchsia-500/5 to-cyan-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
          
          <div className="w-48 h-48 rounded-2xl overflow-hidden mb-6 relative shadow-[0_0_30px_rgba(217,70,239,0.2)]">
            <img 
              src={currentTrack.cover} 
              alt={currentTrack.title} 
              className={`w-full h-full object-cover transition-transform duration-[10000ms] ease-linear ${isPlaying ? 'scale-125' : 'scale-100'}`}
              referrerPolicy="no-referrer"
            />
            <div className="absolute inset-0 ring-1 ring-inset ring-white/10 rounded-2xl" />
          </div>

          <div className="text-center mb-6 w-full">
            <h2 className="text-xl font-bold text-white truncate px-2 drop-shadow-[0_0_8px_rgba(255,255,255,0.3)]">
              {currentTrack.title}
            </h2>
            <p className="text-fuchsia-400 text-sm font-medium mt-1 truncate px-2">
              {currentTrack.artist}
            </p>
          </div>

          <div className="flex items-center justify-center gap-6 w-full my-2">
            <button 
              onClick={prevTrack}
              className="p-3 rounded-full text-cyan-400 hover:text-cyan-300 hover:bg-cyan-950/50 transition-all active:scale-95 drop-shadow-[0_0_8px_rgba(34,211,238,0.8)]"
            >
              <SkipBack size={28} />
            </button>
            
            <button 
              onClick={togglePlay}
              className="p-5 rounded-full bg-transparent border-2 border-fuchsia-500 text-fuchsia-400 shadow-[0_0_15px_rgba(217,70,239,0.6),inset_0_0_15px_rgba(217,70,239,0.6)] hover:shadow-[0_0_25px_rgba(217,70,239,0.8),inset_0_0_25px_rgba(217,70,239,0.8)] hover:bg-fuchsia-950/30 transition-all active:scale-95 transform hover:scale-105"
            >
              {isPlaying ? <Pause size={32} fill="currentColor" /> : <Play size={32} fill="currentColor" className="ml-1" />}
            </button>
            
            <button 
              onClick={nextTrack}
              className="p-3 rounded-full text-cyan-400 hover:text-cyan-300 hover:bg-cyan-950/50 transition-all active:scale-95 drop-shadow-[0_0_8px_rgba(34,211,238,0.8)]"
            >
              <SkipForward size={28} />
            </button>
          </div>

          <div className="mt-6 w-full flex items-center justify-between px-4 border-t border-neutral-800/50 pt-4">
            <div className="flex items-center gap-2 text-cyan-400 drop-shadow-[0_0_5px_rgba(34,211,238,0.8)]">
              <button onClick={toggleMute} className="hover:text-cyan-300 transition-colors">
                {isMuted ? <VolumeX size={20} /> : <Volume2 size={20} />}
              </button>
              <span className="text-xs font-mono uppercase tracking-wider text-neutral-400 drop-shadow-none">
                {isPlaying ? 'Playing' : 'Paused'}
              </span>
            </div>
            <div className="flex gap-1 items-end h-4">
              {[...Array(4)].map((_, i) => (
                <div 
                  key={i} 
                  className={`w-1.5 rounded-full bg-cyan-400 transition-all duration-300 ${isPlaying ? 'animate-pulse' : 'h-1'}`}
                  style={{ 
                    height: isPlaying ? `${Math.random() * 12 + 4}px` : '4px',
                    animationDelay: `${i * 150}ms`
                  }}
                />
              ))}
            </div>
          </div>

          <audio 
            ref={audioRef}
            src={currentTrack.url}
            onEnded={handleTrackEnded}
            autoPlay={isPlaying}
          />
        </div>

        {/* Right Column: Snake Game */}
        <div className="flex flex-col items-center">
          
          {/* Score Board */}
          <div className="flex gap-4 mb-6 w-full justify-center">
            <div className="bg-neutral-900/80 backdrop-blur-md border border-neutral-800 px-6 py-3 rounded-2xl flex flex-col items-center min-w-[120px] shadow-[0_0_20px_rgba(0,0,0,0.3)]">
              <span className="text-neutral-500 text-xs uppercase tracking-widest font-bold mb-1">Score</span>
              <span className="text-3xl font-mono font-bold text-cyan-400 drop-shadow-[0_0_8px_rgba(34,211,238,0.5)]">
                {score.toString().padStart(4, '0')}
              </span>
            </div>
            <div className="bg-neutral-900/80 backdrop-blur-md border border-neutral-800 px-6 py-3 rounded-2xl flex flex-col items-center min-w-[120px] shadow-[0_0_20px_rgba(0,0,0,0.3)]">
              <span className="text-fuchsia-400 drop-shadow-[0_0_5px_rgba(217,70,239,0.8)] text-xs uppercase tracking-widest font-bold mb-1 flex items-center gap-1">
                <Trophy size={14} /> Best
              </span>
              <span className="text-3xl font-mono font-bold text-fuchsia-400 drop-shadow-[0_0_8px_rgba(217,70,239,0.5)]">
                {highScore.toString().padStart(4, '0')}
              </span>
            </div>
          </div>

          {/* Game Board */}
          <div className="relative bg-neutral-950 border-2 border-neutral-800 rounded-xl overflow-hidden shadow-[0_0_50px_rgba(0,0,0,0.8)] ring-1 ring-white/5">
            
            {/* Grid Background */}
            <div 
              className="absolute inset-0 opacity-20 pointer-events-none"
              style={{
                backgroundImage: `linear-gradient(to right, #333 1px, transparent 1px), linear-gradient(to bottom, #333 1px, transparent 1px)`,
                backgroundSize: `${100 / GRID_SIZE}% ${100 / GRID_SIZE}%`
              }}
            />

            <div 
              className="relative"
              style={{
                width: 'min(90vw, 400px)',
                height: 'min(90vw, 400px)',
              }}
            >
              {/* Snake */}
              {snake.map((segment, index) => {
                const isHead = index === 0;
                return (
                  <div
                    key={`${segment.x}-${segment.y}-${index}`}
                    className={`absolute rounded-sm transition-all duration-75 ${
                      isHead 
                        ? 'bg-cyan-400 shadow-[0_0_15px_rgba(34,211,238,0.8)] z-10' 
                        : 'bg-cyan-600/80 shadow-[0_0_8px_rgba(8,145,178,0.5)]'
                    }`}
                    style={{
                      left: `${(segment.x / GRID_SIZE) * 100}%`,
                      top: `${(segment.y / GRID_SIZE) * 100}%`,
                      width: `${100 / GRID_SIZE}%`,
                      height: `${100 / GRID_SIZE}%`,
                      transform: 'scale(0.9)', // Slight gap between segments
                    }}
                  >
                    {isHead && (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="w-1.5 h-1.5 bg-white rounded-full opacity-80" />
                      </div>
                    )}
                  </div>
                );
              })}

              {/* Food */}
              <div
                className="absolute bg-fuchsia-500 rounded-full shadow-[0_0_15px_rgba(217,70,239,0.8)] animate-pulse"
                style={{
                  left: `${(food.x / GRID_SIZE) * 100}%`,
                  top: `${(food.y / GRID_SIZE) * 100}%`,
                  width: `${100 / GRID_SIZE}%`,
                  height: `${100 / GRID_SIZE}%`,
                  transform: 'scale(0.8)',
                }}
              />

              {/* Overlays */}
              {!isGameRunning && !isGameOver && (
                <div className="absolute inset-0 bg-black/60 backdrop-blur-sm flex flex-col items-center justify-center z-20">
                  <button
                    onClick={startGame}
                    className="px-8 py-4 bg-cyan-500 hover:bg-cyan-400 text-black font-black uppercase tracking-widest rounded-full shadow-[0_0_30px_rgba(34,211,238,0.4)] hover:shadow-[0_0_40px_rgba(34,211,238,0.6)] transition-all transform hover:scale-105 active:scale-95 flex items-center gap-3"
                  >
                    <Play size={20} fill="currentColor" /> Start Game
                  </button>
                  <div className="mt-8 text-neutral-400 text-sm font-mono flex flex-col items-center gap-3">
                    <p className="uppercase tracking-widest text-xs text-neutral-500">Controls</p>
                    <div className="flex items-center gap-4">
                      <span className="flex items-center gap-1">
                        <kbd className="bg-neutral-800 px-2 py-1 rounded text-white border border-neutral-700 font-sans">W</kbd>
                        <kbd className="bg-neutral-800 px-2 py-1 rounded text-white border border-neutral-700 font-sans">A</kbd>
                        <kbd className="bg-neutral-800 px-2 py-1 rounded text-white border border-neutral-700 font-sans">S</kbd>
                        <kbd className="bg-neutral-800 px-2 py-1 rounded text-white border border-neutral-700 font-sans">D</kbd>
                      </span>
                      <span className="text-neutral-600">or</span>
                      <span className="flex items-center gap-1">
                        <kbd className="bg-neutral-800 px-2 py-1 rounded text-white border border-neutral-700"><ArrowUp size={14} /></kbd>
                        <kbd className="bg-neutral-800 px-2 py-1 rounded text-white border border-neutral-700"><ArrowLeft size={14} /></kbd>
                        <kbd className="bg-neutral-800 px-2 py-1 rounded text-white border border-neutral-700"><ArrowDown size={14} /></kbd>
                        <kbd className="bg-neutral-800 px-2 py-1 rounded text-white border border-neutral-700"><ArrowRight size={14} /></kbd>
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {isGameOver && (
                <div className="absolute inset-0 bg-black/80 backdrop-blur-md flex flex-col items-center justify-center z-20">
                  <h3 className="text-4xl font-black text-fuchsia-500 uppercase tracking-widest mb-2 drop-shadow-[0_0_15px_rgba(217,70,239,0.5)]">
                    Game Over
                  </h3>
                  <p className="text-neutral-300 font-mono mb-8 text-lg">
                    Final Score: <span className="text-cyan-400 font-bold">{score}</span>
                  </p>
                  <button
                    onClick={startGame}
                    className="px-8 py-4 bg-transparent border-2 border-cyan-500 text-cyan-400 hover:bg-cyan-500 hover:text-black font-black uppercase tracking-widest rounded-full shadow-[0_0_20px_rgba(34,211,238,0.2)] hover:shadow-[0_0_40px_rgba(34,211,238,0.6)] transition-all transform hover:scale-105 active:scale-95 flex items-center gap-3"
                  >
                    <RefreshCw size={20} /> Play Again
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
