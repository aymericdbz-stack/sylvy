"use client";

import Image from "next/image";
import {
  useEffect,
  useRef,
  useState,
  type ChangeEvent,
  type FormEvent,
} from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import logo from "../../logo/Logo Noir sans Fond.webp";
import logoWhite from "../../logo/Logo Blanc sans Fond.webp";
import sylvyNoteImage from "../../logo/Sylvy note.webp";
import sylvyClockImage from "../../logo/Sylvy clock.webp";
import sylvyBrainImage from "../../logo/Sylvy brain.webp";
import labBrainImage from "../../logo/Lab_brain.webp";
import notebookBefore from "../../photos_videos/Pierre_et_Marie_Curie.png";
import notebookAfter from "../../photos_videos/Sylvy_notebook.png";
import NotebookMorphDrag from "@/components/NotebookMorphDrag";
import HyperspaceHero from "@/components/HyperspaceHero";
import snapgeneLogo from "../../logo_software/snapgene.svg";
import benchlingLogo from "../../logo_software/benchling.webp";
import excelLogo from "../../logo_software/excel.webp";
import notionLogo from "../../logo_software/notion.webp";
import chatgptLogo from "../../logo_software/ChatGPT.webp";
import claudeLogo from "../../logo_software/claude.webp";
import labarchivesLogo from "../../logo_software/labarchives.webp";
import starlimsLogo from "../../logo_software/starlims.webp";
import imagejLogo from "../../logo_software/imagej.webp";
import matlabLogo from "../../logo_software/Matlab.webp";
import rstudioLogo from "../../logo_software/RStudio.webp";
import pythonLogo from "../../logo_software/python.webp";
import chemdrawLogo from "../../logo_software/Chemdraw.webp";

