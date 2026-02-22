import React, { useEffect, useRef, useCallback } from 'react';

interface GameProps {
  onGameOver: (score: number) => void;
  isStarted: boolean;
  onStart: () => void;
}

const GRAVITY = 0.6;
const JUMP = -8;
const PIPE_WIDTH = 60;
const PIPE_GAP = 160;
const PIPE_SPAWN_RATE = 1500; // ms
const SPEED = 3.5;

export const Game: React.FC<GameProps> = ({ onGameOver, isStarted, onStart }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const birdY = useRef(300);
  const birdVelocity = useRef(0);
  const pipes = useRef<{ x: number; topHeight: number; passed: boolean }[]>([]);
  const frameId = useRef<number | null>(null);
  const lastTime = useRef<number>(0);
  const spawnTimer = useRef<number>(0);
  const score = useRef(0);
  const splatters = useRef<{ x: number; y: number; size: number; alpha: number }[]>([]);

  const resetGame = useCallback(() => {
    birdY.current = 300;
    birdVelocity.current = 0;
    pipes.current = [];
    score.current = 0;
    lastTime.current = 0;
    spawnTimer.current = 0;
    splatters.current = [];
  }, []);

  const jump = useCallback(() => {
    if (!isStarted) {
      onStart();
      return;
    }
    birdVelocity.current = JUMP;
  }, [isStarted, onStart]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space' || e.code === 'ArrowUp') {
        jump();
      }
    };
    const handleTouch = (e: TouchEvent) => {
      e.preventDefault();
      jump();
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('touchstart', handleTouch, { passive: false });
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('touchstart', handleTouch);
    };
  }, [jump]);

  const drawBird = (ctx: CanvasRenderingContext2D, y: number) => {
    ctx.save();
    ctx.translate(50, y);
    
    // Rotate based on velocity
    const rotation = Math.min(Math.PI / 4, Math.max(-Math.PI / 4, birdVelocity.current * 0.1));
    ctx.rotate(rotation);
    
    // Scary frozen head - more detailed
    const headGradient = ctx.createRadialGradient(-5, -5, 2, 0, 0, 20);
    headGradient.addColorStop(0, '#e0f2fe');
    headGradient.addColorStop(1, '#7dd3fc');
    
    ctx.beginPath();
    ctx.arc(0, 0, 20, 0, Math.PI * 2);
    ctx.fillStyle = headGradient;
    ctx.fill();
    ctx.strokeStyle = '#0c4a6e';
    ctx.lineWidth = 1;
    ctx.stroke();

    // Red glowing eyes
    ctx.shadowBlur = 10;
    ctx.shadowColor = '#ef4444';
    ctx.fillStyle = '#ef4444';
    ctx.beginPath();
    ctx.arc(-7, -4, 4, 0, Math.PI * 2);
    ctx.arc(7, -4, 4, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;

    // Small black pupils
    ctx.fillStyle = '#000';
    ctx.beginPath();
    ctx.arc(-7, -4, 1.5, 0, Math.PI * 2);
    ctx.arc(7, -4, 1.5, 0, Math.PI * 2);
    ctx.fill();
    
    // Blood drip from eye - more liquid looking
    ctx.fillStyle = '#7f1d1d';
    ctx.beginPath();
    ctx.arc(7, -1, 3, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillRect(6, -1, 3, 12);
    ctx.beginPath();
    ctx.arc(7.5, 11, 2, 0, Math.PI * 2);
    ctx.fill();

    // Stitched mouth
    ctx.strokeStyle = '#000';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(-12, 6);
    ctx.quadraticCurveTo(0, 12, 12, 6);
    ctx.stroke();
    for (let i = -10; i <= 10; i += 5) {
      ctx.moveTo(i, 6);
      ctx.lineTo(i, 11);
      ctx.stroke();
    }

    ctx.restore();
  };

  const drawPipe = (ctx: CanvasRenderingContext2D, x: number, topHeight: number) => {
    const canvasHeight = ctx.canvas.height;
    const centerX = x + PIPE_WIDTH / 2;
    
    // Top Pipe: Chain with a Meat Hook
    ctx.strokeStyle = '#334155';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(centerX, 0);
    ctx.lineTo(centerX, topHeight - 40);
    ctx.stroke();

    // Draw chain links
    ctx.strokeStyle = '#1e293b';
    ctx.lineWidth = 2;
    for(let i = 0; i < topHeight - 40; i += 15) {
        ctx.strokeRect(centerX - 4, i, 8, 10);
    }

    // Large Hook at the end
    ctx.strokeStyle = '#94a3b8';
    ctx.lineWidth = 6;
    ctx.beginPath();
    ctx.arc(centerX, topHeight - 20, 20, 0, Math.PI);
    ctx.stroke();
    
    // Pointy bit of hook
    ctx.beginPath();
    ctx.moveTo(centerX + 20, topHeight - 20);
    ctx.lineTo(centerX + 25, topHeight - 40);
    ctx.stroke();

    // Blood on hook
    ctx.fillStyle = '#7f1d1d';
    ctx.beginPath();
    ctx.arc(centerX + 20, topHeight - 15, 4, 0, Math.PI * 2);
    ctx.fill();

    // Bottom Pipe: Rusty Spikes
    const bottomY = topHeight + PIPE_GAP;
    const bottomHeight = canvasHeight - bottomY;
    
    const rustGradient = ctx.createLinearGradient(x, bottomY, x + PIPE_WIDTH, bottomY);
    rustGradient.addColorStop(0, '#451a03');
    rustGradient.addColorStop(0.5, '#78350f');
    rustGradient.addColorStop(1, '#451a03');
    
    ctx.fillStyle = rustGradient;
    ctx.fillRect(x, bottomY, PIPE_WIDTH, bottomHeight);

    // Sharp spikes at the bottom ends
    ctx.fillStyle = '#92400e';
    for(let i=0; i<PIPE_WIDTH; i+=15) {
      ctx.beginPath();
      ctx.moveTo(x + i, bottomY);
      ctx.lineTo(x + i + 7, bottomY - 30);
      ctx.lineTo(x + i + 15, bottomY);
      ctx.fill();
      
      // Icy highlight on spike
      ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
      ctx.beginPath();
      ctx.moveTo(x + i + 2, bottomY);
      ctx.lineTo(x + i + 5, bottomY - 15);
      ctx.lineTo(x + i + 8, bottomY);
      ctx.fill();
      ctx.fillStyle = '#92400e';
    }
  };

  const gameLoop = (timestamp: number) => {
    if (!lastTime.current) lastTime.current = timestamp;
    const deltaTime = timestamp - lastTime.current;
    lastTime.current = timestamp;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear background
    const bgGradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
    bgGradient.addColorStop(0, '#000000');
    bgGradient.addColorStop(1, '#020617');
    ctx.fillStyle = bgGradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Occasional flicker
    const flicker = Math.random() > 0.98 ? 0.2 : 0;
    if (flicker > 0) {
      ctx.fillStyle = `rgba(255, 255, 255, ${flicker})`;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    }

    // Scary background atmosphere - Frosty fog
    ctx.fillStyle = 'rgba(255, 255, 255, 0.02)';
    for(let i=0; i<5; i++) {
        ctx.beginPath();
        ctx.arc(Math.sin(timestamp/2000 + i)*200 + canvas.width/2, Math.cos(timestamp/3000 + i)*200 + canvas.height/2, 120, 0, Math.PI*2);
        ctx.fill();
    }

    // Random background eyes
    if (Math.random() > 0.99) {
      const eyeX = Math.random() * canvas.width;
      const eyeY = Math.random() * canvas.height;
      ctx.fillStyle = '#ef4444';
      ctx.beginPath();
      ctx.arc(eyeX, eyeY, 2, 0, Math.PI*2);
      ctx.arc(eyeX + 10, eyeY, 2, 0, Math.PI*2);
      ctx.fill();
    }

    if (isStarted) {
      // Update Physics
      birdVelocity.current += GRAVITY;
      birdY.current += birdVelocity.current;

      // Pipe Management
      spawnTimer.current += deltaTime;
      if (spawnTimer.current > PIPE_SPAWN_RATE) {
        const minPipeHeight = 50;
        const maxPipeHeight = canvas.height - PIPE_GAP - 50;
        const randomHeight = Math.floor(Math.random() * (maxPipeHeight - minPipeHeight + 1)) + minPipeHeight;
        pipes.current.push({ x: canvas.width, topHeight: randomHeight, passed: false });
        spawnTimer.current = 0;
      }

      // Update Pipes and Check Collision
      for (let i = pipes.current.length - 1; i >= 0; i--) {
        const pipe = pipes.current[i];
        pipe.x -= SPEED;

        // Score update
        if (!pipe.passed && pipe.x < 50) {
          pipe.passed = true;
          score.current += 1;
        }

        // Collision Check
        const birdRadius = 15;
        const birdX = 50;
        const birdTop = birdY.current - birdRadius;
        const birdBottom = birdY.current + birdRadius;

        if (
          birdX + birdRadius > pipe.x &&
          birdX - birdRadius < pipe.x + PIPE_WIDTH &&
          (birdTop < pipe.topHeight || birdBottom > pipe.topHeight + PIPE_GAP)
        ) {
          // Add splatter
          for(let i=0; i<15; i++) {
            splatters.current.push({
                x: birdX + (Math.random() - 0.5) * 40,
                y: birdY.current + (Math.random() - 0.5) * 40,
                size: Math.random() * 25 + 5,
                alpha: 1.0
            });
          }
          onGameOver(score.current);
          return;
        }

        // Remove off-screen pipes
        if (pipe.x + PIPE_WIDTH < 0) {
          pipes.current.splice(i, 1);
        }
      }

      // Ground/Ceiling check
      if (birdY.current > canvas.height || birdY.current < 0) {
        // Add splatter
        for(let i=0; i<10; i++) {
            splatters.current.push({
                x: 50 + (Math.random() - 0.5) * 40,
                y: birdY.current + (Math.random() - 0.5) * 40,
                size: Math.random() * 30 + 10,
                alpha: 1.0
            });
        }
        onGameOver(score.current);
        return;
      }
    }

    // Draw Splatters
    splatters.current.forEach((s, idx) => {
        ctx.fillStyle = `rgba(127, 29, 29, ${s.alpha})`;
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.size, 0, Math.PI * 2);
        ctx.fill();
        s.alpha -= 0.01;
        if (s.alpha <= 0) splatters.current.splice(idx, 1);
    });

    // Draw
    pipes.current.forEach(pipe => drawPipe(ctx, pipe.x, pipe.topHeight));
    if (isStarted) {
        drawBird(ctx, birdY.current);
    }

    // Draw Score
    ctx.font = '64px "Creepster", cursive';
    ctx.fillStyle = '#ef4444'; 
    ctx.textAlign = 'center';
    ctx.shadowBlur = 10;
    ctx.shadowColor = '#000';
    ctx.fillText(score.current.toString(), canvas.width / 2, 80);
    ctx.shadowBlur = 0;

    // Screen Frost Overlay - intensity increases with score
    const frostIntensity = Math.min(0.1 + (score.current * 0.01), 0.4);
    const frost = ctx.createRadialGradient(canvas.width/2, canvas.height/2, canvas.width/3, canvas.width/2, canvas.height/2, canvas.width);
    frost.addColorStop(0, 'transparent');
    frost.addColorStop(1, `rgba(200, 240, 255, ${frostIntensity})`);
    ctx.fillStyle = frost;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Vignette for extra creepiness
    const vignette = ctx.createRadialGradient(canvas.width/2, canvas.height/2, canvas.width/4, canvas.width/2, canvas.height/2, canvas.width);
    vignette.addColorStop(0, 'transparent');
    vignette.addColorStop(1, 'rgba(0, 0, 0, 0.6)');
    ctx.fillStyle = vignette;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    frameId.current = requestAnimationFrame(gameLoop);
  };

  useEffect(() => {
    frameId.current = requestAnimationFrame(gameLoop);
    return () => {
      if (frameId.current) cancelAnimationFrame(frameId.current);
    };
  }, [isStarted]);

  useEffect(() => {
    if (!isStarted) {
      resetGame();
    }
  }, [isStarted, resetGame]);

  useEffect(() => {
    const handleResize = () => {
      if (canvasRef.current) {
        canvasRef.current.width = window.innerWidth;
        canvasRef.current.height = window.innerHeight;
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <canvas
      ref={canvasRef}
      width={window.innerWidth}
      height={window.innerHeight}
      className="block w-full h-full bg-slate-950 touch-none"
    />
  );
};
