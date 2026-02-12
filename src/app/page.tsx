"use client";

import Image from "next/image";
import {
  useEffect,
  useRef,
  useState,
  type ChangeEvent,
  type FormEvent,
} from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import HeroIntroGreen from "@/components/HeroIntroGreen";
import logo from "../../logo/Logo Noir sans Fond.png";
import abbvieLogo from "../../carrousel/abbvie.webp";
import astraZenecaLogo from "../../carrousel/astrazeneca.webp";
import berkeleyLabsLogo from "../../carrousel/berkeley_labs.webp";
import chimieParisLogo from "../../carrousel/chimie_paris.webp";
import merckLogo from "../../carrousel/merck.webp";
import pasteurLogo from "../../carrousel/pasteur.webp";
import pierreFabreLogo from "../../carrousel/pierre_fabre.png";
import ucBerkeleyLogo from "../../carrousel/uc_berkeley.webp";
import sanofiLogo from "../../carrousel/sanofi.webp";
import servierLogo from "../../carrousel/servier.webp";
import moleculeDiagram from "../../photos_videos/molecule.webp";
import towerImage from "../../public/tower.webp";
import towerOrangeImage from "../../public/tower-orange.webp";
import towerPurpleImage from "../../public/tower-purple.webp";

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
      primaryCta: "Request a demo",
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
      primary: "Request a demo",
      secondary: "Sign up",
    },
    footer: {
      addressTitle: "Sylvy",
      address: "20 rue Torricelli, 75017 Paris, France",
      buttons: {
        contact: "Contact us",
        support: "Support",
      },
      social: ["LinkedIn", "X", "YouTube"],
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
      title: "Request a demo",
      description: "Tell us about your lab and we will reach out.",
      firstName: "First name",
      lastName: "Last name",
      email: "Work email",
      submit: "Request demo",
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
      primaryCta: "Request a demo",
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
      primary: "Request a demo",
      secondary: "Sign up",
    },
    footer: {
      addressTitle: "Sylvy",
      address: "22 Rue de la Paix, 75002 Paris, France",
      buttons: {
        contact: "Contactez-nous",
        support: "Support",
      },
      social: ["LinkedIn", "X", "YouTube"],
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
      title: "Request a demo",
      description: "Parlez-nous de votre labo, nous vous recontacterons.",
      firstName: "Prenom",
      lastName: "Nom",
      email: "Email pro",
      submit: "Request demo",
      cancel: "Annuler",
      success: "Merci. Nous vous recontactons.",
      error: "Une erreur est survenue.",
    },
  },
} as const;

type FormStatus = "idle" | "loading" | "success" | "error";
type ThemeName = "green" | "purple" | "orange";

const themeOptions: { id: ThemeName; label: string; swatch: string }[] = [
  { id: "orange", label: "Deep orange", swatch: "#D65400" },
  { id: "purple", label: "Deep purple", swatch: "#C074FF" },
  { id: "green", label: "Deep green", swatch: "#00AC73" },
];

const SCROLL_THRESHOLD = 60;
const WORKFLOW_AUTO_SCROLL_INTERVAL = 3200;
const WORKFLOW_AUTO_SCROLL_RESUME_DELAY = 3000;

