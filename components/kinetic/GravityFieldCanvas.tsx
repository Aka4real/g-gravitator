"use client";

import React, { useEffect, useRef } from "react";

interface OrbitalNode {
  orbitIndex: number;
  baseAngle: number;
  angularSpeed: number;
  radiusOffset: number;
  size: number;
  brightness: number;
}

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
    const finePointer =
      typeof window !== "undefined" &&
      window.matchMedia("(hover: hover) and (pointer: fine)").matches;

    let animationFrameId = 0;
    let width = 0;
    let height = 0;
    let dpr = 1;

    const resize = () => {
      if (!canvas) return;
      width = canvas.offsetWidth || window.innerWidth;
      height = canvas.offsetHeight || 720;
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.floor(width * dpr);
      canvas.height = Math.floor(height * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    resize();

    const attractor = {
      x: width * 0.5,
      y: height * 0.52,
      vx: 0,
      vy: 0,
      targetX: width * 0.5,
      targetY: height * 0.52,
      influence: 0,
      targetInfluence: 0,
    };

    const ORBIT_COUNT = 6;
    const nodes: OrbitalNode[] = [];
    const goldenAngle = 2.399963229728653;
    for (let i = 0; i < 52; i++) {
      const orbitIndex = i % ORBIT_COUNT;
      nodes.push({
        orbitIndex,
        baseAngle: i * goldenAngle,
        angularSpeed:
          (0.00014 + (ORBIT_COUNT - orbitIndex) * 0.000035) *
          (i % 2 === 0 ? 1 : 0.72),
        radiusOffset: ((i * 19) % 24) - 12,
        size: 1 + ((i * 7) % 10) * 0.11,
        brightness: 0.2 + ((i * 13) % 10) * 0.04,
      });
    }

    const handlePointerMove = (e: PointerEvent) => {
      if (!finePointer || prefersReduced) return;
      const rect = canvas.getBoundingClientRect();
      const inside =
        e.clientX >= rect.left &&
        e.clientX <= rect.right &&
        e.clientY >= rect.top &&
        e.clientY <= rect.bottom;

      if (inside) {
        attractor.targetX = e.clientX - rect.left;
        attractor.targetY = e.clientY - rect.top;
        attractor.targetInfluence = 1;
      } else {
        attractor.targetX = width * 0.5;
        attractor.targetY = height * 0.52;
        attractor.targetInfluence = 0;
      }
    };

    const handlePointerLeave = () => {
      attractor.targetX = width * 0.5;
      attractor.targetY = height * 0.52;
      attractor.targetInfluence = 0;
    };

    const resizeObserver = new ResizeObserver(() => {
      resize();
      if (prefersReduced) {
        drawFrame(0);
      }
    });
    resizeObserver.observe(canvas);

    window.addEventListener("pointermove", handlePointerMove, {
      passive: true,
    });
    window.addEventListener("blur", handlePointerLeave);

    const drawFrame = (time: number) => {
      ctx.clearRect(0, 0, width, height);

      const stiffness = 0.045;
      const damping = 0.78;
      attractor.vx =
        (attractor.vx + (attractor.targetX - attractor.x) * stiffness) *
        damping;
      attractor.vy =
        (attractor.vy + (attractor.targetY - attractor.y) * stiffness) *
        damping;
      attractor.x += attractor.vx;
      attractor.y += attractor.vy;
      attractor.influence +=
        (attractor.targetInfluence - attractor.influence) * 0.06;

      const focalX = width * 0.5;
      const focalY = height * 0.52;
      const maxDim = Math.max(width, height);
      const baseRadius = maxDim * 0.14;
      const radiusStep = maxDim * 0.085;
      const warpRadius = Math.min(340, maxDim * 0.36);

      if (attractor.influence > 0.01) {
        const wellGrad = ctx.createRadialGradient(
          attractor.x,
          attractor.y,
          0,
          attractor.x,
          attractor.y,
          240
        );
        wellGrad.addColorStop(
          0,
          `rgba(255, 59, 31, ${(0.085 * attractor.influence).toFixed(3)})`
        );
        wellGrad.addColorStop(
          0.45,
          `rgba(255, 59, 31, ${(0.025 * attractor.influence).toFixed(3)})`
        );
        wellGrad.addColorStop(1, "rgba(7, 9, 13, 0)");
        ctx.fillStyle = wellGrad;
        ctx.fillRect(0, 0, width, height);
      }

      const tilt = -0.18;
      const cosTilt = Math.cos(tilt);
      const sinTilt = Math.sin(tilt);
      const segments = 96;

      for (let o = 0; o < ORBIT_COUNT; o++) {
        const rx = baseRadius + o * radiusStep;
        const ry = rx * 0.52;
        const baseAlpha = Math.max(0.025, 0.085 - o * 0.01);

        ctx.beginPath();
        for (let s = 0; s <= segments; s++) {
          const theta = (s / segments) * Math.PI * 2;
          const lx = Math.cos(theta) * rx;
          const ly = Math.sin(theta) * ry;

          let px = focalX + lx * cosTilt - ly * sinTilt;
          let py = focalY + lx * sinTilt + ly * cosTilt;

          if (!prefersReduced && attractor.influence > 0.005) {
            const dx = attractor.x - px;
            const dy = attractor.y - py;
            const dist = Math.hypot(dx, dy);
            if (dist < warpRadius && dist > 1) {
              const falloff = Math.pow(1 - dist / warpRadius, 2);
              const pull = falloff * 24 * attractor.influence;
              px += (dx / dist) * pull;
              py += (dy / dist) * pull;
            }
          }

          if (s === 0) ctx.moveTo(px, py);
          else ctx.lineTo(px, py);
        }

        ctx.closePath();
        ctx.strokeStyle = `rgba(242, 244, 248, ${baseAlpha.toFixed(3)})`;
        ctx.lineWidth = o === 1 ? 1 : 0.7;
        ctx.stroke();
      }

      for (let i = 0; i < nodes.length; i++) {
        const node = nodes[i];
        const rx = baseRadius + node.orbitIndex * radiusStep + node.radiusOffset;
        const ry = rx * 0.52;
        const theta =
          node.baseAngle + (prefersReduced ? 0 : time * node.angularSpeed);

        const lx = Math.cos(theta) * rx;
        const ly = Math.sin(theta) * ry;
        const origX = focalX + lx * cosTilt - ly * sinTilt;
        const origY = focalY + lx * sinTilt + ly * cosTilt;

        if (
          origX < -40 ||
          origX > width + 40 ||
          origY < -40 ||
          origY > height + 40
        ) {
          continue;
        }

        let px = origX;
        let py = origY;
        let pullRatio = 0;

        if (!prefersReduced && attractor.influence > 0.005) {
          const dx = attractor.x - origX;
          const dy = attractor.y - origY;
          const dist = Math.hypot(dx, dy);
          if (dist < warpRadius && dist > 1) {
            pullRatio = Math.pow(1 - dist / warpRadius, 2) * attractor.influence;
            const pull = pullRatio * 26;
            px += (dx / dist) * pull;
            py += (dy / dist) * pull;
          }
        }

        if (pullRatio > 0.22) {
          ctx.beginPath();
          ctx.moveTo(origX, origY);
          ctx.lineTo(px, py);
          ctx.strokeStyle = `rgba(255, 59, 31, ${(pullRatio * 0.4).toFixed(3)})`;
          ctx.lineWidth = 0.75;
          ctx.stroke();
        }

        const isIonLit = pullRatio > 0.16;
        const nodeRadius = node.size + pullRatio * 1.3;

        ctx.beginPath();
        ctx.arc(px, py, nodeRadius, 0, Math.PI * 2);
        ctx.fillStyle = isIonLit
          ? `rgba(255, 102, 74, ${Math.min(0.95, 0.45 + pullRatio * 0.5).toFixed(3)})`
          : `rgba(242, 244, 248, ${node.brightness.toFixed(3)})`;
        ctx.fill();
      }
    };

    const tick = (now: number) => {
      if (!document.hidden) {
        drawFrame(now);
      }
      animationFrameId = window.requestAnimationFrame(tick);
    };

    if (prefersReduced) {
      drawFrame(0);
    } else {
      animationFrameId = window.requestAnimationFrame(tick);
    }

    return () => {
      resizeObserver.disconnect();
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("blur", handlePointerLeave);
      if (animationFrameId) {
        window.cancelAnimationFrame(animationFrameId);
      }
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 h-full w-full opacity-90 [mask-image:radial-gradient(ellipse_88%_82%_at_50%_50%,black_45%,transparent_100%)]"
    />
  );
}
