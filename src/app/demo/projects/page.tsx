"use client";

import { motion } from "framer-motion";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useState } from "react";
import logoBlack from "../../../../logo/Logo Noir sans Fond.webp";

/* ─── Animation Presets ─── */
const ease = [0.25, 0.46, 0.45, 0.94] as const;

/* ─── Glass Card Styles ─── */
const glass = {
  background: "rgba(255, 255, 255, 0.72)",
  backdropFilter: "blur(40px) saturate(1.8)",
  WebkitBackdropFilter: "blur(40px) saturate(1.8)",
  boxShadow:
    "0 0.5px 0 0 rgba(255,255,255,0.6) inset, 0 1px 3px rgba(0,0,0,0.04), 0 8px 28px rgba(0,0,0,0.04)",
  border: "0.5px solid rgba(255,255,255,0.5)",
} as const;

const glassFocused = {
  ...glass,
  background: "rgba(255, 255, 255, 0.88)",
  boxShadow:
    "0 0.5px 0 0 rgba(255,255,255,0.8) inset, 0 2px 12px rgba(0,0,0,0.06), 0 12px 40px rgba(0,0,0,0.06)",
} as const;

/* ─── Inline SVG Icons ─── */
const BrainIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 2C9.5 2 8 3.5 8 5.5c0 .5.1 1 .3 1.4C6.4 7.5 5 9.2 5 11.2c0 1.5.7 2.8 1.8 3.7-.5.8-.8 1.7-.8 2.6C6 19.5 7.8 21 10 21.5" stroke="#b0b0b0" />
    <path d="M12 2c2.5 0 4 1.5 4 3.5 0 .5-.1 1-.3 1.4 1.9.6 3.3 2.3 3.3 4.3 0 1.5-.7 2.8-1.8 3.7.5.8.8 1.7.8 2.6 0 2-1.8 3.5-4 4" stroke="#b0b0b0" />
    <path d="M12 2v20" stroke="#c8c8c8" />
    <path d="M8 8h8" stroke="#c8c8c8" />
    <path d="M9 14h6" stroke="#c8c8c8" />
  </svg>
);

const SearchIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#aaa" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="11" cy="11" r="7" />
    <path d="m20 20-3.5-3.5" />
  </svg>
);

/* ─── Project Icons ─── */
const DnaIcon = () => (
  <svg width="60" height="60" viewBox="0 0 48 48" fill="none" strokeLinecap="round" strokeLinejoin="round">
    {/* Double helix strands */}
    <path
      d="M16 6c0 6 16 6 16 12s-16 6-16 12c0 6 16 6 16 12"
      stroke="#E88B8B"
      strokeWidth="1.8"
      fill="none"
    />
    <path
      d="M32 6c0 6-16 6-16 12s16 6 16 12c0 6-16 6-16 12"
      stroke="#D4726E"
      strokeWidth="1.8"
      fill="none"
    />
    {/* Rungs */}
    <line x1="18" y1="9" x2="30" y2="9" stroke="#E8A0A0" strokeWidth="1.2" opacity="0.6" />
    <line x1="16.5" y1="12" x2="31.5" y2="12" stroke="#E8A0A0" strokeWidth="1.2" opacity="0.6" />
    <line x1="18" y1="21" x2="30" y2="21" stroke="#E8A0A0" strokeWidth="1.2" opacity="0.6" />
    <line x1="16.5" y1="24" x2="31.5" y2="24" stroke="#E8A0A0" strokeWidth="1.2" opacity="0.6" />
    <line x1="18" y1="33" x2="30" y2="33" stroke="#E8A0A0" strokeWidth="1.2" opacity="0.6" />
    <line x1="16.5" y1="36" x2="31.5" y2="36" stroke="#E8A0A0" strokeWidth="1.2" opacity="0.6" />
  </svg>
);

