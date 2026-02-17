"use client";

import { useEffect, useRef, useState } from "react";

/* ═══════════════════════════════════════════════════════════
   CONFIGURABLE PARAMETERS — tweak these to adjust the effect
   ═══════════════════════════════════════════════════════════ */
const CONFIG = {
  /** Number of particles flying outward */
  particleCount: 180,
  /** Base speed (px / frame at 60 fps) */
  speedMin: 0.15,
  speedMax: 0.6,
  /** Particle square size range (px, before DPR) */
  sizeMin: 2,
  sizeMax: 6,
  /** Trail length multiplier (trail = speed × this) */
  trailLengthMultiplier: 18,
  /** Trail max opacity at the head */
  trailOpacity: 0.6,
  /** Vanishing‑point position (fraction of canvas size) */
  originX: 0.5,
  originY: 0.5,
  /** Particle colors — orange, purple, green */
  colors: [
    { r: 255, g: 140, b: 50 },   // orange
    { r: 192, g: 116, b: 255 },  // purple
    { r: 80, g: 220, b: 160 },   // green
  ],
  /** Camera drift — very subtle zoom + translate over this period */
  driftDuration: 11,  // seconds
  driftZoom: 0.012,   // max extra scale (e.g. 0.012 → 1.2 %)
  driftX: 6,          // max px horizontal shift
  driftY: 4,          // max px vertical shift
  /** Vignette strength (0 = none, 1 = very strong) */
  vignetteStrength: 0.35,
  /** Noise/grain opacity */
  noiseOpacity: 0.06,
  /** Static radial line count */
  radialLines: 90,
  radialLineOpacity: 0.07,
};

/* ─── types ──────────────────────────────────────────────── */
interface Particle {
  angle: number;
  radius: number;
  speed: number;
  size: number;
  color: { r: number; g: number; b: number };
  alpha: number;
}

/* ─── helpers ────────────────────────────────────────────── */
function rand(min: number, max: number) {
  return Math.random() * (max - min) + min;
}

function spawnParticle(): Particle {
  const c = CONFIG.colors[Math.floor(Math.random() * CONFIG.colors.length)];
  return {
    angle: Math.random() * Math.PI * 2,
    radius: rand(2, 30),
    speed: rand(CONFIG.speedMin, CONFIG.speedMax),
    size: rand(CONFIG.sizeMin, CONFIG.sizeMax),
    color: c,
    alpha: rand(0.5, 1),
  };
}

