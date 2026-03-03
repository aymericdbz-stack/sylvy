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

      {/* Who are we? section */}
      <div
        id="team"
        className="absolute inset-x-0 z-10 mx-auto max-w-5xl px-6 sm:px-12"
        style={{ bottom: "16rem" }}
      >
        <div
          style={{
            opacity: visible ? 1 : 0,
            transform: visible ? "translateY(0)" : "translateY(16px)",
            transition: "opacity 900ms 400ms cubic-bezier(0.33,1,0.68,1), transform 900ms 400ms cubic-bezier(0.33,1,0.68,1)",
          }}
        >
          {/* label */}
          <div className="mb-10 flex items-center gap-4">
            <div className="h-px w-10 bg-white/20" />
            <p className="text-lg font-semibold uppercase tracking-[0.2em] text-white/40">
              Who are we?
            </p>
          </div>

          {/* 2-column founder cards — flip on hover */}
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            {(
              [
                {
                  name: "Clément Djezvedjian",
                  title: "CEO",
                  role: "Biotech Engineer",
                  photo: "/founders/clement.png",
                  linkedin: "https://www.linkedin.com/in/cl%C3%A9ment-djezvedjian-bb05581a0/",
                  bio: "Clément is an engineer in life sciences and chemistry with experience in academic research and pharmaceutical and biotech companies. He leads the vision of Sylvy, providing each lab with a tailor-made scientific intelligence.",
                  institutionLogos: [
                    { src: "/founders/logos/berkeley.png", alt: "UC Berkeley", grow: 5 },
                    { src: "/founders/logos/hec.png", alt: "X-HEC Entrepreneurs", grow: 6 },
                    { src: "/founders/logos/chimie-paris-psl.png", alt: "Chimie Paris PSL", grow: 3 },
                  ],
                  expLogos: [
                    { src: "/founders/logos/cea.png", alt: "CEA" },
                    { src: "/founders/logos/merck.png", alt: "Merck" },
                    { src: "/founders/logos/servier.png", alt: "Servier" },
                  ],
                },
                {
                  name: "Aymeric Desbazeille",
                  title: "CTO",
                  role: "Software Engineer",
                  photo: "/founders/aymeric.png",
                  linkedin: "https://www.linkedin.com/in/aymeric-desbazeille-343910235/",
                  bio: "Aymeric is a software engineer focused on execution and operations. He builds and scales Sylvy with a strong emphasis on reliability and performance, drawing on his experience developing software for the aeronautics industry.",
                  institutionLogos: [
                    { src: "/founders/logos/berkeley.png", alt: "UC Berkeley", grow: 5 },
                    { src: "/founders/logos/hec.png", alt: "X-HEC Entrepreneurs", grow: 6 },
                    { src: "/founders/logos/isae.png", alt: "ISAE SUPAERO", grow: 3 },
                  ],
                  expLogos: [
                    { src: "/founders/logos/tarmac.png", alt: "Tarmac Technologies" },
                    { src: "/founders/logos/valley.png", alt: "Valley" },
                  ],
                },
              ] as const
            ).map(({ name, title, role, photo, linkedin, bio, institutionLogos, expLogos }) => (
              <div key={name} className="flex h-96 w-full flex-col overflow-hidden rounded-2xl border border-white/10 bg-white/5 p-5 backdrop-blur-sm">
                <div className="flex gap-5 flex-1 min-h-0">
                  {/* LEFT: photo + linkedin */}
                  <div className="flex w-2/5 shrink-0 flex-col gap-4">
                    <div className="h-44 shrink-0 overflow-hidden rounded-xl bg-white/5">
                      <img
                        src={photo}
                        alt={name}
                        className="h-full w-full object-cover object-top"
                        onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = "none"; }}
                      />
                    </div>
                    <a
                      href={linkedin}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-center gap-1.5 text-xs text-white/50 transition-colors hover:text-white"
                    >
                      <svg className="h-3.5 w-3.5" fill="currentColor" viewBox="0 0 24 24"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 0 1-2.063-2.065 2.064 2.064 0 1 1 2.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>
                      LinkedIn
                    </a>
                  </div>

                  {/* RIGHT: nom + title + bio */}
                  <div className="flex flex-1 flex-col gap-2 py-1 min-w-0">
                    <div>
                      <p className="text-sm font-bold leading-tight text-white whitespace-nowrap">{name} <span className="text-white">— {title}</span></p>
                      <p className="mt-0.5 text-sm text-white/50">{role}</p>
                    </div>
                    <p className="text-xs leading-relaxed text-white/65">{bio}</p>
                  </div>
                </div>

                {/* BOTTOM: institution logos + exp logos */}
                <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2 pt-3 mt-auto border-t border-white/10">
                  {institutionLogos.map((l) => (
                    <img
                      key={l.alt}
                      src={l.src}
                      alt={l.alt}
                      className={`w-auto object-contain opacity-75 ${l.alt === "UC Berkeley" || l.alt === "X-HEC Entrepreneurs" ? "h-14 max-w-[10rem]" : "h-10 max-w-[8rem]"}`}
                      onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = "none"; }}
                    />
                  ))}
                </div>
                <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2 pt-2">
                  {expLogos.map((l) => (
                    <img
                      key={l.alt}
                      src={l.src}
                      alt={l.alt}
                      className="h-8 max-w-[6rem] w-auto object-contain opacity-70"
                      onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = "none"; }}
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <button
        type="button"
        onClick={() => document.getElementById("notebook")?.scrollIntoView({ behavior: "smooth" })}
        className="absolute bottom-20 left-1/2 z-10 flex -translate-x-1/2 flex-col items-center gap-2 text-white opacity-70 transition-opacity hover:opacity-100"
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
