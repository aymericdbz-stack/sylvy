"use client";

import Image from "next/image";
import { useCallback, useEffect, useState } from "react";
import logoWhite from "../../../logo/Logo Blanc sans Fond.webp";
import merckLogo from "../../../carrousel/merck.webp";
import servierLogo from "../../../carrousel/servier.webp";
import ucBerkeleyLogo from "../../../carrousel/uc_berkeley.webp";
import chimieParisLogo from "../../../carrousel/chimie_paris.webp";
import polytechniqueLogo from "../../../carrousel/polytechnique.webp";

const TOTAL = 11;

export default function DeckPage() {
  const [s, setS] = useState(0);

  const go = useCallback(
    (n: number) => setS(Math.max(0, Math.min(TOTAL - 1, n))),
    [],
  );

  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight" || e.key === " ") { e.preventDefault(); go(s + 1); }
      if (e.key === "ArrowLeft") { e.preventDefault(); go(s - 1); }
    };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [go, s]);

  useEffect(() => {
    let x0 = 0;
    const ts = (e: TouchEvent) => { x0 = e.touches[0].clientX; };
    const te = (e: TouchEvent) => {
      const dx = e.changedTouches[0].clientX - x0;
      if (Math.abs(dx) > 60) go(dx < 0 ? s + 1 : s - 1);
    };
    window.addEventListener("touchstart", ts, { passive: true });
    window.addEventListener("touchend", te, { passive: true });
    return () => { window.removeEventListener("touchstart", ts); window.removeEventListener("touchend", te); };
  }, [go, s]);

  return (
    <>
      <style>{CSS_TEXT}</style>
      <div className="dk">
        {/* progress */}
        <div className="dk-prog"><div className="dk-prog-bar" style={{ width: `${((s + 1) / TOTAL) * 100}%` }} /></div>

        {/* slide */}
        <div className="dk-stage" key={s}>
          <div className="dk-slide">{SLIDES[s]}</div>
        </div>

        {/* nav */}
        <div className="dk-nav">
          <button onClick={() => go(s - 1)} disabled={s === 0} className="dk-btn">
            <svg width="18" height="18" viewBox="0 0 20 20" fill="currentColor"><path d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z"/></svg>
          </button>
          <span className="dk-count">{s + 1} / {TOTAL}</span>
          <button onClick={() => go(s + 1)} disabled={s === TOTAL - 1} className="dk-btn">
            <svg width="18" height="18" viewBox="0 0 20 20" fill="currentColor"><path d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z"/></svg>
          </button>
        </div>

        {/* brand */}
        <span className="dk-brand">sylvy.co</span>
      </div>
    </>
  );
}

/* ═══════════════════════════════════════
   SLIDES
   ═══════════════════════════════════════ */

