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
  <svg width="20" height="20" viewBox="0 0 24 24" className="text-[#b0b0b0]" fill="currentColor">
    <path d="M21.33,12.91C21.42,14.46 20.71,15.95 19.44,16.86L20.21,18.35C20.44,18.8 20.47,19.33 20.27,19.8C20.08,20.27 19.69,20.64 19.21,20.8L18.42,21.05C18.25,21.11 18.06,21.14 17.88,21.14C17.37,21.14 16.89,20.91 16.56,20.5L14.44,18C13.55,17.85 12.71,17.47 12,16.9C11.5,17.05 11,17.13 10.5,17.13C9.62,17.13 8.74,16.86 8,16.34C7.47,16.5 6.93,16.57 6.38,16.56C5.59,16.57 4.81,16.41 4.08,16.11C2.65,15.47 1.7,14.07 1.65,12.5C1.57,11.78 1.69,11.05 2,10.39C1.71,9.64 1.68,8.82 1.93,8.06C2.3,7.11 3,6.32 3.87,5.82C4.45,4.13 6.08,3 7.87,3.12C9.47,1.62 11.92,1.46 13.7,2.75C14.12,2.64 14.56,2.58 15,2.58C16.36,2.55 17.65,3.15 18.5,4.22C20.54,4.75 22,6.57 22.08,8.69C22.13,9.8 21.83,10.89 21.22,11.82C21.29,12.18 21.33,12.54 21.33,12.91M16.33,11.5C16.9,11.57 17.35,12 17.35,12.57A1,1 0 0,1 16.35,13.57H15.72C15.4,14.47 14.84,15.26 14.1,15.86C14.35,15.95 14.61,16 14.87,16.07C20,16 19.4,12.87 19.4,12.82C19.34,11.39 18.14,10.27 16.71,10.33A1,1 0 0,1 15.71,9.33A1,1 0 0,1 16.71,8.33C17.94,8.36 19.12,8.82 20.04,9.63C20.09,9.34 20.12,9.04 20.12,8.74C20.06,7.5 19.5,6.42 17.25,6.21C16,3.25 12.85,4.89 12.85,5.81V5.81C12.82,6.04 13.06,6.53 13.1,6.56A1,1 0 0,1 14.1,7.56C14.1,8.11 13.65,8.56 13.1,8.56V8.56C12.57,8.54 12.07,8.34 11.67,8C11.19,8.31 10.64,8.5 10.07,8.56V8.56C9.5,8.61 9.03,8.21 9,7.66C8.92,7.1 9.33,6.61 9.88,6.56C10.04,6.54 10.82,6.42 10.82,5.79V5.79C10.82,5.13 11.07,4.5 11.5,4C10.58,3.75 9.59,4.08 8.59,5.29C6.75,5 6,5.25 5.45,7.2C4.5,7.67 4,8 3.78,9C4.86,8.78 5.97,8.87 7,9.25C7.5,9.44 7.78,10 7.59,10.54C7.4,11.06 6.82,11.32 6.3,11.13C5.57,10.81 4.75,10.79 4,11.07C3.68,11.34 3.68,11.9 3.68,12.34C3.68,13.08 4.05,13.77 4.68,14.17C5.21,14.44 5.8,14.58 6.39,14.57C6.24,14.31 6.11,14.04 6,13.76C5.81,13.22 6.1,12.63 6.64,12.44C7.18,12.25 7.77,12.54 7.96,13.08C8.36,14.22 9.38,15 10.58,15.13C11.95,15.06 13.17,14.25 13.77,13C14,11.62 15.11,11.5 16.33,11.5M18.33,18.97L17.71,17.67L17,17.83L18,19.08L18.33,18.97M13.68,10.36C13.7,9.83 13.3,9.38 12.77,9.33C12.06,9.29 11.37,9.53 10.84,10C10.27,10.58 9.97,11.38 10,12.19A1,1 0 0,0 11,13.19C11.57,13.19 12,12.74 12,12.19C12,11.92 12.07,11.65 12.23,11.43C12.35,11.33 12.5,11.28 12.66,11.28C13.21,11.31 13.68,10.9 13.68,10.36Z" />
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
    id: "crispr",
    title: "Crispr-Cas9\nSequence A12",
    name: "CRISPR-Cas9 Sequence A12",
    icon: <DnaIcon />,
    color: "#E88B8B",
  },
  {
    id: "protein",
    title: "Protein PDB\n1AON Synthesis",
    name: "Protein PDB 1AON Synthesis",
    icon: <ProteinIcon />,
    color: "#6AADD8",
  },
  {
    id: "cell",
    title: "HEK 293\nCell transfo",
    name: "HEK 293 Cell Transfection",
    icon: <CellIcon />,
    color: "#E8B44C",
  },
];

/* ─── Project Card ─── */
function ProjectCard({
  title,
  icon,
  index,
  onClick,
}: {
  title: string;
  icon: React.ReactNode;
  index: number;
  onClick?: () => void;
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
      onClick={onClick}
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
              key={project.id}
              title={project.title}
              icon={project.icon}
              index={i}
              onClick={() => router.push(`/demo/experiments?project=${project.id}&name=${encodeURIComponent(project.name)}`)}
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