const ProteinIcon = () => (
  <svg width="60" height="60" viewBox="0 0 48 48" fill="none" strokeLinecap="round" strokeLinejoin="round">
    {/* Abstract protein loops */}
    <ellipse cx="20" cy="22" rx="10" ry="8" stroke="#6AADD8" strokeWidth="1.8" fill="none" />
    <ellipse cx="30" cy="26" rx="9" ry="7" stroke="#85C0E8" strokeWidth="1.8" fill="none" />
    <circle cx="22" cy="30" r="6" stroke="#6AADD8" strokeWidth="1.8" fill="none" />
    {/* Small dot accents */}
    <circle cx="14" cy="18" r="1.5" fill="#A8D4F0" />
    <circle cx="36" cy="22" r="1.5" fill="#A8D4F0" />
  </svg>
);

const CellIcon = () => (
  <svg width="60" height="60" viewBox="0 0 48 48" fill="none" strokeLinecap="round" strokeLinejoin="round">
    {/* Cell membrane */}
    <path
      d="M24 8c8 0 16 4 16 14s-6 18-16 18S8 32 8 22 16 8 24 8Z"
      stroke="#E8B44C"
      strokeWidth="1.8"
      fill="none"
    />
    {/* Nucleus */}
    <ellipse cx="24" cy="22" rx="7" ry="6" stroke="#D9A03E" strokeWidth="1.5" fill="none" />
    {/* Nucleolus */}
    <circle cx="25" cy="21" r="2.5" fill="#E8C878" opacity="0.5" />
    {/* Small organelles */}
    <circle cx="15" cy="26" r="1.5" stroke="#E8B44C" strokeWidth="1" fill="none" />
    <circle cx="33" cy="18" r="1.2" stroke="#E8B44C" strokeWidth="1" fill="none" />
    <path d="M18 16c1-1 3-1 3.5 0" stroke="#D9A03E" strokeWidth="1" opacity="0.5" />
  </svg>
);

/* ─── Project Data ─── */
const projects = [
  {
    title: "Crispr-Cas9\nSequence A12",
    icon: <DnaIcon />,
    color: "#E88B8B",
  },
  {
    title: "Protein PDB\n1AON Synthesis",
    icon: <ProteinIcon />,
    color: "#6AADD8",
  },
  {
    title: "HEK 293\nCell transfo",
    icon: <CellIcon />,
    color: "#E8B44C",
  },
];

/* ─── Project Card ─── */
function ProjectCard({
  title,
  icon,
  index,
}: {
  title: string;
  icon: React.ReactNode;
  index: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: 0.2 + index * 0.1, ease }}
      whileHover={{
        y: -4,
        boxShadow:
          "0 0.5px 0 0 rgba(255,255,255,0.8) inset, 0 4px 20px rgba(0,0,0,0.07), 0 16px 48px rgba(0,0,0,0.06)",
      }}
      className="flex flex-col items-center rounded-[22px] p-7 pb-8 cursor-pointer transition-colors"
      style={{
        ...glass,
        width: 240,
      }}
    >
      {/* Title */}
      <div className="text-center mb-6">
        {title.split("\n").map((line, i) => (
          <p
            key={i}
            className="text-[17px] font-semibold text-[#1d1d1f] leading-snug tracking-[-0.01em]"
          >
            {line}
          </p>
        ))}
      </div>

      {/* Icon Container */}
      <div
        className="flex items-center justify-center w-[120px] h-[120px] rounded-[20px]"
        style={{ background: "rgba(0,0,0,0.025)" }}
      >
        {icon}
      </div>
    </motion.div>
  );
}