export default function Home() {
  const [phraseIndex, setPhraseIndex] = useState(0);
  const [isCompact, setIsCompact] = useState(false);
  const [theme, setTheme] = useState<ThemeName>("green");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formStatus, setFormStatus] = useState<FormStatus>("idle");
  const [formState, setFormState] = useState({
    firstName: "",
    lastName: "",
    email: "",
  });

  const t = copy.en;
  const rotatingPhrases = t.hero.rotating;
  const logoItems = [
    { src: abbvieLogo, alt: "Abbvie" },
    { src: berkeleyLabsLogo, alt: "Berkeley Labs" },
    { src: chimieParisLogo, alt: "Chimie Paris" },
    { src: merckLogo, alt: "Merck" },
    { src: sanofiLogo, alt: "Sanofi" },
  ];
  const logoItemsAlt = [
    { src: astraZenecaLogo, alt: "AstraZeneca" },
    { src: pasteurLogo, alt: "Pasteur" },
    { src: pierreFabreLogo, alt: "Pierre Fabre" },
    { src: ucBerkeleyLogo, alt: "UC Berkeley" },
    { src: servierLogo, alt: "Servier" },
  ];
  const protocolFrames = [
    {
      label: "Western blot",
      title: "Protocol: Western blot — v3.2",
      lines: [
        "1. Prepare lysis buffer (RIPA + inhibitors).",
        "2. Quantify protein concentration (BCA).",
        "3. Load 20 µg per lane; run SDS-PAGE 120V, 55 min.",
        "Note (Alex): Use fresh DTT for sharper bands.",
      ],
    },
    {
      label: "ELISA assay",
      title: "Protocol: ELISA assay — v2.1",
      lines: [
        "1. Coat plate with capture antibody overnight.",
        "2. Block with 1% BSA for 45 min.",
        "3. Add samples in triplicate; incubate 60 min.",
        "Note (Mina): Use fresh standards for curve accuracy.",
      ],
    },
    {
      label: "RNA extraction",
      title: "Protocol: RNA extraction — v4.0",
      lines: [
        "1. Lyse cells in guanidinium buffer.",
        "2. Bind RNA to column; wash twice.",
        "3. Elute in RNase-free water; keep on ice.",
        "Note (Sam): Warm elution buffer to 60°C.",
      ],
    },
  ];
  const notebookFeatures = [
    "Capture handwritten notes",
    "Parameter detection",
    "Protocol writing",
    "Smart tab acquisition",
    "Sketch generation",
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
  const [protocolIndex, setProtocolIndex] = useState(0);
  const workflowContainerRef = useRef<HTMLDivElement | null>(null);
  const workflowIndexRef = useRef(0);
  const workflowIntervalRef = useRef<number | null>(null);
  const workflowResumeTimeoutRef = useRef<number | null>(null);
  const workflowScrollRafRef = useRef<number | null>(null);
  const lastScrollY = useRef(0);
  const isCompactRef = useRef(false);
  const ticking = useRef(false);
  const towerAsset =
    theme === "orange"
      ? towerOrangeImage
      : theme === "purple"
        ? towerPurpleImage
        : towerImage;

  useEffect(() => {
    const interval = setInterval(() => {
      setPhraseIndex((prev) => (prev + 1) % rotatingPhrases.length);
    }, 2000);
    return () => clearInterval(interval);
  }, [rotatingPhrases.length]);

  useEffect(() => {
    const interval = setInterval(() => {
      setProtocolIndex((prev) => (prev + 1) % protocolFrames.length);
    }, 2600);
    return () => clearInterval(interval);
  }, [protocolFrames.length]);

  useEffect(() => {
    const container = workflowContainerRef.current;
    if (!container) {
      return;
    }

    const steps = Array.from(
      container.querySelectorAll<HTMLElement>("[data-workflow-step]"),
    );
    if (steps.length === 0) {
      return;
    }

    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    let isReducedMotion = mediaQuery.matches;

    const scrollToIndex = (index: number) => {
      const step = steps[index];
      if (!step) {
        return;
      }
      const target =
        step.offsetTop - (container.clientHeight - step.clientHeight) / 2;
      container.scrollTo({
        top: target,
        behavior: isReducedMotion ? "auto" : "smooth",
      });
    };

    const updateActiveIndex = () => {
      const center = container.scrollTop + container.clientHeight / 2;
      let nearestIndex = 0;
      let nearestDistance = Number.POSITIVE_INFINITY;

      steps.forEach((step, index) => {
        const stepCenter = step.offsetTop + step.clientHeight / 2;
        const distance = Math.abs(stepCenter - center);
        if (distance < nearestDistance) {
          nearestDistance = distance;
          nearestIndex = index;
        }
      });

      workflowIndexRef.current = nearestIndex;
    };

    const stopAutoScroll = () => {
      if (workflowIntervalRef.current !== null) {
        window.clearInterval(workflowIntervalRef.current);
        workflowIntervalRef.current = null;
      }
    };

    const scheduleResume = () => {
      if (workflowResumeTimeoutRef.current !== null) {
        window.clearTimeout(workflowResumeTimeoutRef.current);
      }
      workflowResumeTimeoutRef.current = window.setTimeout(() => {
        if (!isReducedMotion) {
          startAutoScroll();
        }
      }, WORKFLOW_AUTO_SCROLL_RESUME_DELAY);
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
      if (isReducedMotion) {
        return;
      }
      stopAutoScroll();
      scheduleResume();
    };

    const handleScroll = () => {
      if (workflowScrollRafRef.current !== null) {
        return;
      }
      workflowScrollRafRef.current = window.requestAnimationFrame(() => {
        workflowScrollRafRef.current = null;
        updateActiveIndex();
      });
    };

    const handleMotionChange = () => {
      isReducedMotion = mediaQuery.matches;
      if (isReducedMotion) {
        stopAutoScroll();
      } else {
        startAutoScroll();
      }
    };

    container.addEventListener("wheel", handleUserInput, { passive: true });
    container.addEventListener("touchstart", handleUserInput, {
      passive: true,
    });
    container.addEventListener("pointerdown", handleUserInput);
    container.addEventListener("scroll", handleScroll, { passive: true });
    mediaQuery.addEventListener("change", handleMotionChange);

    updateActiveIndex();
    scrollToIndex(workflowIndexRef.current);
    if (!isReducedMotion) {
      startAutoScroll();
    }

    return () => {
      stopAutoScroll();
      if (workflowResumeTimeoutRef.current !== null) {
        window.clearTimeout(workflowResumeTimeoutRef.current);
        workflowResumeTimeoutRef.current = null;
      }
      if (workflowScrollRafRef.current !== null) {
        window.cancelAnimationFrame(workflowScrollRafRef.current);
        workflowScrollRafRef.current = null;
      }
      container.removeEventListener("wheel", handleUserInput);
      container.removeEventListener("touchstart", handleUserInput);
      container.removeEventListener("pointerdown", handleUserInput);
      container.removeEventListener("scroll", handleScroll);
      mediaQuery.removeEventListener("change", handleMotionChange);
    };
  }, [workflowSteps.length]);


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
        }),
      });

      if (!response.ok) {
        throw new Error("Submit failed");
      }

      setFormStatus("success");
      setFormState({ firstName: "", lastName: "", email: "" });
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
              className="flex flex-1 cursor-pointer items-center gap-3"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-full border border-[color:var(--theme-logo-border)] bg-white">
                <Image
                  src={logo}
                  alt="Sylvy logo"
                  width={26}
                  height={26}
                  className="h-6 w-6 object-contain"
                  priority
                />
              </div>
              <span
                className={`text-sm font-semibold tracking-[0.2em] uppercase transition-colors duration-300 ${
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
            <div className="flex flex-1 justify-end">
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
      <HeroIntroGreen />
      <section
        className="snap-section relative isolate min-h-screen overflow-hidden text-[color:var(--theme-hero-text)]"
        style={{ background: "var(--theme-hero-bg)" }}
      >
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_12%_20%,var(--theme-hero-glow-one),transparent_45%)]" />
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_80%_15%,var(--theme-hero-glow-two),transparent_40%)]" />
        <div className="relative">
          <section id="solutions" className="relative flex min-h-screen flex-col pt-28">
            <div className="mx-auto max-w-6xl px-6 pb-10 pt-10 lg:ml-0 lg:mr-auto lg:pt-16">
              <div className="relative z-10 max-w-3xl lg:pr-72">
                <div className="mt-6 space-y-3">
                  <div>
                    <p className="whitespace-nowrap text-4xl font-medium text-[color:var(--theme-hero-text-muted)] sm:text-5xl lg:text-6xl">
                      {t.hero.prefixSecondary}
                      <span
                        aria-hidden="true"
                        className="ml-3 inline-block h-[0.85em] w-[0.85em] align-[-0.12em]"
                        style={{
                          backgroundImage: `url(${logo.src})`,
                          backgroundRepeat: "no-repeat",
                          backgroundPosition: "center",
                          backgroundSize: "contain",
                        }}
                      />
                    </p>
                  </div>
                  <div className="min-h-[3.5rem] text-5xl font-semibold leading-tight text-[color:var(--theme-hero-text)] sm:min-h-[4.5rem] sm:text-6xl lg:min-h-[5.5rem] lg:text-7xl xl:text-8xl">
                    <span
                      key={rotatingPhrases[phraseIndex]}
                      className="hero-phrase font-display whitespace-nowrap"
                    >
                      {rotatingPhrases[phraseIndex]}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="relative mt-auto pb-16 pt-6">
              <div className="mx-auto max-w-6xl px-6">
                <p className="text-xs uppercase tracking-[0.35em] text-[color:var(--theme-hero-text-soft)]">
                  {t.logos.title}
                </p>
              </div>
              <div className="relative mt-8">
                {/* NOTE: screen_recording.mp4 not accessible here; carousel behavior follows provided spec. */}
                <div className="logo-marquee hero-carousel">
                  <div className="logo-track">
                    {[...logoItems, ...logoItems].map((logoItem, index) => (
                      <div key={`${logoItem.alt}-${index}`} className="logo-item">
                        <Image
                          src={logoItem.src}
                          alt={logoItem.alt}
                          width={320}
                          height={150}
                          className="h-20 w-auto object-contain opacity-90"
                        />
                      </div>
                    ))}
                  </div>
                  <div className="logo-track logo-track--alt">
                    {[...logoItemsAlt, ...logoItemsAlt].map((logoItem, index) => (
                      <div key={`${logoItem.alt}-alt-${index}`} className="logo-item">
                        <Image
                          src={logoItem.src}
                          alt={logoItem.alt}
                          width={320}
                          height={150}
                          className="h-20 w-auto object-contain opacity-80"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </section>
        </div>
        <Image
          src={towerAsset}
          alt="Tower illustration"
          width={towerAsset.width}
          height={towerAsset.height}
          className="pointer-events-none absolute bottom-0 right-0 z-20 h-[40vh] w-auto translate-x-6 sm:h-[55vh] lg:h-[75vh]"
          priority
        />
      </section>

      <main className="relative">
        <section className="snap-section relative min-h-screen bg-white">
          <div className="mx-auto flex min-h-screen w-full max-w-7xl flex-col items-start gap-16 px-6 py-16 lg:flex-row lg:items-center lg:justify-between lg:gap-24">
            <div className="max-w-[26rem] sm:max-w-[30rem]">
              <h2 className="text-balance text-4xl font-medium leading-tight text-primary sm:text-5xl lg:text-6xl xl:text-7xl">
                Execute your lab workflows in very simple steps !
              </h2>
            </div>
            <div className="relative w-full max-w-[44rem] lg:ml-auto">
              <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:gap-8">
                <div className="protocol-panel w-full lg:w-[28rem]">
                  <div className="protocol-frame-stack">
                    {protocolFrames.map((frame, index) => (
                      <div
                        key={frame.label}
                        className={`protocol-frame ${
                          index === protocolIndex ? "is-active" : ""
                        }`}
                      >
                        <h3 className="protocol-frame-title">{frame.title}</h3>
                        <div className="protocol-frame-lines">
                          {frame.lines.map((line) => (
                            <p key={line}>{line}</p>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="protocol-pills protocol-pills--stack">
                  {protocolFrames.map((frame, index) => (
                    <span
                      key={frame.label}
                      className={`protocol-pill ${
                        index === protocolIndex ? "is-active" : ""
                      }`}
                    >
                      {frame.label}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        <section id="ai" className="snap-section bg-white text-primary">
          <div className="mx-auto flex min-h-screen w-full max-w-6xl flex-col justify-between px-6 py-16">
            <h2 className="mx-auto max-w-3xl text-balance text-center text-3xl font-medium leading-tight sm:text-4xl lg:text-5xl">
              Snap your notebook. Sylvy structures it.
            </h2>
            <div className="grid w-full grid-cols-1 gap-x-12 gap-y-6 sm:grid-cols-2 lg:grid-cols-3 lg:gap-y-10">
              {notebookFeatures.map((feature, index) => (
                <button
                  key={feature}
                  type="button"
                  className="feature-pill"
                  style={{ animationDelay: `${index * 1}s` }}
                >
                  {feature}
                </button>
              ))}
            </div>
          </div>
        </section>

        <section
          id="workflow-steps"
          className="snap-section bg-black text-white"
        >
          <div className="mx-auto flex min-h-screen w-full max-w-5xl flex-col items-center justify-center px-6 py-16">
            <h2 className="text-balance text-center text-3xl font-semibold leading-tight sm:text-4xl lg:text-5xl">
              Snap your notebook. Sylvy structures it.
            </h2>
            <div className="mt-12 w-full max-w-3xl">
              <div ref={workflowContainerRef} className="workflow-steps-track">
                {workflowSteps.map((step) => (
                  <div
                    key={step.title}
                    data-workflow-step
                    className="workflow-step protocol-card protocol-card--wide"
                  >
                    <p className="protocol-title">
                      {step.step} —{" "}
                      <span className="duration">{step.duration}</span> —{" "}
                      {step.title}
                    </p>
                    <p className="protocol-description">{step.detail}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section
          id="resources"
          className="snap-section mx-auto max-w-6xl px-6 py-16"
        >
          <div className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr]">
            <div className="rounded-3xl border border-border/70 bg-card p-8 shadow-sm">
              <Badge
                variant="outline"
                className="mb-4 w-fit rounded-full text-xs uppercase tracking-[0.25em]"
              >
                {t.resources.badge}
              </Badge>
              <h3 className="font-display text-2xl text-primary sm:text-3xl">
                {t.resources.reportTitle}
              </h3>
              <p className="mt-3 text-sm text-muted-foreground">
                {t.resources.reportDescription}
              </p>
              <Button className="mt-6 rounded-full px-6" variant="outline">
                {t.resources.reportCta}
              </Button>
              <div className="mt-6 rounded-2xl border border-border/60 bg-white p-4 text-xs text-muted-foreground">
                {t.resources.reportNote}
              </div>
            </div>
            <div className="grid gap-4">
              {t.resources.stats.map((stat, index) => (
                <Card
                  key={stat.value}
                  className="animate-fade-up rounded-3xl border-border/70 bg-card/80 p-0 shadow-sm"
                  style={{ animationDelay: `${index * 120}ms` }}
                >
                  <div className="space-y-2 p-6">
                    <p className="text-3xl font-semibold text-foreground">
                      {stat.value}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {stat.label}
                    </p>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        </section>

        <section
          id="platform"
          className="snap-section mx-auto max-w-6xl px-6 py-16"
        >
          <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
            <div>
              <Badge
                variant="outline"
                className="mb-4 w-fit rounded-full text-xs uppercase tracking-[0.25em]"
              >
                {t.platform.badge}
              </Badge>
              <h2 className="font-display text-3xl text-primary sm:text-4xl">
                {t.platform.title}
              </h2>
              <p className="mt-3 max-w-xl text-sm text-muted-foreground">
                {t.platform.description}
              </p>
            </div>
            <Button variant="outline" className="rounded-full px-6" asChild>
              <a href="#demo">{t.platform.cta}</a>
            </Button>
          </div>
          <div className="mt-10 flex justify-center">
            <Image
              src={moleculeDiagram}
              alt="Sylvy platform modules diagram"
              className="h-auto w-full max-w-4xl object-contain"
              priority
            />
          </div>
        </section>

        <section id="demo" className="snap-section mx-auto max-w-6xl px-6 pb-20">
          <Card className="rounded-3xl border-border/70 bg-card/90 p-0 shadow-sm">
            <div className="flex flex-col gap-6 p-8 md:flex-row md:items-center md:justify-between">
              <div>
                <h2 className="font-display text-3xl text-primary sm:text-4xl">
                  {t.cta.title}
                </h2>
                <p className="mt-3 text-sm text-muted-foreground">
                  {t.cta.description}
                </p>
              </div>
              <div className="flex flex-wrap gap-3">
                <Button className="rounded-full px-7" onClick={openModal}>
                  {t.cta.primary}
                </Button>
                <Button variant="outline" className="rounded-full px-7">
                  {t.cta.secondary}
                </Button>
              </div>
            </div>
          </Card>
        </section>
      </main>

      <footer
        id="company"
        className="snap-section border-t border-border/70 bg-[#0c1d17]"
      >
        <div className="mx-auto max-w-6xl px-6 py-12">
          <div className="flex flex-col gap-10">
            <div>
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full border border-border/70 bg-card">
                  <Image
                    src={logo}
                    alt="Sylvy logo"
                    width={26}
                    height={26}
                    className="h-6 w-6 object-contain"
                  />
                </div>
                <span className="text-lg font-semibold tracking-tight">
                  {t.footer.addressTitle}
                </span>
              </div>
              <p className="mt-4 text-sm text-muted-foreground">
                {t.footer.address}
              </p>
              <div className="mt-6 flex flex-wrap gap-3">
                <Button variant="outline" className="rounded-full px-5">
                  {t.footer.buttons.contact}
                </Button>
                <Button variant="secondary" className="rounded-full px-5">
                  {t.footer.buttons.support}
                </Button>
              </div>
              <div className="mt-6 flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
                {t.footer.social.map((item) => (
                  <span key={item}>{item}</span>
                ))}
              </div>
            </div>
          </div>
          <Separator className="my-8 opacity-60" />
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