const copy = {
  en: {
    topBar: {
      message: "See how 120 biopharma teams scale R&D with Sylvy.",
      linkText: "Read the 2026 Lab AI report",
      login: "Login",
    },
    nav: {
      products: "Products",
      ai: "AI",
      solutions: "Solutions",
      customers: "Customers",
      resources: "Resources",
      company: "Company",
    },
    hero: {
      badge: "Pharma cloud platform",
      tagline: "Built for reproducible lab workflows",
      prefixPrimary: "Sylvy",
      prefixSecondary: "Your wet lab copilot",
      rotating: [
        "Generate protocols",
        "Execute workflows",
        "Explore results with AI",
        "Collaborate on cloud",
      ],
      points: [
        "Validated workflows",
        "Secure, compliant data",
        "Cross-site collaboration",
      ],
      primaryCta: "Try it !",
      secondaryCta: "Sign up",
    },
    modalitiesLabel: "Therapies",
    modalities: [
      {
        title: "Gene therapy",
        description: "Design, register, and track novel vectors with audit-ready data.",
      },
      {
        title: "Cell therapy",
        description: "Connect donor, batch, and QC data across sites in real time.",
      },
      {
        title: "Antibodies and proteins",
        description: "Centralize sequences, assays, and purification workflows.",
      },
      {
        title: "RNA therapeutics",
        description: "Standardize protocols and share results with confidence.",
      },
    ],
    logos: {
      title: "",
      items: ["Sanofi", "Moderna", "Novartis", "Roche", "Gilead"],
    },
    why: {
      badge: "Why Sylvy",
      title: "Why teams choose Sylvy",
      description:
        "Digitize your lab, automate workflows, and increase productivity with AI.",
      bullets: [
        "Plan, record, and share experiments in one collaborative notebook.",
        "Replace spreadsheets with structured sample and inventory tracking.",
        "Enable audit-ready reporting with validated cloud infrastructure.",
      ],
      cta: "Read more",
      cardTitle: "Study overview",
      cardTag: "Validated",
    },
    ai: {
      badge: "AI for every scientist",
      title: "AI for every scientist. Breakthroughs for all.",
      description:
        "Plan, record, and share experiments using a collaborative, cloud-based notebook.",
      points: [
        "Cut manual and repetitive work with automated workflows.",
        "Detect gaps in protocols before review and QA.",
        "Use AI to accelerate experiment planning and analysis.",
      ],
      cta: "Explore AI workflows",
      cardLabel: "Notebook checks",
      cardTitle: "AI checks",
      cardDescription:
        "Sylvy flags missing metadata and protocol gaps before submission.",
    },
    highlights: [
      {
        title: "Automated workflows",
        description: "Trigger approvals and data capture across every lab site.",
      },
      {
        title: "Compliance ready",
        description: "Electronic signatures, audit trails, and validated cloud.",
      },
      {
        title: "AI insights",
        description: "Surface trends and suggestions in seconds, not days.",
      },
    ],
    resources: {
      badge: "Resources",
      reportTitle: "2026 Biopharma AI Report",
      reportDescription:
        "We surveyed 120 labs on how AI is used across discovery and development.",
      reportCta: "Download report",
      reportNote: "Includes benchmarks for ELN, LIMS, and QA teams.",
      stats: [
        {
          value: "63%",
          label:
            "reduction in time spent on data capture, search, and collection",
        },
        {
          value: "10x",
          label: "increase in throughput for regulated sample handoffs",
        },
        {
          value: "2.4x",
          label: "faster decision cycles for cross-functional reviews",
        },
      ],
    },
    platform: {
      badge: "Platform",
      title: "Modules built for regulated labs",
      description:
        "From discovery to GMP, Sylvy scales with your process and compliance needs.",
      cta: "Platform overview",
      items: [
        {
          title: "Electronic lab notebook",
          description: "Standardize experiments with templates and guided steps.",
        },
        {
          title: "LIMS and sample tracking",
          description: "Track samples, containers, and storage locations in one view.",
        },
        {
          title: "Analytics and insights",
          description: "Monitor KPIs and experiment outcomes with live dashboards.",
        },
        {
          title: "Validated cloud",
          description: "Stay compliant with GxP-ready infrastructure and controls.",
        },
        {
          title: "Workflow automation",
          description: "Route approvals, QA checks, and notifications automatically.",
        },
        {
          title: "Inventory management",
          description: "Control reagents, supplies, and vendor qualification.",
        },
      ],
    },
    cta: {
      title: "Ready to modernize your lab?",
      description:
        "See how Sylvy unifies ELN, LIMS, and analytics for faster decisions.",
      primary: "Try it !",
      secondary: "Sign up",
    },
    footer: {
      addressTitle: "Sylvy",
      address: "20 rue Torricelli, 75017 Paris, France",
      buttons: {
        contact: "Contact us",
        support: "Support",
      },
      social: ["LinkedIn", "X"],
      columns: [
        {
          title: "Products",
          links: [
            "ELN",
            "LIMS",
            "Inventory",
            "Analytics",
            "Validated Cloud",
            "Developer Platform",
          ],
        },
        {
          title: "Solutions",
          links: [
            "Biopharmaceutical",
            "Cell therapy",
            "Gene therapy",
            "RNA therapeutics",
            "Antibodies",
          ],
        },
        {
          title: "Resources",
          links: [
            "Whats new",
            "Blog",
            "Content library",
            "Webinars",
            "Help center",
            "Community",
          ],
        },
        {
          title: "Company",
          links: [
            "About",
            "Careers",
            "Trust",
            "Newsroom",
            "Partners",
            "Contact",
          ],
        },
      ],
      legal: "Copyright 2026 Sylvy. All rights reserved.",
    },
    modal: {
      title: "Try it !",
      description: "Tell us about you and we'll reach out.",
      firstName: "First name",
      lastName: "Last name",
      email: "Work email",
      phone: "Phone number",
      submit: "Try it !",
      cancel: "Cancel",
      success: "Thanks. We will reach out.",
      error: "Something went wrong.",
    },
  },
  fr: {
    topBar: {
      message: "Decouvrez comment 120 equipes pharma accelerent la R&D.",
      linkText: "Lire le rapport Lab AI 2026",
      login: "Connexion",
    },
    nav: {
      products: "Produits",
      ai: "IA",
      solutions: "Solutions",
      customers: "Clients",
      resources: "Ressources",
      company: "Entreprise",
    },
    hero: {
      badge: "Plateforme cloud pharma",
      tagline: "Concu pour des workflows reproductibles",
      prefixPrimary: "Recherche.",
      prefixSecondary: "Sylvy fait le reste :",
      rotating: [
        "Protein extraction",
        "Western blot",
        "ELISA assay",
        "RNA extraction",
      ],
      points: [
        "Workflows valides",
        "Donnees securisees",
        "Collaboration multi-sites",
      ],
      primaryCta: "Try it !",
      secondaryCta: "Sign up",
    },
    modalitiesLabel: "Therapies",
    modalities: [
      {
        title: "Gene therapy",
        description: "Conception, enregistrement et suivi avec donnees auditees.",
      },
      {
        title: "Cell therapy",
        description: "Connectez donneurs, lots et QC sur tous les sites.",
      },
      {
        title: "Antibodies and proteins",
        description: "Centralisez sequences, tests et purification.",
      },
      {
        title: "RNA therapeutics",
        description: "Standardisez les protocoles et partagez les resultats.",
      },
    ],
    logos: {
      title: "",
      items: ["Sanofi", "Moderna", "Novartis", "Roche", "Gilead"],
    },
    why: {
      badge: "Pourquoi Sylvy",
      title: "Pourquoi les equipes choisissent Sylvy",
      description:
        "Digitalisez votre labo, automatisez les workflows et augmentez la productivite avec l'IA.",
      bullets: [
        "Planifiez et partagez les experiences dans un carnet collaboratif.",
        "Remplacez les tableurs par un suivi echantillons et stocks structure.",
        "Activez des rapports conformes avec un cloud valide.",
      ],
      cta: "En savoir plus",
      cardTitle: "Apercu etude",
      cardTag: "Valide",
    },
    ai: {
      badge: "IA pour chaque scientifique",
      title: "IA pour chaque scientifique. Des avancees pour tous.",
      description:
        "Planifiez, enregistrez et partagez les experiences dans un notebook cloud.",
      points: [
        "Reduisez le travail manuel avec des workflows automatises.",
        "Detectez les lacunes de protocoles avant la revue QA.",
        "Utilisez l'IA pour accelerer planification et analyse.",
      ],
      cta: "Explorer les workflows IA",
      cardLabel: "Verification notebook",
      cardTitle: "AI checks",
      cardDescription:
        "Sylvy signale les metadonnees manquantes avant soumission.",
    },
    highlights: [
      {
        title: "Workflows automatises",
        description: "Declenchez approvals et capture de donnees.",
      },
      {
        title: "Conformite prete",
        description: "Signatures electroniques, audit trails, cloud valide.",
      },
      {
        title: "Insights IA",
        description: "Tendances et suggestions en quelques secondes.",
      },
    ],
    resources: {
      badge: "Ressources",
      reportTitle: "Rapport Biopharma AI 2026",
      reportDescription:
        "120 labos partagent l'usage de l'IA en decouverte et developpement.",
      reportCta: "Telecharger le rapport",
      reportNote: "Benchmarks pour equipes ELN, LIMS et QA.",
      stats: [
        {
          value: "63%",
          label:
            "de reduction du temps passe a capturer, chercher et collecter",
        },
        {
          value: "10x",
          label: "d'augmentation du throughput sur les echanges reglementes",
        },
        {
          value: "2.4x",
          label: "de cycles de decision plus rapides en revue transverse",
        },
      ],
    },
    platform: {
      badge: "Plateforme",
      title: "Modules concus pour les labos reglementes",
      description:
        "De la decouverte au GMP, Sylvy s'adapte a vos process.",
      cta: "Voir la plateforme",
      items: [
        {
          title: "Electronic lab notebook",
          description: "Standardisez les experiences avec des templates guides.",
        },
        {
          title: "LIMS et suivi echantillons",
          description: "Suivez echantillons, contenants et emplacements.",
        },
        {
          title: "Analytics et insights",
          description: "Suivez les KPIs et resultats en temps reel.",
        },
        {
          title: "Cloud valide",
          description: "Infrastructure GxP avec controles et audits.",
        },
        {
          title: "Workflow automation",
          description: "Approuvals, QA checks et notifications automatiques.",
        },
        {
          title: "Gestion des stocks",
          description: "Controlez reagents, fournitures et fournisseurs.",
        },
      ],
    },
    cta: {
      title: "Pret a moderniser votre labo ?",
      description:
        "Voyez comment Sylvy unifie ELN, LIMS et analytics pour des decisions rapides.",
      primary: "Try it !",
      secondary: "Sign up",
    },
    footer: {
      addressTitle: "Sylvy",
      address: "22 Rue de la Paix, 75002 Paris, France",
      buttons: {
        contact: "Contactez-nous",
        support: "Support",
      },
      social: ["LinkedIn", "X"],
      columns: [
        {
          title: "Produits",
          links: [
            "ELN",
            "LIMS",
            "Stock",
            "Analytics",
            "Cloud valide",
            "Plateforme developpeur",
          ],
        },
        {
          title: "Solutions",
          links: [
            "Biopharma",
            "Cell therapy",
            "Gene therapy",
            "RNA therapeutics",
            "Antibodies",
          ],
        },
        {
          title: "Ressources",
          links: [
            "Nouveautes",
            "Blog",
            "Bibliotheque",
            "Webinars",
            "Help center",
            "Communaute",
          ],
        },
        {
          title: "Entreprise",
          links: [
            "A propos",
            "Carriere",
            "Trust",
            "Actualites",
            "Partenaires",
            "Contact",
          ],
        },
      ],
      legal: "Copyright 2025 Sylvy. Tous droits reserves.",
    },
    modal: {
      title: "Try it !",
      description: "Parlez-nous de votre labo, nous vous recontacterons.",
      firstName: "Prenom",
      lastName: "Nom",
      email: "Email pro",
      phone: "Telephone",
      submit: "Try it !",
      cancel: "Annuler",
      success: "Merci. Nous vous recontactons.",
      error: "Une erreur est survenue.",
    },
  },
} as const;

