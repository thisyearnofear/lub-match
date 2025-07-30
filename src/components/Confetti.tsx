"use client";
import { useEffect, useRef } from "react";

// Simple confetti burst using canvas
export default function Confetti({ trigger }: { trigger: boolean }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!trigger) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const W = window.innerWidth;
    const H = 200;
    canvas.width = W;
    canvas.height = H;
    const confettiCount = 40;
    const confetti: { x: number; y: number; r: number; d: number; color: string }[] = [];
    const colors = ["#a21caf", "#f472b6", "#fbbf24", "#10b981", "#3b82f6"];
    for (let i = 0; i < confettiCount; i++) {
      confetti.push({
        x: Math.random() * W,
        y: Math.random() * H,
        r: Math.random() * 6 + 4,
        d: Math.random() * confettiCount,
        color: colors[Math.floor(Math.random() * colors.length)],
      });
    }
    let angle = 0;
    let animationFrame: number;
    function draw() {
      if (!ctx) return;
      ctx.clearRect(0, 0, W, H);
      for (let i = 0; i < confettiCount; i++) {
        const c = confetti[i];
        ctx.beginPath();
        ctx.arc(c.x, c.y, c.r, 0, Math.PI * 2, false);
        ctx.fillStyle = c.color;
        ctx.fill();
      }
      update();
      animationFrame = requestAnimationFrame(draw);
    }
    function update() {
      angle += 0.01;
      for (let i = 0; i < confettiCount; i++) {
        const c = confetti[i];
        c.y += Math.cos(angle + c.d) + 1 + c.r / 2;
        c.x += Math.sin(angle) * 2;
        if (c.x > W || c.x < 0 || c.y > H) {
          c.x = Math.random() * W;
          c.y = -10;
        }
      }
    }
    draw();
    setTimeout(() => {
      cancelAnimationFrame(animationFrame);
      if (!ctx) return;
      ctx.clearRect(0, 0, W, H);
    }, 1200);
    // Cleanup
    return () => cancelAnimationFrame(animationFrame);
  }, [trigger]);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        width: "100vw",
        height: 200,
        pointerEvents: "none",
        zIndex: 1000,
      }}
      width={window.innerWidth}
      height={200}
      aria-hidden="true"
    />
  );
}
