import React, { useEffect, useRef } from "react";

/**
 * CinematicChessBackground — "The Grandmaster's Tactical Vision"
 *
 * An artistic, atmospheric atelier canvas replacing repetitive floating piece icons
 * with evocative chiaroscuro lighting and chess geometry:
 *
 * 1. Volumetric Atelier God Rays — Soft, breathing shafts of warm amber/gold light
 *    filtering through the tournament hall atmosphere.
 * 2. Receding Perspective Grid — Isometric floor lines receding to a vanishing point
 *    behind the table, establishing authentic 3D spatial depth.
 * 3. Tactical Calculation Vectors — Delicate geometric calculation rays with travelling
 *    pulse nodes representing Grandmaster depth analysis.
 * 4. Concentric Domain Rings — Foreshortened tactical radar rings slowly revolving
 *    around the central locus of battle.
 * 5. Warm Chiaroscuro Ambience — Backlit stage luminescence framing the confrontation.
 */

// 4 Volumetric Light Shafts
const GOD_RAYS = [
  { originRatio: 0.18, angleDeg: 66, baseWidth: 160, maxAlpha: 0.085, speed: 0.35, phase: 0.0 },
  { originRatio: 0.42, angleDeg: 62, baseWidth: 210, maxAlpha: 0.11, speed: 0.28, phase: 1.8 },
  { originRatio: 0.68, angleDeg: 58, baseWidth: 190, maxAlpha: 0.095, speed: 0.32, phase: 3.4 },
  { originRatio: 0.86, angleDeg: 54, baseWidth: 150, maxAlpha: 0.075, speed: 0.42, phase: 5.1 },
];

