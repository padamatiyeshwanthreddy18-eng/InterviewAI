import React, { useEffect, useRef } from 'react';
import { motion } from 'motion/react';

export interface VoiceOrbProps {
  isSpeaking?: boolean; // AI is currently speaking TTS
  isRecording?: boolean; // User microphone is currently active
  audioLevel?: number; // 0 to 1 audio amplitude
  size?: number;
  className?: string;
  onClick?: () => void;
}

export const VoiceOrb: React.FC<VoiceOrbProps> = ({
  isSpeaking = false,
  isRecording = false,
  audioLevel = 0,
  size = 220,
  className = '',
  onClick,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;
    let phase = 0;
    const isReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    const render = () => {
      ctx.clearRect(0, 0, size, size);
      const centerX = size / 2;
      const centerY = size / 2;

      // Base radius with slight breathing
      phase += isSpeaking ? 0.08 : isRecording ? 0.05 : 0.02;
      const levelBoost = Math.max(audioLevel * 40, isSpeaking ? 16 : isRecording ? 10 : 4);
      const baseRadius = size * 0.28 + (isReduced ? 0 : Math.sin(phase) * (isSpeaking ? 8 : 4));

      // 1. Outer Glow Aura
      const auraGradient = ctx.createRadialGradient(
        centerX,
        centerY,
        baseRadius * 0.6,
        centerX,
        centerY,
        baseRadius + 45 + levelBoost
      );

      if (isSpeaking) {
        auraGradient.addColorStop(0, 'rgba(246, 219, 192, 0.45)');
        auraGradient.addColorStop(0.5, 'rgba(147, 80, 115, 0.4)');
        auraGradient.addColorStop(1, 'rgba(80, 45, 85, 0)');
      } else if (isRecording) {
        auraGradient.addColorStop(0, 'rgba(127, 227, 185, 0.35)');
        auraGradient.addColorStop(0.6, 'rgba(147, 80, 115, 0.25)');
        auraGradient.addColorStop(1, 'rgba(80, 45, 85, 0)');
      } else {
        auraGradient.addColorStop(0, 'rgba(147, 80, 115, 0.25)');
        auraGradient.addColorStop(0.7, 'rgba(80, 45, 85, 0.15)');
        auraGradient.addColorStop(1, 'rgba(26, 15, 34, 0)');
      }

      ctx.fillStyle = auraGradient;
      ctx.beginPath();
      ctx.arc(centerX, centerY, baseRadius + 40 + levelBoost, 0, Math.PI * 2);
      ctx.fill();

      // 2. Ripple Rings
      if (!isReduced && (isSpeaking || isRecording)) {
        const ringCount = isSpeaking ? 4 : 2;
        for (let i = 0; i < ringCount; i++) {
          const ringPhase = (phase + i * (Math.PI / ringCount)) % (Math.PI * 2);
          const ringRadius = baseRadius + (ringPhase / (Math.PI * 2)) * 50;
          const alpha = Math.max(0, 1 - ringPhase / (Math.PI * 2)) * (isSpeaking ? 0.5 : 0.3);

          ctx.strokeStyle = isSpeaking
            ? `rgba(246, 219, 192, ${alpha})`
            : `rgba(147, 80, 115, ${alpha})`;
          ctx.lineWidth = 1.5;
          ctx.beginPath();
          ctx.arc(centerX, centerY, ringRadius, 0, Math.PI * 2);
          ctx.stroke();
        }
      }

      // 3. Fluid Waveform Orb Surface
      const points = 32;
      ctx.beginPath();
      for (let i = 0; i <= points; i++) {
        const angle = (i / points) * Math.PI * 2;
        const wave = isReduced
          ? 0
          : Math.sin(angle * 5 + phase * 2) * (isSpeaking ? 8 : 4) +
            Math.cos(angle * 3 - phase) * (isSpeaking ? 6 : 3) * (audioLevel * 2 + 0.5);

        const r = baseRadius + wave;
        const x = centerX + Math.cos(angle) * r;
        const y = centerY + Math.sin(angle) * r;

        if (i === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }
      }
      ctx.closePath();

      // Core Orb Gradient
      const orbGrad = ctx.createLinearGradient(
        centerX - baseRadius,
        centerY - baseRadius,
        centerX + baseRadius,
        centerY + baseRadius
      );
      if (isSpeaking) {
        orbGrad.addColorStop(0, '#502D55');
        orbGrad.addColorStop(0.45, '#935073');
        orbGrad.addColorStop(0.85, '#F6DBC0');
        orbGrad.addColorStop(1, '#F8F4E9');
      } else if (isRecording) {
        orbGrad.addColorStop(0, '#502D55');
        orbGrad.addColorStop(0.6, '#935073');
        orbGrad.addColorStop(1, '#7FE3B9');
      } else {
        orbGrad.addColorStop(0, '#361D3A');
        orbGrad.addColorStop(0.65, '#502D55');
        orbGrad.addColorStop(1, '#935073');
      }

      ctx.fillStyle = orbGrad;
      ctx.fill();

      // Specular highlight
      const specGrad = ctx.createRadialGradient(
        centerX - baseRadius * 0.35,
        centerY - baseRadius * 0.35,
        2,
        centerX,
        centerY,
        baseRadius
      );
      specGrad.addColorStop(0, 'rgba(248, 244, 233, 0.5)');
      specGrad.addColorStop(0.5, 'rgba(246, 219, 192, 0.15)');
      specGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
      ctx.fillStyle = specGrad;
      ctx.fill();

      if (!isReduced) {
        animId = requestAnimationFrame(render);
      }
    };

    render();

    return () => {
      cancelAnimationFrame(animId);
    };
  }, [isSpeaking, isRecording, audioLevel, size]);

  return (
    <div
      onClick={onClick}
      className={`relative flex items-center justify-center cursor-pointer select-none ${className}`}
      style={{ width: size, height: size }}
    >
      <canvas
        ref={canvasRef}
        width={size}
        height={size}
        className="block"
        style={{ width: size, height: size }}
      />
    </div>
  );
};
