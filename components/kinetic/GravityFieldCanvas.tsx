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
      height = canvas.offsetHeight || 600;
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.floor(width * dpr);
      canvas.height = Math.floor(height * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    resize();

    // Velocity-damped gravitational attractor (smooth weight & momentum)
    const attractor = {
      x: width * 0.72,
      y: height * 0.44,
      vx: 0,
      vy: 0,
      targetX: width * 0.72,
      targetY: height * 0.44,
      influence: 0,
      targetInfluence: 0,
    };

    // Deterministic golden-angle orbital star/mass nodes
    const ORBIT_COUNT = 7;
    const nodes: OrbitalNode[] = [];
    const goldenAngle = 2.399963229728653;
    for (let i = 0; i < 64; i++) {
      const orbitIndex = i % ORBIT_COUNT;
      nodes.push({
        orbitIndex,
        baseAngle: i * goldenAngle,
        angularSpeed: (0.00018 + (ORBIT_COUNT - orbitIndex) * 0.000045) * (i % 2 === 0 ? 1 : 0.7),
        radiusOffset: ((i * 19) % 24) - 12,
        size: 1 + ((i * 7) % 10) * 0.12,
        brightness: 0.22 + ((i * 13) % 10) * 0.045,
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
        attractor.targetX = width * 0.72;
        attractor.targetY = height * 0.44;
        attractor.targetInfluence = 0;
      }
    };

    const handlePointerLeave = () => {
      attractor.targetX = width * 0.72;
      attractor.targetY = height * 0.44;
      attractor.targetInfluence = 0;
    };

    const resizeObserver = new ResizeObserver(() => {
      resize();
      if (prefersReduced) {
        drawFrame(0);
      }
    });
    resizeObserver.observe(canvas);

    window.addEventListener("pointermove", handlePointerMove, { passive: true });
    window.addEventListener("blur", handlePointerLeave);

    const drawFrame = (time: number) => {
      ctx.clearRect(0, 0, width, height);

      // Spring-damped cursor velocity interpolation
      const stiffness = 0.045;
      const damping = 0.78;
      attractor.vx = (attractor.vx + (attractor.targetX - attractor.x) * stiffness) * damping;
      attractor.vy = (attractor.vy + (attractor.targetY - attractor.y) * stiffness) * damping;
      attractor.x += attractor.vx;
      attractor.y += attractor.vy;
      attractor.influence += (attractor.targetInfluence - attractor.influence) * 0.06;

      const focalX = width * 0.74;
      const focalY = height * 0.44;
      const maxDim = Math.max(width, height);
      const baseRadius = maxDim * 0.12;
      const radiusStep = maxDim * 0.088;
      const warpRadius = Math.min(340, maxDim * 0.36);

      // 1. Quiet deep-space ambient luminance around the primary orbital focus
      const ambientGrad = ctx.createRadialGradient(
        focalX,
        focalY,
        0,
        focalX,
        focalY,
        maxDim * 0.48
      );
      ambientGrad.addColorStop(0, "rgba(244, 243, 239, 0.045)");
      ambientGrad.addColorStop(0.45, "rgba(255, 59, 31, 0.025)");
      ambientGrad.addColorStop(1, "rgba(8, 8, 10, 0)");
      ctx.fillStyle = ambientGrad;
      ctx.fillRect(0, 0, width, height);

      // 2. Soft gravitational well glow tracking the damped cursor
      if (attractor.influence > 0.01) {
        const wellGrad = ctx.createRadialGradient(
          attractor.x,
          attractor.y,
          0,
          attractor.x,
          attractor.y,
          260
        );
        wellGrad.addColorStop(
          0,
          `rgba(255, 59, 31, ${(0.095 * attractor.influence).toFixed(3)})`
        );
        wellGrad.addColorStop(
          0.45,
          `rgba(255, 59, 31, ${(0.03 * attractor.influence).toFixed(3)})`
        );
        wellGrad.addColorStop(1, "rgba(8, 8, 10, 0)");
        ctx.fillStyle = wellGrad;
        ctx.fillRect(0, 0, width, height);
      }

      // 3. Curved orbital arcs smoothly bent by the cursor's gravitational mass
      const tilt = -0.22;
      const cosTilt = Math.cos(tilt);
      const sinTilt = Math.sin(tilt);
      const segments = 96;

      for (let o = 0; o < ORBIT_COUNT; o++) {
        const rx = baseRadius + o * radiusStep;
        const ry = rx * 0.64;
        const baseAlpha = Math.max(0.028, 0.09 - o * 0.009);

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
              const pull = falloff * 26 * attractor.influence;
              px += (dx / dist) * pull;
              py += (dy / dist) * pull;
            }
          }

          if (s === 0) ctx.moveTo(px, py);
          else ctx.lineTo(px, py);
        }

        ctx.closePath();
        ctx.strokeStyle = `rgba(244, 243, 239, ${baseAlpha.toFixed(3)})`;
        ctx.lineWidth = o === 1 ? 1 : 0.75;
        ctx.stroke();
      }

      // 4. Luminous orbital mass nodes with gossamer tidal attraction near cursor
      for (let i = 0; i < nodes.length; i++) {
        const node = nodes[i];
        const rx = baseRadius + node.orbitIndex * radiusStep + node.radiusOffset;
        const ry = rx * 0.64;
        const theta = node.baseAngle + (prefersReduced ? 0 : time * node.angularSpeed);

        const lx = Math.cos(theta) * rx;
        const ly = Math.sin(theta) * ry;
        const origX = focalX + lx * cosTilt - ly * sinTilt;
        const origY = focalY + lx * sinTilt + ly * cosTilt;

        if (origX < -40 || origX > width + 40 || origY < -40 || origY > height + 40) {
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
            const pull = pullRatio * 28;
            px += (dx / dist) * pull;
            py += (dy / dist) * pull;
          }
        }

        // Delicate tidal tether when strongly pulled toward the cursor mass
        if (pullRatio > 0.22) {
          ctx.beginPath();
          ctx.moveTo(origX, origY);
          ctx.lineTo(px, py);
          ctx.strokeStyle = `rgba(255, 59, 31, ${(pullRatio * 0.42).toFixed(3)})`;
          ctx.lineWidth = 0.75;
          ctx.stroke();
        }

        // Node halo + crisp core
        const isIonLit = pullRatio > 0.16;
        const nodeRadius = node.size + pullRatio * 1.4;

        if (isIonLit) {
          ctx.beginPath();
          ctx.arc(px, py, nodeRadius * 3.2, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(255, 59, 31, ${(pullRatio * 0.18).toFixed(3)})`;
          ctx.fill();
        }

        ctx.beginPath();
        ctx.arc(px, py, nodeRadius, 0, Math.PI * 2);
        ctx.fillStyle = isIonLit
          ? `rgba(255, 110, 82, ${Math.min(0.95, 0.45 + pullRatio * 0.5).toFixed(3)})`
          : `rgba(244, 243, 239, ${node.brightness.toFixed(3)})`;
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
      className="pointer-events-none absolute inset-0 h-full w-full opacity-95 [mask-image:radial-gradient(ellipse_90%_85%_at_65%_44%,black_38%,transparent_100%)]"
    />
  );
}
