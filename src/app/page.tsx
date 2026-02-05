"use client";

import Image from "next/image";
import { useState, type ChangeEvent, type FormEvent } from "react";
import {
  ArrowRight,
  ChevronDown,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import logo from "../../logo/Logo Noir sans Fond.png";
import abbvieLogo from "../../carrousel/abbvie.webp";
import berkeleyLabsLogo from "../../carrousel/berkeley_labs.webp";
import chimieParisLogo from "../../carrousel/chimie_paris.webp";
import merckLogo from "../../carrousel/merck.webp";
import sanofiLogo from "../../carrousel/sanofi.webp";
import labResearcherPhoto from "../../photos_videos/montage.webp";
import moleculeDiagram from "../../photos_videos/molecule.webp";
import notebookChecksImage from "../../photos_videos/molecule2.webp";

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
      title: "Everything your lab needs for cutting-edge science",
      subtitle:
        "Sylvy is the B2B SaaS platform for pharmaceutical labs. Unify ELN, LIMS, and analytics in one secure cloud.",
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
      title: "Trusted by labs and biopharma teams",
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
      address: "22 Rue de la Paix, 75002 Paris, France",
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
      legal: "Copyright 2025 Sylvy. All rights reserved.",
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
      title: "Tout ce dont votre labo a besoin pour accelerer la science",
      subtitle:
        "Sylvy est la plateforme SaaS B2B pour les labos pharmaceutiques. Unifiez ELN, LIMS et analytics dans un cloud securise.",
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
      title: "Adopte par des labos et equipes biopharma",
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

type Language = keyof typeof copy;

type FormStatus = "idle" | "loading" | "success" | "error";

export default function Home() {
  const [language, setLanguage] = useState<Language>("en");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formStatus, setFormStatus] = useState<FormStatus>("idle");
  const [formState, setFormState] = useState({
    firstName: "",
    lastName: "",
    email: "",
  });

  const t = copy[language];
  const navItems = [
    { label: t.nav.products, href: "#platform" },
    { label: t.nav.ai, href: "#ai" },
    { label: t.nav.solutions, href: "#solutions" },
    { label: t.nav.customers, href: "#customers" },
    { label: t.nav.resources, href: "#resources" },
    { label: t.nav.company, href: "#company" },
  ];
  const logoItems = [
    { src: abbvieLogo, alt: "Abbvie" },
    { src: berkeleyLabsLogo, alt: "Berkeley Labs" },
    { src: chimieParisLogo, alt: "Chimie Paris" },
    { src: merckLogo, alt: "Merck" },
    { src: sanofiLogo, alt: "Sanofi" },
  ];

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

  return (
    <div className="relative min-h-screen overflow-hidden bg-background text-foreground">
      <div className="border-b border-border/60 bg-secondary text-xs">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-2">
          <div className="flex flex-wrap items-center gap-2 text-muted-foreground">
            <span>{t.topBar.message}</span>
            <a
              className="text-foreground underline underline-offset-4 transition hover:text-foreground"
              href="#resources"
            >
              {t.topBar.linkText}
            </a>
          </div>
          <div className="flex items-center gap-4">
            <button
              type="button"
              className="text-muted-foreground transition hover:text-foreground"
            >
              {t.topBar.login}
            </button>
            <div className="flex items-center gap-1 rounded-full border border-border/70 bg-background/80 p-1 text-[10px]">
              <button
                type="button"
                onClick={() => setLanguage("en")}
                className={`rounded-full px-3 py-1 font-medium transition ${
                  language === "en"
                    ? "bg-foreground text-background"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                EN
              </button>
              <button
                type="button"
                onClick={() => setLanguage("fr")}
                className={`rounded-full px-3 py-1 font-medium transition ${
                  language === "fr"
                    ? "bg-foreground text-background"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                FR
              </button>
            </div>
          </div>
        </div>
      </div>

      <header className="sticky top-0 z-30 border-b border-border/60 bg-secondary backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full border border-border/70 bg-card">
              <Image
                src={logo}
                alt="Sylvy logo"
                width={26}
                height={26}
                className="h-6 w-6 object-contain"
                priority
              />
            </div>
            <span className="text-lg font-semibold tracking-tight">Sylvy</span>
          </div>
          <nav className="hidden items-center gap-6 text-sm text-muted-foreground lg:flex">
            {navItems.map((item) => (
              <a
                key={item.label}
                href={item.href}
                className="flex items-center gap-1 transition hover:text-foreground"
              >
                {item.label}
                <ChevronDown className="h-3 w-3 text-muted-foreground" />
              </a>
            ))}
          </nav>
          <div className="flex items-center gap-3">
            <Button variant="outline" size="sm" className="rounded-full px-5">
              {t.hero.secondaryCta}
            </Button>
            <Button size="sm" className="rounded-full px-5" onClick={openModal}>
              {t.hero.primaryCta}
            </Button>
          </div>
        </div>
      </header>

      <main className="relative">
        <section
          id="solutions"
          className="mx-auto max-w-6xl px-6 pb-32 pt-14 lg:pt-20"
        >
          <div className="grid items-center gap-12">
            <div className="animate-fade-up">
              <Badge
                variant="outline"
                className="mb-4 w-fit rounded-full text-xs uppercase tracking-[0.25em]"
              >
                {t.hero.badge}
              </Badge>
              <h1 className="font-display text-4xl leading-tight text-primary sm:text-5xl lg:text-6xl">
                {t.hero.title}
              </h1>
              <div className="mt-6 flex flex-wrap gap-3">
                <Button size="lg" className="rounded-full px-7" onClick={openModal}>
                  {t.hero.primaryCta}
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  className="rounded-full px-7"
                  asChild
                >
                  <a href="#demo">{t.hero.secondaryCta}</a>
                </Button>
              </div>
              <div className="mt-8 flex flex-wrap gap-6 text-xs text-muted-foreground">
                {t.hero.points.map((point) => (
                  <div key={point} className="flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full bg-primary" />
                    {point}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section id="customers" className="pb-14">
          <div className="mx-auto max-w-6xl px-6">
            <p className="text-xs uppercase tracking-[0.35em] text-primary">
              {t.logos.title}
            </p>
          </div>
          <div className="logo-marquee mt-8 w-full">
            <div className="logo-track">
              {[...logoItems, ...logoItems].map((logoItem, index) => (
                <div key={`${logoItem.alt}-${index}`} className="logo-item">
                  <Image
                    src={logoItem.src}
                    alt={logoItem.alt}
                    width={320}
                    height={150}
                    className="h-24 w-auto object-contain"
                  />
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-6 py-16">
          <div className="grid items-center gap-12 lg:grid-cols-[1fr_1fr]">
            <div className="animate-fade-up">
              <Badge
                variant="outline"
                className="mb-4 w-fit rounded-full text-xs uppercase tracking-[0.25em]"
              >
                {t.why.badge}
              </Badge>
              <h2 className="font-display text-3xl text-primary sm:text-4xl">
                {t.why.title}
              </h2>
              <p className="mt-4 text-sm text-muted-foreground">
                {t.why.description}
              </p>
              <div className="mt-6 grid gap-3 text-sm text-muted-foreground">
                {t.why.bullets.map((bullet) => (
                  <div key={bullet} className="flex items-start gap-3">
                    <span className="mt-1 h-2 w-2 rounded-full bg-primary" />
                    {bullet}
                  </div>
                ))}
              </div>
              <Button
                variant="outline"
                className="mt-6 rounded-full px-6"
                asChild
              >
                <a href="#resources">
                  {t.why.cta}
                  <ArrowRight className="ml-2 h-4 w-4" />
                </a>
              </Button>
            </div>
            <div className="animate-fade-up" style={{ animationDelay: "120ms" }}>
              <div className="mx-auto w-fit overflow-hidden lg:ml-auto">
                <Image
                  src={labResearcherPhoto}
                  alt="Lab researcher in a pharmaceutical lab"
                  width={labResearcherPhoto.width}
                  height={labResearcherPhoto.height}
                  className="h-[37.44rem] w-auto object-contain"
                  priority
                />
              </div>
            </div>
          </div>
        </section>

        <section id="ai" className="mx-auto max-w-6xl px-6 pb-16 pt-[3.25rem]">
          <div className="grid items-center gap-12 lg:grid-cols-[1.05fr_0.95fr]">
            <div className="animate-fade-up">
              <Badge
                variant="outline"
                className="mb-4 w-fit rounded-full text-xs uppercase tracking-[0.25em]"
              >
                {t.ai.badge}
              </Badge>
              <h2 className="font-display text-3xl text-primary sm:text-4xl">
                {t.ai.title}
              </h2>
              <p className="mt-4 text-sm text-muted-foreground">
                {t.ai.description}
              </p>
              <div className="mt-6 grid gap-3 text-sm text-muted-foreground">
                {t.ai.points.map((point) => (
                  <div key={point} className="flex items-start gap-3">
                    <span className="mt-1 h-2 w-2 rounded-full bg-primary" />
                    {point}
                  </div>
                ))}
              </div>
              <Button className="mt-6 rounded-full px-6" asChild>
                <a href="#platform">{t.ai.cta}</a>
              </Button>
            </div>
            <div className="animate-fade-up" style={{ animationDelay: "120ms" }}>
              <div className="rounded-3xl bg-card/90 p-6">
                <div className="overflow-hidden rounded-2xl bg-background">
                  <Image
                    src={notebookChecksImage}
                    alt="Sylvy notebook checks overview"
                    className="h-auto w-full object-contain"
                  />
                </div>
              </div>
            </div>
          </div>
        </section>

        <section id="resources" className="mx-auto max-w-6xl px-6 py-16">
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

        <section id="platform" className="mx-auto max-w-6xl px-6 py-16">
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

        <section id="demo" className="mx-auto max-w-6xl px-6 pb-20">
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

      <footer id="company" className="border-t border-border/70 bg-secondary">
        <div className="mx-auto max-w-6xl px-6 py-12">
          <div className="grid gap-10 lg:grid-cols-[1.1fr_2fr]">
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
            <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
              {t.footer.columns.map((column) => (
                <div key={column.title} className="space-y-3 text-sm">
                  <p className="font-semibold text-primary">{column.title}</p>
                  <div className="space-y-2 text-muted-foreground">
                    {column.links.map((link) => (
                      <p key={link}>{link}</p>
                    ))}
                  </div>
                </div>
              ))}
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
                <p className="text-xs text-emerald-600">{t.modal.success}</p>
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