type FormStatus = "idle" | "loading" | "success" | "error";
type ThemeName = "green" | "purple" | "orange";

const themeOptions: { id: ThemeName; label: string; swatch: string }[] = [
  { id: "green", label: "Deep green", swatch: "#00AC73" },
  { id: "orange", label: "Deep orange", swatch: "#D65400" },
  { id: "purple", label: "Deep purple", swatch: "#C074FF" },
];

const SCROLL_THRESHOLD = 60;
const WORKFLOW_AUTO_SCROLL_INTERVAL = 6500;
const WORKFLOW_AUTO_SCROLL_RESUME_DELAY = 4000;

const PLANNER_CHAT_ITEMS = [
  { text: "ELISA assay on HEK", highlightColor: "bg-emerald-500/30" },
  { text: "Western blot PLP1", highlightColor: "bg-emerald-500/30" },
  { text: "Team meeting review", highlightColor: "bg-violet-500/30" },
  { text: "Protocol review PI", highlightColor: "bg-violet-500/30" },
  { text: "Reagent inventory check", highlightColor: "bg-neutral-400/30" },
  { text: "Results data analysis", highlightColor: "bg-orange-500/30" },
];

const PLANNER_CALENDAR_DATA = [
  {
    day: "Mon",
    tasks: [
      { title: "ELISA", sub: "Plate coating", hour: 8, duration: 2, color: "bg-emerald-500/20 text-emerald-300", group: 0 },
      { title: "Meeting", sub: "Team sync", hour: 11, duration: 1, color: "bg-violet-500/20 text-violet-300", group: 2 },
    ],
  },
  {
    day: "Tue",
    tasks: [
      { title: "Western blot", sub: "Sample lysis", hour: 8, duration: 1.5, color: "bg-emerald-500/20 text-emerald-300", group: 1 },
      { title: "Data", sub: "Results analysis", hour: 11, duration: 2, color: "bg-orange-500/20 text-orange-300", group: 5 },
      { title: "ELISA", sub: "Blocking step", hour: 14.5, duration: 1.5, color: "bg-emerald-500/20 text-emerald-300", group: 0 },
    ],
  },
  {
    day: "Wed",
    tasks: [
      { title: "Admin", sub: "Reagent check", hour: 8.5, duration: 1, color: "bg-neutral-500/20 text-neutral-400", group: 4 },
      { title: "ELISA", sub: "Incubation", hour: 10.5, duration: 2, color: "bg-emerald-500/20 text-emerald-300", group: 0 },
      { title: "Meeting", sub: "Protocol review", hour: 14, duration: 1.5, color: "bg-violet-500/20 text-violet-300", group: 3 },
    ],
  },
  {
    day: "Thu",
    tasks: [
      { title: "Western blot", sub: "Gel loading", hour: 8, duration: 1.5, color: "bg-emerald-500/20 text-emerald-300", group: 1 },
      { title: "Data", sub: "Figures prep", hour: 11, duration: 1.5, color: "bg-orange-500/20 text-orange-300", group: 5 },
      { title: "Western blot", sub: "Migration", hour: 14, duration: 2, color: "bg-emerald-500/20 text-emerald-300", group: 1 },
    ],
  },
  {
    day: "Fri",
    tasks: [
      { title: "ELISA", sub: "Readout", hour: 9, duration: 1.5, color: "bg-emerald-500/20 text-emerald-300", group: 0 },
    ],
  },
];

function formatHour(h: number) {
  const hours = Math.floor(h);
  const minutes = Math.round((h - hours) * 60);
  const period = hours >= 12 ? "PM" : "AM";
  const h12 = hours === 0 ? 12 : hours > 12 ? hours - 12 : hours;
  return minutes > 0 ? `${h12}:${minutes.toString().padStart(2, "0")} ${period}` : `${h12} ${period}`;
}