const SLIDES = [

  /* ── 1  COVER ── */
  (
    <div className="sl sl-cover" key="cover">
      <div className="cover-glow" />
      <div className="cover-center">
        <div className="cover-logo-row">
          <span className="cover-title">Sylvy</span>
          <Image src={logoWhite} alt="Sylvy" width={120} height={120} className="cover-frog" />
        </div>
        <p className="cover-sub">AI BRAIN FOR LAB EFFICIENCY</p>
        <p className="cover-tagline">Private AI trained on each lab&apos;s own data</p>
      </div>
      <div className="cover-bottom">
        <div className="cover-line" />
        <p className="cover-names"><strong>Cl&eacute;ment Djezvedjian</strong> &ndash; CEO</p>
        <p className="cover-names"><strong>Aymeric Desbazeille</strong> &ndash; CTO</p>
        <p className="cover-season">Spring 2026</p>
      </div>
    </div>
  ),

  /* ── 2  HOOK ── */
  (
    <div className="sl sl-green" key="hook">
      <div className="sl-logo"><Image src={logoWhite} alt="" width={28} height={28} /><span>Sylvy</span></div>
      <div className="hook-body">
        <p className="hook-lead">Every lab is sitting on years of experiments.<br />But no one can really use them.</p>
        <div className="hook-details">
          <p>Protocols are written in notebooks.</p>
          <p>Results are scattered across Excel files.</p>
          <p>Insights are locked in PDFs and people&apos;s memories.</p>
        </div>
        <p className="hook-punch">Researchers don&apos;t lack data.<br />They lack <strong>structured memory</strong>.</p>
        <div className="hook-cta">Sylvy turns every lab&apos;s past work into a searchable, evolving scientific brain.</div>
      </div>
    </div>
  ),

  /* ── 3  PROBLEM / OPPORTUNITY ── */
  (
    <div className="sl sl-green" key="problem">
      <div className="sl-logo"><Image src={logoWhite} alt="" width={28} height={28} /><span>Sylvy</span></div>
      <h1 className="sl-h1-huge">Problem / Opportunity</h1>
      <div className="prob-two-col">
        <div className="prob-col">
          <h3 className="prob-col-title">Labs lose massive time on:</h3>
          <ul className="sl-bullets-sm">
            <li>Writing and rewriting protocols</li>
            <li>Searching for past experiments</li>
            <li>Comparing results manually</li>
            <li>Reproducing what was already tried</li>
            <li>Generating graphs &amp; statistics manually</li>
          </ul>
        </div>
        <div className="prob-col">
          <h3 className="prob-col-title">Current tools fail because:</h3>
          <ul className="sl-bullets-sm">
            <li>ELNs like Benchling are complex and not AI-native</li>
            <li>AI tools are generic and don&apos;t know the lab&apos;s data</li>
            <li>Knowledge is fragmented across tools</li>
          </ul>
        </div>
      </div>
      <p className="prob-core">A lab has no structured, intelligent memory of its own science.</p>
    </div>
  ),

  /* ── 4  SOLUTION / DEMO ── */
  (
    <div className="sl sl-page" key="solution">
      <div className="sl-logo"><Image src={logoWhite} alt="" width={28} height={28} /><span>Sylvy</span></div>
      <h1 className="sl-h1-huge">Your Solution</h1>
      <p className="sol-intro">Sylvy is a private AI assistant trained on a lab&apos;s own data.</p>
      <p className="sol-sub">Researchers write experiments in natural language. Sylvy:</p>
      <div className="sol-grid">
        <div className="sol-item">Structures protocols, parameters, and results</div>
        <div className="sol-item">Builds a lab-specific knowledge base</div>
        <div className="sol-item">Trains a private AI agent per lab</div>
        <div className="sol-item">Enables querying past experiments</div>
        <div className="sol-item">Compares experiments automatically</div>
        <div className="sol-item">Generates new protocols based on internal data</div>
        <div className="sol-item">Explains what worked and what failed</div>
      </div>
      <p className="sol-vision">Over time, Sylvy becomes a <strong>continuously improving scientific brain</strong>.</p>
    </div>
  ),

  /* ── 5  EVIDENCE / TRACTION ── */
  (
    <div className="sl sl-green" key="traction">
      <div className="sl-logo"><Image src={logoWhite} alt="" width={28} height={28} /><span>Sylvy</span></div>
      <h1 className="sl-h1-huge">Evidence / Traction</h1>
      <div className="traction-body">
        <ul className="sl-bullets">
          <li>Built with direct access to UC Berkeley labs</li>
          <li>Deep domain expertise (CNRS, CEA, Servier, Merck, biotech startup experience)</li>
          <li>Strong researcher network validating pain points</li>
          <li>MVP in development (launch April 2026)</li>
          <li>Building directly with end users from day one</li>
        </ul>
        <div className="traction-logos">
          <Image src={ucBerkeleyLogo} alt="UC Berkeley" width={100} height={40} className="team-logo-img" />
          <Image src={merckLogo} alt="Merck" width={80} height={32} className="team-logo-img" />
          <Image src={servierLogo} alt="Servier" width={80} height={32} className="team-logo-img" />
        </div>
      </div>
    </div>
  ),

  /* ── 6  MARKET & WHY NOW ── */
  (
    <div className="sl sl-green" key="market">
      <div className="sl-logo"><Image src={logoWhite} alt="" width={28} height={28} /><span>Sylvy</span></div>
      <h1 className="sl-h1-huge">Market &amp; Why Now</h1>
      <div className="prob-two-col">
        <div className="prob-col">
          <h3 className="prob-col-title">Market</h3>
          <ul className="sl-bullets-sm">
            <li>Biotech startups</li>
            <li>Academic labs</li>
            <li>Pharmaceutical R&amp;D teams</li>
            <li>Life science companies</li>
          </ul>
          <p className="market-note">Tens of thousands of labs globally.<br />$10k&ndash;$100k annual contract value per lab.</p>
          <p className="market-highlight">$10M&ndash;$100M ARR at ~1000 clients.</p>
        </div>
        <div className="prob-col">
          <h3 className="prob-col-title">Why Now</h3>
          <ul className="sl-bullets-sm">
            <li>AI infrastructure mature (LLMs + RAG)</li>
            <li>Labs increasingly digital but still unstructured</li>
            <li>Biotech funding pressure &rarr; need for efficiency</li>
            <li>AI-native software replacing legacy tools</li>
          </ul>
        </div>
      </div>
    </div>
  ),

  /* ── 7  BUSINESS MODEL & GTM ── */
  (
    <div className="sl sl-page" key="bizmodel">
      <div className="sl-logo"><Image src={logoWhite} alt="" width={28} height={28} /><span>Sylvy</span></div>
      <h1 className="sl-h1-huge">Business Model &amp; Go-To-Market</h1>
      <div className="prob-two-col">
        <div className="prob-col">
          <h3 className="prob-col-title">Business Model</h3>
          <ul className="sl-bullets-sm">
            <li>B2B SaaS</li>
            <li>$200 / user / month</li>
            <li>$10k&ndash;$100k per lab per year depending on size</li>
          </ul>
        </div>
        <div className="prob-col">
          <h3 className="prob-col-title">Go-To-Market</h3>
          <ul className="sl-bullets-sm">
            <li>Start with biotech startups (fast adoption)</li>
            <li>Leverage Bay Area biotech ecosystem</li>
            <li>Direct founder-led sales</li>
            <li>Expand to pharma R&amp;D teams</li>
          </ul>
        </div>
      </div>
    </div>
  ),

  /* ── 8  COMPETITION & MOAT ── */
  (
    <div className="sl sl-green" key="comp">
      <div className="sl-logo"><Image src={logoWhite} alt="" width={28} height={28} /><span>Sylvy</span></div>
      <h1 className="sl-h1-huge">Competition &amp; Moat</h1>
      <div className="prob-two-col">
        <div className="prob-col">
          <h3 className="prob-col-title">Benchling (YC S12)</h3>
          <ul className="sl-bullets-sm">
            <li>Complex onboarding</li>
            <li>Not AI-native</li>
            <li>AI added as feature, not core architecture</li>
          </ul>
          <h3 className="prob-col-title" style={{ marginTop: "1rem" }}>Sylvy</h3>
          <ul className="sl-bullets-sm">
            <li>AI-native from day one</li>
            <li>Lab-specific private AI agents</li>
            <li>Structured data + intelligence layer</li>
            <li>The more a lab uses Sylvy, the smarter it becomes</li>
          </ul>
        </div>
        <div className="prob-col">
          <h3 className="prob-col-title">Moat</h3>
          <ul className="sl-bullets-sm">
            <li>Proprietary structured lab datasets</li>
            <li>Data network effects within each lab</li>
            <li>Deep workflow integration</li>
            <li>Switching cost increases over time</li>
          </ul>
        </div>
      </div>
    </div>
  ),

  /* ── 9  TEAM ── */
  (
    <div className="sl sl-page" key="team">
      <div className="sl-logo"><Image src={logoWhite} alt="" width={28} height={28} /><span>Sylvy</span></div>
      <h1 className="sl-h1" style={{ fontSize: "clamp(2.5rem,6vw,4.5rem)" }}>Team &ndash; Why Us</h1>
      <div className="team-grid">
        <div className="team-card">
          <div className="team-photo-placeholder">CD</div>
          <div className="team-info">
            <h3 className="team-name">Cl&eacute;ment Djezvedjian</h3>
            <p className="team-role">CEO &ndash; Biology &amp; Chemistry Engineer</p>
            <ul className="team-exp">
              <li>CNRS &amp; CEA oncology lab</li>
              <li>Servier (France)</li>
              <li>Merck (Switzerland)</li>
              <li>Biotech startup experience</li>
            </ul>
            <div className="team-logos">
              <Image src={ucBerkeleyLogo} alt="UC Berkeley" width={100} height={40} className="team-logo-img" />
              <Image src={merckLogo} alt="Merck" width={80} height={32} className="team-logo-img" />
              <Image src={servierLogo} alt="Servier" width={80} height={32} className="team-logo-img" />
              <Image src={chimieParisLogo} alt="Chimie Paris" width={80} height={32} className="team-logo-img" />
            </div>
          </div>
        </div>
        <div className="team-card">
          <div className="team-photo-placeholder">AD</div>
          <div className="team-info">
            <h3 className="team-name">Aymeric Desbazeille</h3>
            <p className="team-role">CTO &ndash; Full-stack AI product builder</p>
            <ul className="team-exp">
              <li>Builds entire stack (frontend, backend, AI infra)</li>
            </ul>
            <div className="team-logos">
              <Image src={ucBerkeleyLogo} alt="UC Berkeley" width={100} height={40} className="team-logo-img" />
              <Image src={polytechniqueLogo} alt="X-HEC" width={100} height={40} className="team-logo-img" />
            </div>
          </div>
        </div>
      </div>
      <p className="team-combo">Deep lab experience + Technical AI execution + Proximity to US biotech ecosystem</p>
    </div>
  ),

  /* ── 10  FUNDING ── */
  (
    <div className="sl sl-green" key="funding">
      <div className="sl-logo"><Image src={logoWhite} alt="" width={28} height={28} /><span>Sylvy</span></div>
      <h1 className="sl-h1-huge">Funding &ndash; Ask &amp; Milestones</h1>
      <p className="fund-goal">Build the first AI-native operating system for scientific research.</p>
      <div className="prob-two-col">
        <div className="prob-col">
          <h3 className="prob-col-title">Use of funds</h3>
          <ul className="sl-bullets-sm">
            <li>Ship production-ready MVP</li>
            <li>Deploy in first biotech labs</li>
            <li>Hire 1&ndash;2 engineers</li>
            <li>Scale early sales in Bay Area</li>
          </ul>
        </div>
        <div className="prob-col">
          <h3 className="prob-col-title">Milestones</h3>
          <ul className="sl-bullets-sm">
            <li>First paying labs</li>
            <li>$100k+ ARR</li>
            <li>AI performance optimized on real datasets</li>
          </ul>
        </div>
      </div>
    </div>
  ),

  /* ── 11  CLOSING ── */
  (
    <div className="sl sl-black" key="close">
      <div className="close-center">
        <div className="cover-logo-row">
          <span className="close-title">Sylvy</span>
          <Image src={logoWhite} alt="Sylvy" width={100} height={100} className="cover-frog" />
        </div>
        <div className="close-summary">
          <p>Science is built on accumulated knowledge.<br />Yet most labs cannot access their own.</p>
          <p className="close-green">Sylvy transforms lab data into intelligence.</p>
          <p className="close-keywords">AI-native. Private. Compounding over time.</p>
          <p className="close-mission">We are building the scientific brain for every lab.</p>
        </div>
      </div>
    </div>
  ),
];