/* ─── Main Page ─── */
export default function SylvyProjectsPage() {
  const router = useRouter();
  const [searchFocused, setSearchFocused] = useState(false);

  return (
    <div
      className="min-h-screen w-full relative overflow-hidden"
      style={{
        background:
          "linear-gradient(145deg, #c8ddb8 0%, #a8c8a0 25%, #b8d4a8 50%, #c0d8b0 75%, #d0e0c0 100%)",
        fontFamily:
          "-apple-system, BlinkMacSystemFont, 'SF Pro Display', 'SF Pro Text', 'Helvetica Neue', sans-serif",
      }}
    >
      {/* Decorative gradient orbs */}
      <div
        className="pointer-events-none absolute top-[-20%] left-[-10%] w-[800px] h-[800px] rounded-full opacity-40"
        style={{
          background:
            "radial-gradient(circle, rgba(180,220,160,0.7) 0%, transparent 70%)",
        }}
      />
      <div
        className="pointer-events-none absolute bottom-[-10%] right-[-10%] w-[600px] h-[600px] rounded-full opacity-30"
        style={{
          background:
            "radial-gradient(circle, rgba(160,200,140,0.6) 0%, transparent 70%)",
        }}
      />

      <div className="relative z-10 mx-auto max-w-[1000px] px-6 py-10 md:py-14">
        {/* ─── Page Header ─── */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.65, delay: 0.05, ease }}
          className="mb-12 flex items-center justify-between px-1"
        >
          <div className="flex items-center gap-3">
            <motion.button
              onClick={() => router.push("/demo")}
              whileHover={{ scale: 1.05, x: -2 }}
              whileTap={{ scale: 0.95 }}
              className="flex items-center justify-center w-[32px] h-[32px] rounded-[10px] cursor-pointer transition-colors hover:bg-black/[0.04]"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#1d1d1f" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M15 18l-6-6 6-6" />
              </svg>
            </motion.button>
            <Image
              src={logoBlack}
              alt="Sylvy"
              width={32}
              height={32}
              className="object-contain flex-shrink-0"
            />
            <h1 className="text-[22px] font-semibold tracking-[0.08em] text-[#1d1d1f] uppercase">
              Projects
            </h1>
          </div>

          {/* New Project Button */}
          <motion.button
            whileHover={{ scale: 1.02, y: -1 }}
            whileTap={{ scale: 0.97 }}
            className="flex items-center gap-1.5 rounded-[12px] px-5 py-2.5 text-[13px] font-medium text-[#3c3c43] cursor-pointer transition-all"
            style={{
              background: "rgba(255,255,255,0.55)",
              backdropFilter: "blur(20px)",
              WebkitBackdropFilter: "blur(20px)",
              boxShadow:
                "0 0.5px 0 0 rgba(255,255,255,0.5) inset, 0 1px 4px rgba(0,0,0,0.04)",
              border: "0.5px solid rgba(255,255,255,0.4)",
            }}
          >
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
            >
              <path d="M12 5v14M5 12h14" />
            </svg>
            New Project
          </motion.button>
        </motion.div>

        {/* ─── Project Cards Grid ─── */}
        <div className="flex justify-center gap-6 mb-14">
          {projects.map((project, i) => (
            <ProjectCard
              key={i}
              title={project.title}
              icon={project.icon}
              index={i}
            />
          ))}
        </div>

        {/* ─── Search Bar ─── */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.65, delay: 0.5, ease }}
          className=""
        >
          <motion.div
            className="relative flex items-center rounded-[16px] px-5 py-7 transition-all duration-300 cursor-text"
            style={searchFocused ? glassFocused : glass}
          >
            <SearchIcon />
            <input
              type="text"
              placeholder="Ask Sylvy Labmind"
              className="ml-3 flex-1 bg-transparent text-[15px] font-normal text-[#1d1d1f] placeholder-[#86868b] outline-none tracking-[-0.01em]"
              style={{ fontFamily: "inherit" }}
              onFocus={() => setSearchFocused(true)}
              onBlur={() => setSearchFocused(false)}
            />
            <div className="flex items-center gap-2">
              <div className="h-5 w-px bg-[#d2d2d7]" />
              <BrainIcon />
            </div>
          </motion.div>
        </motion.div>

        {/* ─── Bottom dots ─── */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.65, delay: 0.6, ease }}
          className="flex justify-center mt-8 mb-4"
        >
          <div className="flex items-center gap-1 opacity-30">
            <div className="w-[5px] h-[5px] rounded-full bg-[#1d1d1f]" />
            <div className="w-[5px] h-[5px] rounded-full bg-[#1d1d1f]" />
            <div className="w-[5px] h-[5px] rounded-full bg-[#1d1d1f]" />
          </div>
        </motion.div>
      </div>
    </div>
  );
}