export default function Home() {
  const [isCompact, setIsCompact] = useState(false);
  const [theme, setTheme] = useState<ThemeName>("green");
  const [isNotebookExpanded, setIsNotebookExpanded] = useState(false);
  const [isPlannerExpanded, setIsPlannerExpanded] = useState(false);
  const [isLabmindExpanded, setIsLabmindExpanded] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formStatus, setFormStatus] = useState<FormStatus>("idle");
  const [formState, setFormState] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
  });

  const [typewriterText, setTypewriterText] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);
  const typewriterFullText = "Sylvy handles the rest";

  useEffect(() => {
    let timeout: ReturnType<typeof setTimeout>;
    if (!isDeleting) {
      if (typewriterText.length < typewriterFullText.length) {
        timeout = setTimeout(() => {
          setTypewriterText(typewriterFullText.slice(0, typewriterText.length + 1));
        }, 60);
      } else {
        timeout = setTimeout(() => setIsDeleting(true), 2000);
      }
    } else {
      if (typewriterText.length > 0) {
        timeout = setTimeout(() => {
          setTypewriterText(typewriterFullText.slice(0, typewriterText.length - 1));
        }, 35);
      } else {
        timeout = setTimeout(() => setIsDeleting(false), 800);
      }
    }
    return () => clearTimeout(timeout);
  }, [typewriterText, isDeleting]);

  const t = copy.en;
  const notebookFeatures = [
    "Capture handwritten notes",
    "Voice dictation",
    "Parameter detection",
    "Protocol writing",
    "Smart tab acquisition",
    "Searchable memory",
  ];
  const workflowSteps = [
    {
      step: "Step 1",
      duration: "45 sec",
      title: "Label tubes and scan sample IDs",
      detail:
        "Record identifiers and verify barcode matches the run sheet before any prep.",
    },
    {
      step: "Step 2",
      duration: "3 min",
      title: "Prepare buffer and verify pH range",
      detail:
        "Mix reagents thoroughly and confirm pH is within the validated range.",
    },
    {
      step: "Step 3",
      duration: "1 min",
      title: "Pipette aliquots into the plate",
      detail:
        "Dispense uniform volumes into each well to ensure consistent readouts.",
    },
    {
      step: "Step 4",
      duration: "7 min",
      title: "Vortex mix and quick-spin down",
      detail: "Homogenize samples and remove bubbles before incubation begins.",
    },
    {
      step: "Step 5",
      duration: "12 min",
      title: "Incubate at 37°C with gentle agitation",
      detail:
        "Maintain steady temperature and movement to optimize binding kinetics.",
    },
    {
      step: "Step 7",
      duration: "5 min",
      title: "Add detection reagent and protect plates from light",
      detail: "Dispense reagent evenly and keep plates shielded until readout.",
    },
    {
      step: "Step 8",
      duration: "90 sec",
      title: "Capture readout and auto-log results",
      detail: "Record signal intensity and sync the run to your lab notebook.",
    },
  ];
  const [plannerAnimStep, setPlannerAnimStep] = useState(-1);
  const plannerSectionRef = useRef<HTMLElement | null>(null);
  const plannerAnimStarted = useRef(false);
  const plannerIntervalRef = useRef<number | null>(null);

  const workflowContainerRef = useRef<HTMLDivElement | null>(null);
  const workflowIndexRef = useRef(0);
  const workflowIntervalRef = useRef<number | null>(null);
  const workflowResumeTimeoutRef = useRef<number | null>(null);
  const lastScrollY = useRef(0);
  const isCompactRef = useRef(false);
  const ticking = useRef(false);
  const softwareLogos = [
    { src: snapgeneLogo, alt: "SnapGene", scale: 1.5 },
    { src: benchlingLogo, alt: "Benchling", scale: 1 },
    { src: excelLogo, alt: "Excel", scale: 1 },
    { src: notionLogo, alt: "Notion", scale: 1 },
    { src: chatgptLogo, alt: "ChatGPT", scale: 2 },
    { src: claudeLogo, alt: "Claude", scale: 1 },
    { src: labarchivesLogo, alt: "LabArchives", scale: 3 },
    { src: starlimsLogo, alt: "StarLIMS", scale: 1 },
    { src: imagejLogo, alt: "ImageJ", scale: 1 },
    { src: matlabLogo, alt: "Matlab", scale: 1 },
    { src: rstudioLogo, alt: "RStudio", scale: 1 },
    { src: pythonLogo, alt: "Python", scale: 1 },
    { src: chemdrawLogo, alt: "ChemDraw", scale: 1 },
    { src: sylvyClockImage, alt: "Sylvy Planner", scale: 1.5 },
    { src: sylvyNoteImage, alt: "Sylvy Note", scale: 1.5 },
  ];




  useEffect(() => {
    const container = workflowContainerRef.current;
    if (!container) return;

    const steps = Array.from(
      container.querySelectorAll<HTMLElement>("[data-workflow-step]"),
    );
    if (steps.length === 0) return;

    const scrollToIndex = (index: number) => {
      const step = steps[index];
      if (!step) return;
      const target =
        step.offsetTop - (container.clientHeight - step.clientHeight) / 2;
      container.scrollTo({ top: target, behavior: "smooth" });
    };

    const stopAutoScroll = () => {
      if (workflowIntervalRef.current !== null) {
        window.clearInterval(workflowIntervalRef.current);
        workflowIntervalRef.current = null;
      }
    };

    const startAutoScroll = () => {
      stopAutoScroll();
      workflowIntervalRef.current = window.setInterval(() => {
        const nextIndex = (workflowIndexRef.current + 1) % steps.length;
        workflowIndexRef.current = nextIndex;
        scrollToIndex(nextIndex);
      }, WORKFLOW_AUTO_SCROLL_INTERVAL);
    };

    const handleUserInput = () => {
      stopAutoScroll();
      if (workflowResumeTimeoutRef.current !== null) {
        window.clearTimeout(workflowResumeTimeoutRef.current);
      }
      workflowResumeTimeoutRef.current = window.setTimeout(() => {
        startAutoScroll();
      }, WORKFLOW_AUTO_SCROLL_RESUME_DELAY);
    };

    container.addEventListener("touchstart", handleUserInput, { passive: true });
    container.addEventListener("pointerdown", handleUserInput);

    // Start auto-scroll immediately
    startAutoScroll();

    return () => {
      stopAutoScroll();
      if (workflowResumeTimeoutRef.current !== null) {
        window.clearTimeout(workflowResumeTimeoutRef.current);
        workflowResumeTimeoutRef.current = null;
      }
      container.removeEventListener("touchstart", handleUserInput);
      container.removeEventListener("pointerdown", handleUserInput);
    };
  }, [workflowSteps.length]);


  // Planner animation: triggered when section enters viewport
  useEffect(() => {
    const section = plannerSectionRef.current;
    if (!section) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !plannerAnimStarted.current) {
          plannerAnimStarted.current = true;
          let halfStep = 0;
          const totalHalfSteps = PLANNER_CHAT_ITEMS.length * 2;
          const run = () => {
            setPlannerAnimStep(halfStep);
            halfStep++;
            if (halfStep < totalHalfSteps) {
              plannerIntervalRef.current = window.setTimeout(run, 800);
            } else {
              // Pause 2s then restart
              plannerIntervalRef.current = window.setTimeout(() => {
                halfStep = 0;
                setPlannerAnimStep(-1);
                plannerIntervalRef.current = window.setTimeout(run, 600);
              }, 2000);
            }
          };
          plannerIntervalRef.current = window.setTimeout(run, 800);
        }
      },
      { threshold: 0.05 },
    );

    observer.observe(section);
    return () => {
      observer.disconnect();
      if (plannerIntervalRef.current !== null) {
        window.clearTimeout(plannerIntervalRef.current);
      }
    };
  }, []);

  // Derived: which chat item is highlighted and which groups are visible
  const plannerHighlightIndex = Math.floor(plannerAnimStep / 2);
  const plannerVisibleGroups = new Set<number>();
  for (let i = 0; i <= Math.floor((plannerAnimStep - 1) / 2); i++) {
    plannerVisibleGroups.add(i);
  }

  useEffect(() => {
    lastScrollY.current = window.scrollY;
    const handleScroll = () => {
      if (ticking.current) {
        return;
      }
      ticking.current = true;
      window.requestAnimationFrame(() => {
        const currentY = window.scrollY;
        const scrollingDown = currentY > lastScrollY.current;
        let nextCompact = isCompactRef.current;

        if (scrollingDown && currentY > SCROLL_THRESHOLD) {
          nextCompact = true;
        } else if (!scrollingDown && currentY < SCROLL_THRESHOLD) {
          nextCompact = false;
        }

        if (nextCompact !== isCompactRef.current) {
          isCompactRef.current = nextCompact;
          setIsCompact(nextCompact);
        }

        lastScrollY.current = currentY;
        ticking.current = false;
      });
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = event.target;
    setFormState((prev) => ({ ...prev, [name]: value }));
  };

  const openModal = () => {
    setIsModalOpen(true);
    setFormStatus("idle");
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setFormStatus("idle");
  };

  /* ── Inactivity popup: show "Try it" modal after 10 s of no interaction ── */
  const inactivityShown = useRef(false);
  useEffect(() => {
    if (inactivityShown.current) return;

    let timer: ReturnType<typeof setTimeout>;

    const reset = () => {
      clearTimeout(timer);
      timer = setTimeout(() => {
        if (!inactivityShown.current) {
          inactivityShown.current = true;
          setIsModalOpen(true);
          setFormStatus("idle");
        }
      }, 10_000);
    };

    const events = ["mousemove", "mousedown", "keydown", "scroll", "touchstart"] as const;
    events.forEach((e) => window.addEventListener(e, reset));
    reset(); // start the timer immediately

    return () => {
      clearTimeout(timer);
      events.forEach((e) => window.removeEventListener(e, reset));
    };
  }, []);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setFormStatus("loading");

    try {
      const response = await fetch("/api/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          firstName: formState.firstName.trim(),
          lastName: formState.lastName.trim(),
          email: formState.email.trim(),
          phone: formState.phone.trim(),
        }),
      });

      if (!response.ok) {
        throw new Error("Submit failed");
      }

      setFormStatus("success");
      setFormState({ firstName: "", lastName: "", email: "", phone: "" });
      setTimeout(() => {
        window.location.href = "/signup";
      }, 1500);
    } catch {
      setFormStatus("error");
    }
  };

  const themeToggleBase =
    "h-8 w-8 rounded-full border transition hover:scale-105 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2";
  const themeToggleTone = isCompact
    ? "border-black/10 ring-black/25 ring-offset-white/80"
    : "border-white/40 ring-white/70 ring-offset-transparent";

  return (
    <div
      className="relative min-h-screen overflow-hidden bg-background text-foreground"
      data-theme={theme}
    >
      <header
        className={`fixed left-0 right-0 z-[9999] transition-all duration-300 ease-out ${
          isCompact ? "top-3" : "top-0"
        }`}
      >
        <div
          className={`transition-all duration-300 ease-out ${
            isCompact
              ? "mx-auto w-[min(100%-2rem,64rem)] rounded-full bg-white/70 shadow-lg backdrop-blur-md"
              : "mx-auto w-[min(100%-2rem,70rem)]"
          }`}
        >
          <div
            className={`flex w-full items-center gap-4 transition-all duration-300 ease-out ${
              isCompact ? "px-6 py-3" : "px-6 py-5"
            }`}
          >
            <button
              type="button"
              onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
              className="flex flex-1 items-center gap-3"
            >
              <Image
                src={isCompact ? logo : logoWhite}
                alt="Sylvy logo"
                width={26}
                height={26}
                className="h-6 w-6 object-contain"
                priority
              />
              <span
                className={`text-sm font-semibold tracking-[0.2em] transition-colors duration-300 ${
                  isCompact
                    ? "text-[color:var(--theme-logo-text-compact)]"
                    : "text-[color:var(--theme-hero-text)]"
                }`}
              >
                Sylvy
              </span>
            </button>
            {!isCompact && (
              <div className="flex items-center gap-2">
                {themeOptions.map((option) => {
                  const isActive = theme === option.id;
                  return (
                    <button
                      key={option.id}
                      type="button"
                      aria-label={`Switch to ${option.label} theme`}
                      aria-pressed={isActive}
                      title={option.label}
                      onClick={() => setTheme(option.id)}
                      className={`${themeToggleBase} ${themeToggleTone} ${
                        isActive
                          ? "ring-2 opacity-100"
                          : "opacity-70 hover:opacity-100"
                      }`}
                      style={{ backgroundColor: option.swatch }}
                    />
                  );
                })}
              </div>
            )}
            <div className="flex flex-1 items-center justify-end gap-3">
              <a
                href="/login"
                className={`text-sm font-medium transition-colors ${
                  isCompact
                    ? "text-neutral-600 hover:text-neutral-900"
                    : "text-white/80 hover:text-white"
                }`}
              >
                Sign in
              </a>
              <Button
                size="sm"
                className={`rounded-full px-5 transition-all duration-300 ${
                  isCompact
                    ? "bg-[var(--theme-button-compact-bg)] text-[color:var(--theme-button-compact-text)] hover:bg-[var(--theme-button-compact-hover)]"
                    : "bg-[var(--theme-button-expanded-bg)] text-[color:var(--theme-button-expanded-text)] hover:bg-[var(--theme-button-expanded-hover)]"
                }`}
                onClick={openModal}
              >
                {t.hero.primaryCta}
              </Button>
            </div>
          </div>
        </div>
      </header>
      <section
        className="snap-section relative isolate overflow-x-clip text-[color:var(--theme-hero-text)]"
        style={{ background: "var(--theme-hero-bg)" }}
      >
        {/* Blobs décoratifs */}
        <div className="pointer-events-none absolute inset-0 z-0">
          <div className="hero-intro-blob hero-intro-blob--one" />
          <div className="hero-intro-blob hero-intro-blob--two" />
          <div className="hero-intro-blob hero-intro-blob--three" />
          <div className="hero-intro-blob hero-intro-blob--four" />
        </div>
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_12%_20%,var(--theme-hero-glow-one),transparent_45%)]" />
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_80%_15%,var(--theme-hero-glow-two),transparent_40%)]" />
        {/* Intro — premier écran */}
        <div className="relative z-10 flex min-h-screen flex-col items-center justify-center px-6 text-center">
          <div>
            <p className="text-3xl font-semibold tracking-[0.05em] text-[color:var(--theme-hero-text)] sm:text-5xl md:text-7xl lg:text-7xl">
              Focus on Research
            </p>
            <p className="mt-4 h-[1.5em] text-base font-medium text-[color:var(--theme-hero-text-muted)] sm:text-2xl md:text-3xl lg:text-4xl">
              {typewriterText}
              <span className="typewriter-cursor" />
            </p>
          </div>
          <button
            type="button"
            onClick={() => document.getElementById("solutions")?.scrollIntoView({ behavior: "smooth" })}
            className="absolute bottom-20 flex flex-col items-center gap-2 text-[color:var(--theme-hero-text)] opacity-70 transition-opacity hover:opacity-100"
          >
            <span className="text-sm font-medium tracking-widest uppercase">Discover</span>
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
        {/* Solution narrative — deuxième écran (hyperspace starburst) */}
        <div id="solutions" className="relative z-10">
          <HyperspaceHero />
        </div>
      </section>

      <main className="relative">
        <section id="notebook" className="snap-section relative bg-white">
          <div className="flex items-center justify-center px-4 pb-8 pt-12 sm:px-6 sm:pt-16">
            <div
              className="flex flex-wrap items-center justify-center gap-2 font-semibold leading-none tracking-tight text-black sm:gap-4"
              style={{ fontSize: "clamp(1.5rem, 7vw, 6rem)" }}
            >
              <span>Sylvy</span>
              <Image
                src={sylvyNoteImage}
                alt="Sylvy note"
                width={120}
                height={120}
                className="w-auto object-contain"
                style={{ height: "1.3em" }}
              />
              <span>notebook</span>
            </div>
          </div>
          <div className="mx-auto w-full max-w-5xl px-4 pb-8 sm:px-6">
            <NotebookMorphDrag
              beforeSrc={notebookAfter}
              afterSrc={notebookBefore}
              beforeAlt="Carnet numérique Sylvy"
              afterAlt="Notes manuscrites"
              initial={0.5}
              aspectRatio="3/2"
            />
          </div>
          <div className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6">
            <div
              className="overflow-hidden transition-all duration-500 ease-in-out"
              style={{ maxHeight: isNotebookExpanded ? "60rem" : "0" }}
            >
              <div className="w-full pb-4">
                <h2 className="text-balance text-2xl font-medium leading-tight text-primary sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl">
                  Capture everything, structure it instantly.
                </h2>
                <ul className="mt-8 space-y-4 text-base text-neutral-600 sm:text-lg">
                  <li className="flex items-start gap-3">
                    <span className="mt-1.5 block h-2 w-2 shrink-0 rounded-full bg-primary" />
                    <span>Snap a photo of your handwritten notes &mdash; Sylvy transcribes and structures them automatically</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="mt-1.5 block h-2 w-2 shrink-0 rounded-full bg-primary" />
                    <span>Voice dictation: describe your experiment out loud at the bench, Sylvy converts speech into structured protocols and observations in real time</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="mt-1.5 block h-2 w-2 shrink-0 rounded-full bg-primary" />
                    <span>Auto-detection of experimental parameters: reagents, concentrations, temperatures, durations</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="mt-1.5 block h-2 w-2 shrink-0 rounded-full bg-primary" />
                    <span>Clean, structured protocols generated from free-form input &mdash; no reformatting needed</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="mt-1.5 block h-2 w-2 shrink-0 rounded-full bg-primary" />
                    <span>Version history and full traceability for every experiment entry</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="mt-1.5 block h-2 w-2 shrink-0 rounded-full bg-primary" />
                    <span>Collaborative cloud workspace &mdash; share protocols and results with your team in real time</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="mt-1.5 block h-2 w-2 shrink-0 rounded-full bg-primary" />
                    <span>All entries feed into your lab&apos;s AI brain for intelligent search and insights</span>
                  </li>
                </ul>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setIsNotebookExpanded((prev) => !prev)}
              className="mt-6 flex items-center gap-2 text-lg md:text-xl lg:text-2xl font-semibold text-primary transition-colors hover:text-primary/80"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 20 20"
                fill="currentColor"
                className={`h-5 w-5 md:h-6 md:w-6 lg:h-7 lg:w-7 transition-transform duration-300 ${isNotebookExpanded ? "rotate-180" : ""}`}
              >
                <path fillRule="evenodd" d="M5.22 8.22a.75.75 0 0 1 1.06 0L10 11.94l3.72-3.72a.75.75 0 1 1 1.06 1.06l-4.25 4.25a.75.75 0 0 1-1.06 0L5.22 9.28a.75.75 0 0 1 0-1.06Z" clipRule="evenodd" />
              </svg>
              {isNotebookExpanded ? "Show less" : "Show more"}
            </button>
            <div className="mt-6 flex justify-center">
              <a
                href="/survey"
                className="inline-flex h-[5.2rem] w-[80vw] max-w-3xl items-center justify-center rounded-xl border-2 bg-transparent text-lg font-semibold transition-all focus-visible:ring-[3px] outline-none survey-cta-button"
              >
                Get a 3-month Sylvy for free
              </a>
            </div>
          </div>
        </section>

        <section
          id="planner"
          ref={plannerSectionRef}
          className="snap-section relative bg-black text-white"
        >
          <div className="flex items-center justify-center px-4 pb-8 pt-12 sm:px-6 sm:pt-16">
            <div
              className="flex flex-wrap items-center justify-center gap-2 font-semibold leading-none tracking-tight text-white sm:gap-4"
              style={{ fontSize: "clamp(1.5rem, 7vw, 6rem)" }}
            >
              <span>Sylvy</span>
              <Image
                src={sylvyClockImage}
                alt="Sylvy clock"
                width={120}
                height={120}
                className="w-auto object-contain"
                style={{ height: "1.3em" }}
              />
              <span>planner</span>
            </div>
          </div>
          <div className="mx-auto flex w-full max-w-7xl gap-6 px-4 pb-8 pt-4 sm:px-6">
            <div className="flex w-96 shrink-0 flex-col justify-between rounded-2xl bg-white p-5">
              <div className="flex-1 overflow-y-auto">
                <div className="ml-auto rounded-2xl rounded-tr-sm bg-neutral-100 px-4 py-4">
                  <p className="mb-2 text-xs font-medium text-neutral-800">Here&apos;s what I need to do this week:</p>
                  <ul className="space-y-1.5 text-xs leading-relaxed text-neutral-700">
                    {PLANNER_CHAT_ITEMS.map((item, idx) => {
                      const isHighlighted = plannerHighlightIndex === idx && plannerAnimStep % 2 === 0;
                      const isPast = idx < plannerHighlightIndex || (idx === plannerHighlightIndex && plannerAnimStep % 2 === 1);
                      return (
                        <li
                          key={item.text}
                          className={`rounded-md px-1.5 py-0.5 transition-all duration-500 ${
                            isHighlighted
                              ? `${item.highlightColor} font-semibold`
                              : isPast
                                ? "opacity-60"
                                : plannerAnimStep < 0
                                  ? ""
                                  : "opacity-40"
                          }`}
                        >
                          · {item.text}
                        </li>
                      );
                    })}
                  </ul>
                </div>
              </div>
              <div className="mt-4 flex items-center gap-2 rounded-xl border border-neutral-200 bg-neutral-50 px-3 py-2">
                <p className="flex-1 text-xs text-neutral-400">Ask Sylvy planner...</p>
                <div className="flex h-5 w-5 items-center justify-center rounded-full bg-neutral-200">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-3 w-3 text-neutral-500">
                    <path d="M3.105 2.288a.75.75 0 0 0-.826.95l1.414 4.926A1.5 1.5 0 0 0 5.135 9.25h6.115a.75.75 0 0 1 0 1.5H5.135a1.5 1.5 0 0 0-1.442 1.086l-1.414 4.926a.75.75 0 0 0 .826.95 28.897 28.897 0 0 0 15.293-7.155.75.75 0 0 0 0-1.114A28.897 28.897 0 0 0 3.105 2.288Z" />
                  </svg>
                </div>
              </div>
            </div>
            <div className="ml-auto grid w-full max-w-3xl grid-cols-5 gap-px overflow-hidden rounded-2xl border-[3px] border-neutral-500">
              {PLANNER_CALENDAR_DATA.map((col, i) => (
                <div
                  key={col.day}
                  className={`relative min-h-[55vh] p-3 pt-10 ${i < 4 ? "border-r-[3px] border-neutral-500" : ""}`}
                >
                  <p className="absolute left-3 top-3 text-base font-bold uppercase tracking-widest text-neutral-400">
                    {col.day}
                  </p>
                  {col.tasks.map((task) => {
                    const isVisible = plannerVisibleGroups.has(task.group);
                    return (
                      <div
                        key={`${task.title}-${task.hour}`}
                        className={`absolute left-2 right-2 overflow-hidden rounded-lg px-2 py-1.5 transition-all duration-500 ${
                          isVisible ? task.color : "opacity-0"
                        }`}
                        style={{
                          top: `calc(3rem + ${((task.hour - 8) / 11) * (100 - 10)}%)`,
                          height: `${(task.duration / 11) * (100 - 7)}%`,
                        }}
                      >
                        <div className="flex items-start justify-between gap-1">
                          <div>
                            <p className="text-[10px] font-semibold leading-tight">{task.title}</p>
                            <p className="text-[8px] opacity-60">{task.sub}</p>
                          </div>
                          <p className="shrink-0 text-[7px] opacity-40">{formatHour(task.hour)}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
          </div>
          <div className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6">
            <div
              className="overflow-hidden transition-all duration-500 ease-in-out"
              style={{ maxHeight: isPlannerExpanded ? "60rem" : "0" }}
            >
              <div className="w-full pb-4">
                <h2 className="text-balance text-2xl font-medium leading-tight text-white sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl">
                  Your AI lab scheduler that thinks ahead.
                </h2>
                <ul className="mt-8 space-y-4 text-base text-white/70 sm:text-lg">
                  <li className="flex items-start gap-3">
                    <span className="mt-1.5 block h-2 w-2 shrink-0 rounded-full bg-primary" />
                    <span>Describe your experiments in natural language and get an optimized weekly schedule</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="mt-1.5 block h-2 w-2 shrink-0 rounded-full bg-primary" />
                    <span>Automatic dependency management between multi-step protocols (incubation, centrifugation, waiting times)</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="mt-1.5 block h-2 w-2 shrink-0 rounded-full bg-primary" />
                    <span>Smart conflict detection: shared equipment, reagent availability, and time overlaps</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="mt-1.5 block h-2 w-2 shrink-0 rounded-full bg-primary" />
                    <span>Real-time rescheduling when experiments run late or priorities change</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="mt-1.5 block h-2 w-2 shrink-0 rounded-full bg-primary" />
                    <span>Team-wide visibility: see who is doing what and when across the lab</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="mt-1.5 block h-2 w-2 shrink-0 rounded-full bg-primary" />
                    <span>Integrates with your notebook &mdash; completed experiments auto-sync to your records</span>
                  </li>
                </ul>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setIsPlannerExpanded((prev) => !prev)}
              className="mt-6 flex items-center gap-2 text-lg md:text-xl lg:text-2xl font-semibold text-white/70 transition-colors hover:text-white"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 20 20"
                fill="currentColor"
                className={`h-5 w-5 md:h-6 md:w-6 lg:h-7 lg:w-7 transition-transform duration-300 ${isPlannerExpanded ? "rotate-180" : ""}`}
              >
                <path fillRule="evenodd" d="M5.22 8.22a.75.75 0 0 1 1.06 0L10 11.94l3.72-3.72a.75.75 0 1 1 1.06 1.06l-4.25 4.25a.75.75 0 0 1-1.06 0L5.22 9.28a.75.75 0 0 1 0-1.06Z" clipRule="evenodd" />
              </svg>
              {isPlannerExpanded ? "Show less" : "Show more"}
            </button>
            <div className="mt-6 flex justify-center">
              <a
                href="/survey"
                className="inline-flex h-[5.2rem] w-[80vw] max-w-3xl items-center justify-center rounded-xl border-2 bg-transparent text-lg font-semibold transition-all focus-visible:ring-[3px] outline-none survey-cta-button"
              >
                Get a 3-month Sylvy for free
              </a>
            </div>
          </div>
        </section>

        <section
          id="labmind"
          className="snap-section flex flex-col overflow-hidden bg-white"
        >
          <div className="relative z-20 flex items-center justify-center px-4 pb-8 pt-12 sm:px-6 sm:pt-16">
            <div
              className="flex flex-wrap items-center justify-center gap-2 font-semibold leading-none tracking-tight text-black sm:gap-4"
              style={{ fontSize: "clamp(1.5rem, 7vw, 6rem)" }}
            >
              <span>Sylvy</span>
              <Image
                src={sylvyBrainImage}
                alt="Sylvy labmind"
                width={120}
                height={120}
                className="w-auto object-contain"
                style={{ height: "1.3em" }}
              />
              <span>labmind</span>
            </div>
          </div>
          <div className="relative flex items-center justify-center" style={{ height: "clamp(300px, 45vh, 550px)" }}>
            <div className="labmind-orbit">
              {(() => {
                const entries: { logoIdx: number; angleDeg: number }[] = [
                  { logoIdx: 0, angleDeg: 0 },
                  { logoIdx: 1, angleDeg: 24 },
                  { logoIdx: 2, angleDeg: 48 },
                  { logoIdx: 3, angleDeg: 72 },
                  { logoIdx: 4, angleDeg: 96 },
                  { logoIdx: 5, angleDeg: 120 },
                  { logoIdx: 6, angleDeg: 144 },
                  { logoIdx: 7, angleDeg: 168 },
                  { logoIdx: 8, angleDeg: 192 },
                  { logoIdx: 9, angleDeg: 216 },
                  { logoIdx: 10, angleDeg: 240 },
                  { logoIdx: 11, angleDeg: 264 },
                  { logoIdx: 12, angleDeg: 288 },
                  { logoIdx: 13, angleDeg: 312 },
                  { logoIdx: 14, angleDeg: 336 },
                ];
                return entries.map((entry, i) => {
                  const sl = softwareLogos[entry.logoIdx];
                  const rad = (entry.angleDeg * Math.PI) / 180;
                  const rx = 900;
                  const ry = 280;
                  const startX = Math.cos(rad) * rx;
                  const startY = Math.sin(rad) * ry;
                  const radius = Math.sqrt(startX * startX + startY * startY);
                  const realAngle = Math.atan2(startY, startX);
                  const duration = 13 + (i % 3) * 1.5;
                  return (
                    <div
                      key={`${sl.alt}-${i}`}
                      className="labmind-converge"
                      style={{
                        "--angle": `${parseFloat(realAngle.toFixed(6))}rad`,
                        "--radius": `${parseFloat(radius.toFixed(4))}px`,
                        "--delay": `${parseFloat((i * 0.6).toFixed(2))}s`,
                        "--duration": `${duration}s`,
                      } as React.CSSProperties}
                    >
                      <Image
                        src={sl.src}
                        alt={sl.alt}
                        width={Math.round(80 * sl.scale)}
                        height={Math.round(80 * sl.scale)}
                        className="object-contain"
                        style={{ width: `${4.5 * sl.scale}rem`, height: `${4.5 * sl.scale}rem` }}
                      />
                    </div>
                  );
                });
              })()}
              <Image
                src={labBrainImage}
                alt="Lab brain"
                width={400}
                height={400}
                className="labmind-brain relative z-10 w-64 animate-pulse-heart object-contain sm:w-80 md:w-[26rem]"
              />
            </div>
          </div>
          <div className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6">
            <div
              className="overflow-hidden transition-all duration-500 ease-in-out"
              style={{ maxHeight: isLabmindExpanded ? "60rem" : "0" }}
            >
              <div className="w-full pb-4">
                <h2 className="text-balance text-2xl font-medium leading-tight text-primary sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl">
                  Your lab&apos;s private AI brain, trained on your own data.
                </h2>
                <ul className="mt-8 space-y-4 text-base text-neutral-600 sm:text-lg">
                  <li className="flex items-start gap-3">
                    <span className="mt-1.5 block h-2 w-2 shrink-0 rounded-full bg-primary" />
                    <span>Ask questions about past experiments in natural language and get instant, sourced answers</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="mt-1.5 block h-2 w-2 shrink-0 rounded-full bg-primary" />
                    <span>Automatically compare results across experiments: conditions, parameters, and outcomes</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="mt-1.5 block h-2 w-2 shrink-0 rounded-full bg-primary" />
                    <span>Generate new protocols based on what worked before in your lab&apos;s own history</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="mt-1.5 block h-2 w-2 shrink-0 rounded-full bg-primary" />
                    <span>Private AI agent per lab &mdash; your data never leaves your environment</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="mt-1.5 block h-2 w-2 shrink-0 rounded-full bg-primary" />
                    <span>Surfaces patterns and insights across your entire experimental history</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="mt-1.5 block h-2 w-2 shrink-0 rounded-full bg-primary" />
                    <span>Gets smarter with every experiment &mdash; a compounding knowledge base for your lab</span>
                  </li>
                </ul>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setIsLabmindExpanded((prev) => !prev)}
              className="mt-6 flex items-center gap-2 text-lg md:text-xl lg:text-2xl font-semibold text-primary transition-colors hover:text-primary/80"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 20 20"
                fill="currentColor"
                className={`h-5 w-5 md:h-6 md:w-6 lg:h-7 lg:w-7 transition-transform duration-300 ${isLabmindExpanded ? "rotate-180" : ""}`}
              >
                <path fillRule="evenodd" d="M5.22 8.22a.75.75 0 0 1 1.06 0L10 11.94l3.72-3.72a.75.75 0 1 1 1.06 1.06l-4.25 4.25a.75.75 0 0 1-1.06 0L5.22 9.28a.75.75 0 0 1 0-1.06Z" clipRule="evenodd" />
              </svg>
              {isLabmindExpanded ? "Show less" : "Show more"}
            </button>
            <div className="mt-6 flex justify-center">
              <a
                href="/survey"
                className="inline-flex h-[5.2rem] w-[80vw] max-w-3xl items-center justify-center rounded-xl border-2 bg-transparent text-lg font-semibold transition-all focus-visible:ring-[3px] outline-none survey-cta-button"
              >
                Get a 3-month Sylvy for free
              </a>
            </div>
          </div>
        </section>

      </main>

      <footer
        id="company"
        className="border-t border-border/70"
        style={{ background: "var(--theme-footer-bg)" }}
      >
        <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6">
          <div className="flex flex-col gap-5">
            <div className="flex flex-col gap-5 sm:flex-row sm:gap-8">
              <div className="shrink-0">
                <div className="flex items-center gap-3">
                    <Image
                      src={logoWhite}
                      alt="Sylvy logo"
                      width={26}
                      height={26}
                      className="h-6 w-6 object-contain"
                    />
                  <span className="text-lg font-semibold tracking-tight text-white">
                    {t.footer.addressTitle}
                  </span>
                </div>
                <p className="mt-2 text-sm text-muted-foreground">
                  {t.footer.address}
                </p>
                <div className="mt-3 flex flex-wrap gap-3">
                  <a href="https://www.linkedin.com/company/sylvyco/" target="_blank" rel="noopener noreferrer">
                    <Button variant="outline" className="rounded-full px-5">
                      {t.footer.buttons.contact}
                    </Button>
                  </a>
                </div>
                <div className="mt-3 flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
                  {t.footer.social.map((item) => (
                    <span key={item}>{item}</span>
                  ))}
                </div>
              </div>
            </div>
          </div>
          <hr className="my-4 border-border/70 opacity-60" />
          <p className="text-xs text-muted-foreground">{t.footer.legal}</p>
        </div>
      </footer>

      {isModalOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/20 p-4">
          <div className="w-full max-w-md rounded-3xl border border-neutral-200 bg-white p-6 shadow-lg">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-lg font-semibold">{t.modal.title}</h2>
                <p className="mt-1 text-sm text-neutral-500">
                  {t.modal.description}
                </p>
              </div>
              <button
                type="button"
                onClick={closeModal}
                className="text-sm text-neutral-500 hover:text-neutral-900"
              >
                {t.modal.cancel}
              </button>
            </div>

            <form className="mt-5 grid gap-3" onSubmit={handleSubmit}>
              <Input
                name="firstName"
                placeholder={t.modal.firstName}
                value={formState.firstName}
                onChange={handleChange}
                required
              />
              <Input
                name="lastName"
                placeholder={t.modal.lastName}
                value={formState.lastName}
                onChange={handleChange}
                required
              />
              <Input
                name="email"
                type="email"
                placeholder={t.modal.email}
                value={formState.email}
                onChange={handleChange}
                required
              />
              <Input
                name="phone"
                type="tel"
                placeholder={t.modal.phone}
                value={formState.phone}
                onChange={handleChange}
                required
              />
              <Button type="submit" disabled={formStatus === "loading"}>
                {formStatus === "loading" ? "..." : t.modal.submit}
              </Button>
              {formStatus === "success" ? (
                <p className="text-xs text-[color:var(--theme-accent-strong)]">{t.modal.success}</p>
              ) : null}
              {formStatus === "error" ? (
                <p className="text-xs text-red-600">{t.modal.error}</p>
              ) : null}
            </form>
          </div>
        </div>
      ) : null}
    </div>
  );
}