/* ═══════════════════════════════════════
   CSS
   ═══════════════════════════════════════ */

const CSS_TEXT = `
@keyframes fadeIn { from{opacity:0;transform:translateY(18px)} to{opacity:1;transform:translateY(0)} }

.dk{position:fixed;inset:0;overflow:hidden;background:#0a0a0a;color:#fff;font-family:"Pulp","Google Sans Code",var(--font-title),system-ui,sans-serif;display:flex;flex-direction:column;user-select:none}

/* progress */
.dk-prog{position:absolute;top:0;left:0;right:0;height:3px;background:rgba(255,255,255,.06);z-index:30}
.dk-prog-bar{height:100%;background:#00ac73;transition:width .4s ease}

/* stage */
.dk-stage{flex:1;display:flex;align-items:center;justify-content:center;padding:1rem;overflow:hidden}
.dk-slide{width:100%;max-width:1100px;height:100%;max-height:680px;animation:fadeIn .4s ease both}

/* nav */
.dk-nav{position:absolute;bottom:1rem;left:50%;transform:translateX(-50%);display:flex;align-items:center;gap:.75rem;z-index:30}
.dk-btn{display:flex;align-items:center;justify-content:center;width:32px;height:32px;border-radius:50%;background:rgba(255,255,255,.08);color:#fff;border:none;cursor:pointer;transition:background .2s}
.dk-btn:hover:not(:disabled){background:rgba(255,255,255,.18)}
.dk-btn:disabled{opacity:.2;cursor:default}
.dk-count{font-size:.7rem;color:rgba(255,255,255,.35);font-variant-numeric:tabular-nums;min-width:3rem;text-align:center}
.dk-brand{position:absolute;bottom:1rem;right:1.5rem;font-size:.65rem;color:rgba(255,255,255,.25);z-index:30}

/* ─── SLIDE BASE ─── */
.sl{position:relative;width:100%;height:100%;border-radius:12px;overflow:hidden;display:flex;flex-direction:column;padding:2.5rem 3rem}

/* green gradient bg (matches PDF) */
.sl-green{background:linear-gradient(135deg,#1a8c3c 0%,#0f6b2e 25%,#0d4f22 50%,#0a2f14 75%,#050d09 100%)}
.sl-page{background:linear-gradient(160deg,#0d3b1c 0%,#091f10 40%,#050d09 100%)}
.sl-black{background:#000}

/* ─── COVER ─── */
.sl-cover{
  background:linear-gradient(135deg,#1a8c3c 0%,#0f6b2e 25%,#0d4f22 50%,#0a2f14 75%,#050d09 100%);
  justify-content:center;align-items:center;padding:0;
}
.cover-glow{position:absolute;width:600px;height:600px;border-radius:50%;background:radial-gradient(circle,rgba(30,180,90,.25) 0%,transparent 70%);top:30%;left:25%;transform:translate(-50%,-50%);pointer-events:none}
.cover-center{display:flex;flex-direction:column;align-items:center;z-index:1}
.cover-logo-row{display:flex;align-items:center;gap:0.5rem}
.cover-title{font-size:clamp(4rem,10vw,8rem);font-weight:300;letter-spacing:-.02em;line-height:1}
.cover-frog{object-fit:contain}
.cover-sub{font-size:clamp(.85rem,1.8vw,1.2rem);letter-spacing:.15em;color:rgba(255,255,255,.7);margin-top:.25rem}
.cover-bottom{position:absolute;bottom:2.5rem;left:3rem;z-index:1}
.cover-line{width:min(80vw,900px);height:1px;background:rgba(255,255,255,.35);margin-bottom:1.25rem}
.cover-tagline{font-size:clamp(.75rem,1.5vw,1rem);color:rgba(255,255,255,.5);margin-top:.75rem;letter-spacing:.05em}
.cover-names{font-size:.95rem;color:rgba(255,255,255,.85);letter-spacing:.06em;line-height:1.6}
.cover-season{font-size:.8rem;color:rgba(255,255,255,.4);margin-top:.75rem;letter-spacing:.1em}

/* ─── SHARED ─── */
.sl-logo{display:flex;align-items:center;gap:.5rem;font-size:1rem;font-weight:600;color:#fff;margin-bottom:1rem}
.sl-logo img{object-fit:contain}
.sl-h1{font-size:clamp(2rem,5vw,3.5rem);font-weight:700;line-height:1.1;margin-bottom:.75rem}
.sl-h1-huge{font-size:clamp(2.5rem,6vw,4.5rem);font-weight:700;line-height:1.05;margin-bottom:1rem}

/* ─── BULLETS (ICP) ─── */
.sl-bullets{list-style:disc;padding-left:1.5rem;margin-top:1rem;display:flex;flex-direction:column;gap:.7rem}
.sl-bullets li{font-size:clamp(1rem,2.2vw,1.45rem);color:rgba(255,255,255,.9);line-height:1.4}

/* ─── TEAM ─── */
.team-grid{display:grid;grid-template-columns:1fr 1fr;gap:2rem;margin-top:1rem;flex:1}
.team-card{background:linear-gradient(160deg,rgba(0,172,115,.12) 0%,rgba(0,0,0,.3) 100%);border:1px solid rgba(255,255,255,.08);border-radius:1rem;padding:1.5rem;display:flex;flex-direction:column;gap:1rem}
.team-photo-placeholder{width:100%;aspect-ratio:1;max-width:180px;border-radius:.75rem;background:linear-gradient(135deg,#1a8c3c,#0d4f22);display:flex;align-items:center;justify-content:center;font-size:2.5rem;font-weight:700;color:rgba(255,255,255,.5)}
.team-info{flex:1}
.team-name{font-size:1.1rem;font-weight:700;color:#fff}
.team-role{font-size:.85rem;color:rgba(255,255,255,.55);margin-top:.15rem}
.team-logos{display:flex;flex-wrap:wrap;gap:.75rem;margin-top:.75rem;align-items:center}
.team-logo-img{object-fit:contain;height:28px;width:auto;opacity:.85;filter:brightness(0) invert(1);max-width:90px}
.team-exp{list-style:none;padding:0;margin-top:.4rem;display:flex;flex-direction:column;gap:.15rem}
.team-exp li{font-size:.78rem;color:rgba(255,255,255,.6);line-height:1.3}
.team-exp li::before{content:"- ";color:rgba(255,255,255,.3)}
.team-combo{font-size:clamp(.8rem,1.4vw,1rem);color:rgba(255,255,255,.6);text-align:center;margin-top:auto;padding-top:.75rem;border-top:1px solid rgba(255,255,255,.1)}
@media(max-width:640px){.team-grid{grid-template-columns:1fr}.team-photo-placeholder{max-width:120px}}

/* ─── HOOK ─── */
.hook-body{flex:1;display:flex;flex-direction:column;justify-content:center;gap:1.5rem;max-width:52rem}
.hook-lead{font-size:clamp(1.2rem,2.5vw,1.8rem);color:#fff;font-weight:600;line-height:1.4}
.hook-details p{font-size:clamp(.9rem,1.8vw,1.15rem);color:rgba(255,255,255,.6);line-height:1.7}
.hook-punch{font-size:clamp(1.1rem,2.2vw,1.5rem);color:rgba(255,255,255,.9);line-height:1.4}
.hook-cta{font-size:clamp(1rem,2vw,1.3rem);color:#6ee7b7;font-weight:600;margin-top:.5rem;border-left:3px solid #00ac73;padding-left:1rem}

/* ─── PROBLEMS ─── */
.prob-two-col{display:grid;grid-template-columns:1fr 1fr;gap:2rem;flex:1;align-items:start;margin-top:.5rem}
.prob-col-title{font-size:clamp(.9rem,1.6vw,1.1rem);font-weight:700;color:#6ee7b7;margin-bottom:.5rem}
.prob-core{font-size:clamp(1rem,2vw,1.3rem);color:#fff;font-weight:600;margin-top:auto;padding-top:1rem;border-top:1px solid rgba(255,255,255,.15);text-align:center}
.sl-bullets-sm{list-style:disc;padding-left:1.2rem;display:flex;flex-direction:column;gap:.35rem}
.sl-bullets-sm li{font-size:clamp(.78rem,1.5vw,1rem);color:rgba(255,255,255,.8);line-height:1.4}
@media(max-width:640px){.prob-two-col{grid-template-columns:1fr}}

/* ─── SOLUTION ─── */
.sol-intro{font-size:clamp(.95rem,1.8vw,1.2rem);color:rgba(255,255,255,.9);margin-bottom:.25rem}
.sol-sub{font-size:clamp(.85rem,1.5vw,1rem);color:rgba(255,255,255,.55);margin-bottom:.75rem}
.sol-grid{display:grid;grid-template-columns:1fr 1fr;gap:.5rem .75rem;flex:1;align-content:start}
.sol-item{font-size:clamp(.78rem,1.4vw,.95rem);color:rgba(255,255,255,.8);padding:.5rem .75rem;background:rgba(0,172,115,.08);border:1px solid rgba(0,172,115,.15);border-radius:.5rem}
.sol-vision{font-size:clamp(.95rem,1.8vw,1.15rem);color:#6ee7b7;margin-top:auto;padding-top:.75rem}

/* ─── TRACTION ─── */
.traction-body{flex:1;display:flex;flex-direction:column;justify-content:center}
.traction-logos{display:flex;gap:1.5rem;align-items:center;margin-top:2rem;padding-top:1.5rem;border-top:1px solid rgba(255,255,255,.1)}

/* ─── MARKET ─── */
.market-layout{flex:1;display:flex;align-items:center;position:relative}
.market-circles{position:relative;width:100%;height:100%;min-height:300px}
.market-c{border-radius:50%;position:absolute;display:flex;align-items:center;justify-content:center}
.market-c1{width:clamp(260px,42vw,420px);height:clamp(260px,42vw,420px);background:rgba(10,40,20,.9);border:1px solid rgba(255,255,255,.06);top:5%;left:2%}
.market-c2{width:70%;height:70%;background:rgba(0,100,50,.35);border:1px solid rgba(255,255,255,.06)}
.market-c3{width:65%;height:65%;background:rgba(0,172,115,.25);border:1px solid rgba(255,255,255,.08)}
.market-label{position:absolute;display:flex;align-items:center;gap:.75rem}
.market-val{font-size:clamp(1.2rem,2.8vw,1.8rem);font-weight:700;color:#fff}
.market-val-green{color:#6ee7b7}
.market-dash{width:clamp(30px,5vw,60px);height:1px;background:rgba(255,255,255,.4)}
.market-desc{font-size:clamp(.75rem,1.4vw,1rem);color:rgba(255,255,255,.7)}
.market-line{position:absolute;right:clamp(1rem,8vw,6rem);top:8%;bottom:8%;width:1px;background:rgba(255,255,255,.15)}
.market-note{font-size:clamp(.75rem,1.3vw,.9rem);color:rgba(255,255,255,.55);margin-top:.75rem;line-height:1.5}
.market-highlight{font-size:clamp(.9rem,1.6vw,1.1rem);color:#6ee7b7;font-weight:700;margin-top:.5rem}

/* ─── FUNDING ─── */
.fund-goal{font-size:clamp(.95rem,1.8vw,1.2rem);color:#6ee7b7;font-weight:600;margin-bottom:1rem}

/* ─── CLOSING ─── */
.close-center{flex:1;display:flex;flex-direction:column;align-items:center;justify-content:center}
.close-title{font-size:clamp(4rem,10vw,8rem);font-weight:300;letter-spacing:-.02em;line-height:1;text-decoration:underline;text-decoration-thickness:3px;text-underline-offset:8px}
.close-summary{text-align:center;margin-top:2rem;display:flex;flex-direction:column;gap:1rem}
.close-summary p{font-size:clamp(.9rem,1.8vw,1.15rem);color:rgba(255,255,255,.7);line-height:1.6}
.close-green{color:#6ee7b7!important;font-weight:600;font-size:clamp(1rem,2vw,1.3rem)!important}
.close-keywords{color:rgba(255,255,255,.5)!important;letter-spacing:.15em;font-size:clamp(.85rem,1.5vw,1rem)!important}
.close-mission{color:#fff!important;font-weight:700;font-size:clamp(1.1rem,2.2vw,1.5rem)!important}
`;
