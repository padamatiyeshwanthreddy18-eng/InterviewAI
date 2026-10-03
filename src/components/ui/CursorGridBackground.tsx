import React, { useEffect, useRef } from 'react';

export const CursorGridBackground: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    // Mouse coordinates & lerped trail
    let mouse = {
      x: width / 2,
      y: height / 2,
      targetX: width / 2,
      targetY: height / 2,
      radius: 180,
      active: false,
    };

    let isReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    let isHidden = document.hidden;
    let idleTime = 0;

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };

    const handleMouseMove = (e: MouseEvent) => {
      mouse.targetX = e.clientX;
      mouse.targetY = e.clientY;
      mouse.active = true;
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (e.touches.length > 0) {
        mouse.targetX = e.touches[0].clientX;
        mouse.targetY = e.touches[0].clientY;
        mouse.active = true;
      }
    };

    const handleVisibilityChange = () => {
      isHidden = document.hidden;
      if (!isHidden && !isReducedMotion) {
        lastTime = performance.now();
        animId = requestAnimationFrame(render);
      }
    };

    window.addEventListener('resize', handleResize);
    window.addEventListener('mousemove', handleMouseMove, { passive: true });
    window.addEventListener('touchmove', handleTouchMove, { passive: true });
    document.addEventListener('visibilitychange', handleVisibilityChange);

    const gridSize = 42; // Grid cell spacing
    let lastTime = performance.now();

    const render = (time: number) => {
      if (isHidden) return;

      const dt = Math.min((time - lastTime) / 1000, 0.1);
      lastTime = time;

      // Smooth lerp mouse towards target
      if (!mouse.active) {
        // Autonomous slow idle drifting on mobile or idle
        idleTime += dt * 0.45;
        mouse.targetX = width / 2 + Math.sin(idleTime) * (width * 0.3);
        mouse.targetY = height / 3 + Math.cos(idleTime * 0.8) * (height * 0.22);
      }

      mouse.x += (mouse.targetX - mouse.x) * 0.12;
      mouse.y += (mouse.targetY - mouse.y) * 0.12;

      // 1. Draw Deep Violet Dusk Base Background
      ctx.clearRect(0, 0, width, height);

      // Deep base
      ctx.fillStyle = '#1A0F22';
      ctx.fillRect(0, 0, width, height);

      // Top-center plum/mauve ambient glow
      const topRadial = ctx.createRadialGradient(
        width * 0.5,
        height * 0.05,
        10,
        width * 0.5,
        height * 0.1,
        width * 0.65
      );
      topRadial.addColorStop(0, 'rgba(147, 80, 115, 0.18)');
      topRadial.addColorStop(0.5, 'rgba(80, 45, 85, 0.10)');
      topRadial.addColorStop(1, 'rgba(26, 15, 34, 0)');
      ctx.fillStyle = topRadial;
      ctx.fillRect(0, 0, width, height);

      // Off-axis corner glow (bottom right)
      const cornerRadial = ctx.createRadialGradient(
        width * 0.88,
        height * 0.88,
        20,
        width * 0.85,
        height * 0.85,
        width * 0.5
      );
      cornerRadial.addColorStop(0, 'rgba(246, 219, 192, 0.07)');
      cornerRadial.addColorStop(0.6, 'rgba(80, 45, 85, 0.09)');
      cornerRadial.addColorStop(1, 'rgba(26, 15, 34, 0)');
      ctx.fillStyle = cornerRadial;
      ctx.fillRect(0, 0, width, height);

      // 2. Draw Subtle Grid with Cursor Glow & Warp
      const cols = Math.ceil(width / gridSize) + 1;
      const rows = Math.ceil(height / gridSize) + 1;

      // Ambient faint grid lines
      ctx.lineWidth = 1;

      // Draw faint background lines first
      ctx.strokeStyle = 'rgba(248, 244, 233, 0.04)';
      ctx.beginPath();
      for (let i = 0; i <= cols; i++) {
        const x = i * gridSize;
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height);
      }
      for (let j = 0; j <= rows; j++) {
        const y = j * gridSize;
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
      }
      ctx.stroke();

      // If reduced motion, stop here with static clean faint grid
      if (isReducedMotion) {
        return;
      }

      // Draw interactive grid points & glowing intersection crosshairs
      for (let i = 0; i <= cols; i++) {
        for (let j = 0; j <= rows; j++) {
          const origX = i * gridSize;
          const origY = j * gridSize;

          const dx = mouse.x - origX;
          const dy = mouse.y - origY;
          const dist = Math.sqrt(dx * dx + dy * dy);

          if (dist < mouse.radius) {
            // Proximity intensity 0 to 1
            const intensity = 1 - dist / mouse.radius;
            const ease = intensity * intensity;

            // Subtle warp: attract slightly toward cursor
            const warpFactor = ease * 7;
            const ptX = origX + (dx / dist) * warpFactor;
            const ptY = origY + (dy / dist) * warpFactor;

            // Radiant Mauve -> Peach gradient glow near cursor
            const r = Math.round(147 + (246 - 147) * ease);
            const g = Math.round(80 + (219 - 80) * ease);
            const b = Math.round(115 + (192 - 115) * ease);
            const alpha = 0.15 + ease * 0.65;

            // Draw glowing node
            ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${alpha})`;
            ctx.beginPath();
            ctx.arc(ptX, ptY, 1.2 + ease * 2.2, 0, Math.PI * 2);
            ctx.fill();

            // Highlight intersecting cross lines when very close
            if (ease > 0.4) {
              ctx.strokeStyle = `rgba(246, 219, 192, ${ease * 0.25})`;
              ctx.beginPath();
              ctx.moveTo(ptX - 4, ptY);
              ctx.lineTo(ptX + 4, ptY);
              ctx.moveTo(ptX, ptY - 4);
              ctx.lineTo(ptX, ptY + 4);
              ctx.stroke();
            }
          } else {
            // Quiet static dot at intersections
            ctx.fillStyle = 'rgba(248, 244, 233, 0.05)';
            ctx.beginPath();
            ctx.arc(origX, origY, 0.8, 0, Math.PI * 2);
            ctx.fill();
          }
        }
      }

      // Cursor soft flashlight halo
      const cursorGlow = ctx.createRadialGradient(
        mouse.x,
        mouse.y,
        0,
        mouse.x,
        mouse.y,
        mouse.radius
      );
      cursorGlow.addColorStop(0, 'rgba(246, 219, 192, 0.09)');
      cursorGlow.addColorStop(0.35, 'rgba(147, 80, 115, 0.07)');
      cursorGlow.addColorStop(1, 'rgba(80, 45, 85, 0)');
      ctx.fillStyle = cursorGlow;
      ctx.beginPath();
      ctx.arc(mouse.x, mouse.y, mouse.radius, 0, Math.PI * 2);
      ctx.fill();

      animId = requestAnimationFrame(render);
    };

    if (!isReducedMotion) {
      animId = requestAnimationFrame(render);
    } else {
      render(0);
    }

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('touchmove', handleTouchMove);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className="fixed inset-0 pointer-events-none z-0 w-full h-full"
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
        zIndex: 0,
        pointerEvents: 'none',
      }}
    />
  );
};
