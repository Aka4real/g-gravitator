"use client";

import React, { useEffect, useRef } from "react";

export function GravityFieldCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const prefersReduced =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    let animationFrameId = 0;
    let width = (canvas.width = canvas.offsetWidth);
    let height = (canvas.height = canvas.offsetHeight);

    const pointer = {
      x: width * 0.65,
      y: height * 0.45,
      targetX: width * 0.65,
      targetY: height * 0.45,
      active: false,
    };

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = canvas.offsetWidth;
      height = canvas.height = canvas.offsetHeight;
    };

    const handleMouseMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      pointer.targetX = e.clientX - rect.left;
      pointer.targetY = e.clientY - rect.top;
      pointer.active =
        e.clientX >= rect.left &&
        e.clientX <= rect.right &&
        e.clientY >= rect.top &&
        e.clientY <= rect.bottom;
    };

    window.addEventListener("resize", handleResize);
    window.addEventListener("mousemove", handleMouseMove, { passive: true });

    const render = () => {
      ctx.clearRect(0, 0, width, height);

      // Smooth damped interpolation toward pointer mass
      pointer.x += (pointer.targetX - pointer.x) * 0.08;
      pointer.y += (pointer.targetY - pointer.y) * 0.08;

      const spacing = 44;
      const cols = Math.ceil(width / spacing) + 1;
      const rows = Math.ceil(height / spacing) + 1;
      const maxRadius = 240;

      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          const baseX = c * spacing;
          const baseY = r * spacing;

          const dx = pointer.x - baseX;
          const dy = pointer.y - baseY;
          const dist = Math.sqrt(dx * dx + dy * dy);

          let drawX = baseX;
          let drawY = baseY;
          let pullRatio = 0;

          if (!prefersReduced && dist < maxRadius && dist > 1) {
            pullRatio = Math.pow(1 - dist / maxRadius, 2);
            const pullStrength = pullRatio * 18;
            drawX += (dx / dist) * pullStrength;
            drawY += (dy / dist) * pullStrength;
          }

          if (pullRatio > 0.28) {
            // Surgical Ion Signal vector tick near center of mass
            ctx.strokeStyle = `rgba(255, 59, 31, ${(pullRatio * 0.72).toFixed(2)})`;
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(baseX, baseY);
            ctx.lineTo(drawX, drawY);
            ctx.stroke();

            ctx.fillStyle = `rgba(255, 59, 31, ${Math.min(0.95, pullRatio + 0.2).toFixed(2)})`;
            ctx.fillRect(drawX - 1.5, drawY - 1.5, 3, 3);
          } else {
            ctx.fillStyle = "rgba(161, 161, 170, 0.22)";
            ctx.fillRect(drawX - 1, drawY - 1, 2, 2);
          }
        }
      }

      if (!prefersReduced) {
        animationFrameId = window.requestAnimationFrame(render);
      }
    };

    render();

    return () => {
      window.removeEventListener("resize", handleResize);
      window.removeEventListener("mousemove", handleMouseMove);
      if (animationFrameId) window.cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 h-full w-full opacity-85"
    />
  );
}
