"use client";

import Image from "next/image";
import { useState, type ChangeEvent, type FormEvent } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import logo from "../../logo/Logo Noir sans Fond.png";

const copy = {
  en: {
    trial: "Trial: 9 days",
    nav: ["Overview", "Projects", "Impact", "Access"],
    headline: "Invest in restoration",
    subhead: "Small. Verified. Transparent.",
    metrics: {
      minimum: { label: "Minimum", value: "10 EUR" },
      target: { label: "Target", value: "6-9%/yr" },
      impact: { label: "Impact", value: "Biodiversity" },
      status: { label: "Status", value: "Opening soon" },
    },
    pilot: { label: "Pilot", title: "Agroforestry", region: "Bolivia" },
    waitlist: { label: "Waitlist", value: "Early access" },
    actions: { access: "Get Early Access", join: "Join" },
    modal: {
      title: "Get Early Access",
      description: "Join the waitlist.",
      firstName: "First name",
      lastName: "Last name",
      email: "Email address",
      submit: "Submit",
      cancel: "Cancel",
      success: "Thanks. We will reach out.",
      error: "Something went wrong.",
    },
    sidebarNote: "Nature-first investing.",
  },
  fr: {
    trial: "Essai: 9 jours",
    nav: ["Apercu", "Projets", "Impact", "Acces"],
    headline: "Investir dans la restauration",
    subhead: "Simple. Verifie. Transparent.",
    metrics: {
      minimum: { label: "Minimum", value: "10 EUR" },
      target: { label: "Cible", value: "6-9%/an" },
      impact: { label: "Impact", value: "Biodiversite" },
      status: { label: "Statut", value: "Bientot" },
    },
    pilot: { label: "Pilote", title: "Agroforesterie", region: "Bolivie" },
    waitlist: { label: "Liste", value: "Acces anticipe" },
    actions: { access: "Acces anticipe", join: "Rejoindre" },
    modal: {
      title: "Acces anticipe",
      description: "Liste d'attente.",
      firstName: "Prenom",
      lastName: "Nom",
      email: "Email",
      submit: "Envoyer",
      cancel: "Annuler",
      success: "Merci. On revient vers vous.",
      error: "Erreur. Reessayer.",
    },
    sidebarNote: "Investissement nature.",
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
  const metrics = [
    t.metrics.minimum,
    t.metrics.target,
    t.metrics.impact,
    t.metrics.status,
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
    <div className="min-h-screen bg-neutral-50 text-neutral-900">
      <div className="mx-auto grid min-h-screen w-full max-w-6xl md:grid-cols-[220px_1fr]">
        <aside className="flex flex-col border-r border-neutral-200 bg-white px-5 py-6">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full border border-neutral-200 bg-white">
              <Image
                src={logo}
                alt="Sylvy logo"
                width={26}
                height={26}
                className="h-6 w-6 object-contain"
                priority
              />
            </div>
            <span className="text-lg font-semibold">Sylvy</span>
          </div>

          <nav className="mt-10 flex flex-col gap-1 text-sm">
            {t.nav.map((item, index) => (
              <button
                key={item}
                className={`rounded-md px-3 py-2 text-left transition ${
                  index === 0
                    ? "bg-neutral-100 font-semibold text-neutral-900"
                    : "text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900"
                }`}
                type="button"
              >
                {item}
              </button>
            ))}
          </nav>

          <p className="mt-auto pt-6 text-xs text-neutral-500">
            {t.sidebarNote}
          </p>
        </aside>

        <main className="px-6 py-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <span className="text-xs uppercase tracking-[0.2em] text-neutral-500">
              {t.trial}
            </span>
            <div className="flex items-center gap-3">
              <div className="flex items-center rounded-full border border-neutral-200 bg-white p-1 text-xs">
                <button
                  type="button"
                  onClick={() => setLanguage("en")}
                  className={`rounded-full px-3 py-1 font-medium transition ${
                    language === "en"
                      ? "bg-neutral-900 text-white"
                      : "text-neutral-500 hover:text-neutral-900"
                  }`}
                >
                  EN
                </button>
                <button
                  type="button"
                  onClick={() => setLanguage("fr")}
                  className={`rounded-full px-3 py-1 font-medium transition ${
                    language === "fr"
                      ? "bg-neutral-900 text-white"
                      : "text-neutral-500 hover:text-neutral-900"
                  }`}
                >
                  FR
                </button>
              </div>
              <Button
                size="sm"
                className="bg-blue-600 text-white hover:bg-blue-500"
                onClick={openModal}
              >
                {t.actions.access}
              </Button>
            </div>
          </div>

          <div className="mt-10 max-w-xl">
            <h1 className="text-3xl font-semibold">{t.headline}</h1>
            <p className="mt-2 text-sm text-neutral-500">{t.subhead}</p>
          </div>

          <section className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {metrics.map((metric) => (
              <div
                key={metric.label}
                className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm"
              >
                <p className="text-xs uppercase tracking-[0.2em] text-neutral-500">
                  {metric.label}
                </p>
                <p className="mt-2 text-2xl font-semibold">{metric.value}</p>
              </div>
            ))}
          </section>

          <section className="mt-6 grid gap-4 md:grid-cols-2">
            <div className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm">
              <p className="text-xs uppercase tracking-[0.2em] text-neutral-500">
                {t.pilot.label}
              </p>
              <p className="mt-2 text-lg font-semibold">{t.pilot.title}</p>
              <p className="text-sm text-neutral-500">{t.pilot.region}</p>
            </div>
            <div className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm">
              <p className="text-xs uppercase tracking-[0.2em] text-neutral-500">
                {t.waitlist.label}
              </p>
              <p className="mt-2 text-lg font-semibold">{t.waitlist.value}</p>
              <Button variant="outline" size="sm" className="mt-4" onClick={openModal}>
                {t.actions.join}
              </Button>
            </div>
          </section>
        </main>
      </div>

      {isModalOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/20 p-4">
          <div className="w-full max-w-md rounded-2xl border border-neutral-200 bg-white p-6 shadow-lg">
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