export default function CinematicChessBackground({ mouseRef }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animId = null;
    let width = 0;
    let height = 0;

    const handleResize = () => {
      if (!canvas || !canvas.parentElement) return;
      const rect = canvas.parentElement.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      width = rect.width;
      height = rect.height;
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      ctx.resetTransform();
      ctx.scale(dpr, dpr);
    };

    handleResize();
    window.addEventListener("resize", handleResize);

    // Initialize 16 Tactical Calculation Nodes (constellation in the deep background)
    const nodes = Array.from({ length: 16 }, () => ({
      x: Math.random() * (width || 1200),
      y: (height || 800) * (0.2 + Math.random() * 0.7),
      z: 0.3 + Math.random() * 0.7, // 3D depth factor
      vx: (Math.random() - 0.5) * 0.22,
      vy: (Math.random() - 0.5) * 0.18,
      radius: 2 + Math.random() * 2.5,
      pulsePhase: Math.random() * Math.PI * 2,
    }));

    // Traveling calculation pulses along vector connections
    const pulses = Array.from({ length: 6 }, (_, i) => ({
      nodeA: i % nodes.length,
      nodeB: (i * 3 + 1) % nodes.length,
      progress: Math.random(),
      speed: 0.003 + Math.random() * 0.004,
    }));

    let time = 0;

    const render = () => {
      time += 0.016;

      ctx.clearRect(0, 0, width, height);

      const mX = mouseRef?.current?.currentX || 0;
      const mY = mouseRef?.current?.currentY || 0;

      // Center vanishing point for perspective geometry (sits directly behind the table)
      const vanishX = width * 0.5 + mX * 24;
      const vanishY = height * 0.46 + mY * 16;

      // ──────────────────────────────────────────────────────────────────────────
      // 1. Warm Chiaroscuro Stage Core (Radial Ambient Backlight)
      // ──────────────────────────────────────────────────────────────────────────
      const ambientGlow = ctx.createRadialGradient(
        vanishX,
        vanishY + 40,
        20,
        vanishX,
        vanishY + 60,
        Math.max(width, height) * 0.55
      );
      ambientGlow.addColorStop(0, "rgba(212, 175, 55, 0.11)");
      ambientGlow.addColorStop(0.35, "rgba(180, 130, 30, 0.04)");
      ambientGlow.addColorStop(0.7, "rgba(20, 16, 12, 0.01)");
      ambientGlow.addColorStop(1, "rgba(0, 0, 0, 0)");
      ctx.fillStyle = ambientGlow;
      ctx.fillRect(0, 0, width, height);

      // ──────────────────────────────────────────────────────────────────────────
      // 2. Volumetric Chiaroscuro God Rays (Atelier Natural Light Shafts)
      // ──────────────────────────────────────────────────────────────────────────
      ctx.save();
      for (let i = 0; i < GOD_RAYS.length; i++) {
        const ray = GOD_RAYS[i];
        const breath = Math.sin(time * ray.speed + ray.phase) * 0.35 + 0.65;
        const alpha = ray.maxAlpha * breath;

        const startX = width * ray.originRatio + mX * 30;
        const startY = -40;
        const rad = (ray.angleDeg * Math.PI) / 180;
        const length = height * 1.5;

        const endX = startX + Math.cos(rad) * length;
        const endY = startY + Math.sin(rad) * length;

        const perpX = -Math.sin(rad) * (ray.baseWidth * 0.5);
        const perpY = Math.cos(rad) * (ray.baseWidth * 0.5);

        // Beam polygon
        ctx.beginPath();
        ctx.moveTo(startX - perpX * 0.3, startY - perpY * 0.3);
        ctx.lineTo(startX + perpX * 0.3, startY + perpY * 0.3);
        ctx.lineTo(endX + perpX * 2.2, endY + perpY * 2.2);
        ctx.lineTo(endX - perpX * 2.2, endY - perpY * 2.2);
        ctx.closePath();

        const beamGrad = ctx.createLinearGradient(startX, startY, endX, endY);
        beamGrad.addColorStop(0, `rgba(254, 240, 138, ${alpha * 1.2})`);
        beamGrad.addColorStop(0.35, `rgba(212, 175, 55, ${alpha * 0.7})`);
        beamGrad.addColorStop(0.8, `rgba(180, 120, 20, ${alpha * 0.2})`);
        beamGrad.addColorStop(1, "rgba(0, 0, 0, 0)");

        ctx.fillStyle = beamGrad;
        ctx.fill();
      }
      ctx.restore();

      // ──────────────────────────────────────────────────────────────────────────
      // 3. Receding 3D Perspective Grid ("The Infinite Board of Thought")
      // ──────────────────────────────────────────────────────────────────────────
      ctx.save();
      ctx.lineWidth = 0.85;

      // Radial perspective floor rays extending outward and down from the vanishing point
      const rayCount = 14;
      for (let i = 0; i <= rayCount; i++) {
        const tRay = i / rayCount; // 0 to 1
        // Spread from lower left to lower right
        const targetX = -width * 0.25 + tRay * (width * 1.5);
        const targetY = height + 60;

        const distCenter = Math.abs(tRay - 0.5) * 2; // 0 at center, 1 at edges
        const lineAlpha = (1 - distCenter * 0.5) * 0.075;

        const rayGrad = ctx.createLinearGradient(vanishX, vanishY, targetX, targetY);
        rayGrad.addColorStop(0, "rgba(212, 175, 55, 0)");
        rayGrad.addColorStop(0.25, `rgba(212, 175, 55, ${lineAlpha * 0.5})`);
        rayGrad.addColorStop(1, `rgba(212, 175, 55, ${lineAlpha})`);

        ctx.strokeStyle = rayGrad;
        ctx.beginPath();
        ctx.moveTo(vanishX, vanishY);
        ctx.lineTo(targetX, targetY);
        ctx.stroke();
      }

      // Transverse horizontal grid lines with exponential perspective foreshortening
      const transCount = 9;
      for (let j = 1; j <= transCount; j++) {
        const factor = Math.pow(j / transCount, 2.1);
        const yPos = vanishY + (height - vanishY + 40) * factor;

        // Spread width increases with distance from vanishing point
        const halfWidth = (width * 0.75) * factor + width * 0.15;
        const leftX = vanishX - halfWidth;
        const rightX = vanishX + halfWidth;

        const tAlpha = factor * 0.085;
        const transGrad = ctx.createLinearGradient(leftX, yPos, rightX, yPos);
        transGrad.addColorStop(0, "rgba(212, 175, 55, 0)");
        transGrad.addColorStop(0.2, `rgba(212, 175, 55, ${tAlpha * 0.6})`);
        transGrad.addColorStop(0.5, `rgba(254, 240, 138, ${tAlpha})`);
        transGrad.addColorStop(0.8, `rgba(212, 175, 55, ${tAlpha * 0.6})`);
        transGrad.addColorStop(1, "rgba(212, 175, 55, 0)");

        ctx.strokeStyle = transGrad;
        ctx.beginPath();
        ctx.moveTo(leftX, yPos);
        ctx.lineTo(rightX, yPos);
        ctx.stroke();
      }
      ctx.restore();

      // ──────────────────────────────────────────────────────────────────────────
      // 4. Concentric Tactical Domain Rings (Foreshortened Control Geometry)
      // ──────────────────────────────────────────────────────────────────────────
      ctx.save();
      ctx.translate(vanishX, vanishY + 30);
      ctx.scale(1, 0.42); // perspective ellipse foreshortening

      // Ring 1 (Inner Domain Ring)
      ctx.rotate(time * 0.035);
      ctx.beginPath();
      ctx.arc(0, 0, Math.min(width, height) * 0.28, 0, Math.PI * 2);
      ctx.strokeStyle = "rgba(212, 175, 55, 0.065)";
      ctx.lineWidth = 1;
      ctx.setLineDash([6, 16]);
      ctx.stroke();

      // Ring 2 (Outer Tactical Radius)
      ctx.rotate(-time * 0.055);
      ctx.beginPath();
      ctx.arc(0, 0, Math.min(width, height) * 0.44, 0, Math.PI * 2);
      ctx.strokeStyle = "rgba(254, 240, 138, 0.045)";
      ctx.lineWidth = 0.75;
      ctx.setLineDash([4, 24, 12, 24]);
      ctx.stroke();

      ctx.restore();

      // ──────────────────────────────────────────────────────────────────────────
      // 5. Tactical Calculation Nodes & Interconnecting Vector Beams
      // ──────────────────────────────────────────────────────────────────────────
      // Update nodes positions
      for (const n of nodes) {
        n.x += n.vx;
        n.y += n.vy;

        if (n.x < -30) n.x = width + 30;
        if (n.x > width + 30) n.x = -30;
        if (n.y < height * 0.15) n.y = height * 0.85;
        if (n.y > height * 0.85) n.y = height * 0.15;
      }

      // Draw vector lines between nearby calculation nodes
      ctx.save();
      for (let i = 0; i < nodes.length; i++) {
        const a = nodes[i];
        const aDrawX = a.x + mX * 20 * a.z;
        const aDrawY = a.y + mY * 16 * a.z;

        for (let j = i + 1; j < nodes.length; j++) {
          const b = nodes[j];
          const bDrawX = b.x + mX * 20 * b.z;
          const bDrawY = b.y + mY * 16 * b.z;

          const dx = aDrawX - bDrawX;
          const dy = aDrawY - bDrawY;
          const distSq = dx * dx + dy * dy;

          // Connect nodes within calculation threshold (~165px)
          if (distSq < 27000) {
            const dist = Math.sqrt(distSq);
            const lineAlpha = (1 - dist / 165) * 0.095;

            ctx.strokeStyle = `rgba(212, 175, 55, ${lineAlpha})`;
            ctx.lineWidth = 0.75;
            ctx.beginPath();
            ctx.moveTo(aDrawX, aDrawY);
            ctx.lineTo(bDrawX, bDrawY);
            ctx.stroke();
          }
        }

        // Draw calculation node spark
        const nodePulse = Math.sin(time * 2.5 + a.pulsePhase) * 0.35 + 0.65;
        const nodeAlpha = (0.2 + 0.3 * a.z) * nodePulse;

        ctx.fillStyle = `rgba(254, 240, 138, ${nodeAlpha})`;
        ctx.beginPath();
        ctx.arc(aDrawX, aDrawY, a.radius, 0, Math.PI * 2);
        ctx.fill();

        // Subtle diamond crosshair on foreground nodes
        if (a.z > 0.65) {
          ctx.strokeStyle = `rgba(212, 175, 55, ${nodeAlpha * 0.5})`;
          ctx.lineWidth = 0.6;
          ctx.beginPath();
          ctx.moveTo(aDrawX - 5, aDrawY);
          ctx.lineTo(aDrawX + 5, aDrawY);
          ctx.moveTo(aDrawX, aDrawY - 5);
          ctx.lineTo(aDrawX, aDrawY + 5);
          ctx.stroke();
        }
      }

      // Traveling calculation pulses
      for (const p of pulses) {
        p.progress += p.speed;
        if (p.progress > 1) {
          p.progress = 0;
          p.nodeA = Math.floor(Math.random() * nodes.length);
          p.nodeB = (p.nodeA + 1 + Math.floor(Math.random() * (nodes.length - 1))) % nodes.length;
        }

        const a = nodes[p.nodeA];
        const b = nodes[p.nodeB];
        const aX = a.x + mX * 20 * a.z;
        const aY = a.y + mY * 16 * a.z;
        const bX = b.x + mX * 20 * b.z;
        const bY = b.y + mY * 16 * b.z;

        const pulseX = aX + (bX - aX) * p.progress;
        const pulseY = aY + (bY - aY) * p.progress;

        const pulseGlow = Math.sin(p.progress * Math.PI); // peaks at 0.5
        if (pulseGlow > 0.1) {
          ctx.fillStyle = `rgba(254, 240, 138, ${pulseGlow * 0.45})`;
          ctx.beginPath();
          ctx.arc(pulseX, pulseY, 2.2, 0, Math.PI * 2);
          ctx.fill();
        }
      }
      ctx.restore();

      animId = requestAnimationFrame(render);
    };

    animId = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener("resize", handleResize);
    };
  }, [mouseRef]);

  return (
    <canvas
      ref={canvasRef}
      className="art-cinematic-bg-canvas"
      aria-hidden="true"
    />
  );
}