/* ─── component ──────────────────────────────────────────── */
export default function HyperspaceHero() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  /* fade‑in text after mount */
  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 100);
    return () => clearTimeout(t);
  }, []);

  /* canvas animation loop */
  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const ctx = canvas.getContext("2d", { alpha: false });
    if (!ctx) return;

    let raf = 0;
    let particles: Particle[] = [];
    let w = 0;
    let h = 0;
    let dpr = 1;
    let startTime = performance.now();

    /* noise pattern — generated once */
    let noiseCanvas: HTMLCanvasElement | null = null;
    function generateNoise() {
      noiseCanvas = document.createElement("canvas");
      noiseCanvas.width = 256;
      noiseCanvas.height = 256;
      const nCtx = noiseCanvas.getContext("2d");
      if (!nCtx) return;
      const imgData = nCtx.createImageData(256, 256);
      for (let i = 0; i < imgData.data.length; i += 4) {
        const v = Math.random() * 255;
        imgData.data[i] = v;
        imgData.data[i + 1] = v;
        imgData.data[i + 2] = v;
        imgData.data[i + 3] = 255;
      }
      nCtx.putImageData(imgData, 0, 0);
    }
    generateNoise();

    function resize() {
      dpr = window.devicePixelRatio || 1;
      const rect = container!.getBoundingClientRect();
      w = rect.width;
      h = rect.height;
      canvas!.width = w * dpr;
      canvas!.height = h * dpr;
      ctx!.setTransform(dpr, 0, 0, dpr, 0, 0);
    }

    function init() {
      resize();
      particles = Array.from({ length: CONFIG.particleCount }, () => {
        const p = spawnParticle();
        // Distribute initial particles across radii so it doesn't start empty
        p.radius = rand(2, Math.max(w, h) * 0.8);
        return p;
      });
      startTime = performance.now();
    }

    function draw() {
      const now = performance.now();
      const elapsed = (now - startTime) / 1000;

      /* camera drift */
      const driftPhase = ((elapsed % CONFIG.driftDuration) / CONFIG.driftDuration) * Math.PI * 2;
      const driftScale = 1 + Math.sin(driftPhase) * CONFIG.driftZoom;
      const dx = Math.sin(driftPhase * 0.7) * CONFIG.driftX;
      const dy = Math.cos(driftPhase * 1.1) * CONFIG.driftY;

      ctx!.save();
      ctx!.setTransform(dpr * driftScale, 0, 0, dpr * driftScale, 0, 0);
      const offsetX = (w * (1 - driftScale)) / 2 / driftScale + dx / driftScale;
      const offsetY = (h * (1 - driftScale)) / 2 / driftScale + dy / driftScale;
      ctx!.translate(offsetX, offsetY);

      /* clear */
      ctx!.fillStyle = "#000000";
      ctx!.fillRect(-20, -20, w + 40, h + 40);

      const ox = w * CONFIG.originX;
      const oy = h * CONFIG.originY;

      /* radial lines (static) */
      for (let i = 0; i < CONFIG.radialLines; i++) {
        const a = (i / CONFIG.radialLines) * Math.PI * 2;
        const farR = Math.max(w, h) * 1.5;
        const grad = ctx!.createLinearGradient(
          ox,
          oy,
          ox + Math.cos(a) * farR,
          oy + Math.sin(a) * farR,
        );
        grad.addColorStop(0, `rgba(255,255,255,${CONFIG.radialLineOpacity})`);
        grad.addColorStop(0.4, `rgba(255,255,255,${CONFIG.radialLineOpacity * 0.3})`);
        grad.addColorStop(1, "rgba(255,255,255,0)");
        ctx!.beginPath();
        ctx!.moveTo(ox, oy);
        ctx!.lineTo(ox + Math.cos(a) * farR, oy + Math.sin(a) * farR);
        ctx!.strokeStyle = grad;
        ctx!.lineWidth = 0.5;
        ctx!.stroke();
      }

      /* particles */
      const maxR = Math.max(w, h) * 0.85;
      for (const p of particles) {
        p.radius += p.speed;

        // Out of bounds → respawn near center
        const px = ox + Math.cos(p.angle) * p.radius;
        const py = oy + Math.sin(p.angle) * p.radius;
        if (px < -40 || px > w + 40 || py < -40 || py > h + 40 || p.radius > maxR) {
          Object.assign(p, spawnParticle());
          continue;
        }

        // Trail (line from tail to head with gradient)
        const trailLen = p.speed * CONFIG.trailLengthMultiplier;
        const tailR = Math.max(0, p.radius - trailLen);
        const tx = ox + Math.cos(p.angle) * tailR;
        const ty = oy + Math.sin(p.angle) * tailR;

        const trailGrad = ctx!.createLinearGradient(tx, ty, px, py);
        trailGrad.addColorStop(
          0,
          `rgba(${p.color.r},${p.color.g},${p.color.b},0)`,
        );
        trailGrad.addColorStop(
          1,
          `rgba(${p.color.r},${p.color.g},${p.color.b},${p.alpha * CONFIG.trailOpacity})`,
        );
        ctx!.beginPath();
        ctx!.moveTo(tx, ty);
        ctx!.lineTo(px, py);
        ctx!.strokeStyle = trailGrad;
        ctx!.lineWidth = p.size * 0.5;
        ctx!.stroke();

        // Particle head (small square)
        ctx!.fillStyle = `rgba(${p.color.r},${p.color.g},${p.color.b},${p.alpha})`;
        ctx!.fillRect(px - p.size / 2, py - p.size / 2, p.size, p.size);
      }

      /* vignette */
      const vigGrad = ctx!.createRadialGradient(
        ox,
        oy,
        Math.min(w, h) * 0.2,
        ox,
        oy,
        Math.max(w, h) * 0.9,
      );
      vigGrad.addColorStop(0, "rgba(0,0,0,0)");
      vigGrad.addColorStop(1, `rgba(0,0,0,${CONFIG.vignetteStrength})`);
      ctx!.fillStyle = vigGrad;
      ctx!.fillRect(-20, -20, w + 40, h + 40);

      /* noise overlay */
      if (noiseCanvas) {
        ctx!.globalAlpha = CONFIG.noiseOpacity;
        const pat = ctx!.createPattern(noiseCanvas, "repeat");
        if (pat) {
          ctx!.fillStyle = pat;
          ctx!.fillRect(-20, -20, w + 40, h + 40);
        }
        ctx!.globalAlpha = 1;
      }

      ctx!.restore();

      raf = requestAnimationFrame(draw);
    }

    init();
    raf = requestAnimationFrame(draw);

    const onResize = () => resize();
    window.addEventListener("resize", onResize);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", onResize);
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className="hyperspace-hero"
    >
      <canvas
        ref={canvasRef}
        className="absolute inset-0"
        style={{ display: "block", width: "100%", height: "100%" }}
      />

      {/* Text overlay */}
      <div className="hyperspace-overlay">
        <div className="hyperspace-text-wrap">
          <h2
            className={`hyperspace-title hyperspace-title--left ${visible ? "hyperspace-visible" : ""}`}
          >
            One brain for your wet lab,
          </h2>
          <h2
            className={`hyperspace-title hyperspace-title--right ${visible ? "hyperspace-visible" : ""}`}
            style={{ transitionDelay: "120ms" }}
          >
            getting smarter every day.
          </h2>

        </div>
      </div>

      <button
        type="button"
        onClick={() => document.getElementById("notebook")?.scrollIntoView({ behavior: "smooth" })}
        className="absolute bottom-56 left-1/2 z-10 flex -translate-x-1/2 flex-col items-center gap-2 text-white opacity-70 transition-opacity hover:opacity-100"
      >
        <span className="text-sm font-medium tracking-widest uppercase">Sylvy products</span>
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
          className="h-6 w-6"
        >
          <path d="M12 5v14M5 12l7 7 7-7" />
        </svg>
      </button>
    </div>
  );
}
