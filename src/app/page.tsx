import {
  ArrowRight,
  BarChart3,
  Coins,
  Leaf,
  Search,
  ShieldCheck,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";

const stats = [
  {
    label: "Minimum entry",
    value: "10 EUR",
    detail: "Start with a simple amount and grow over time.",
  },
  {
    label: "Target return",
    value: "Up to 10% per year",
    detail: "Illustrative returns based on pilot modeling.",
  },
  {
    label: "Verified projects",
    value: "Independent review",
    detail: "Due diligence by restoration specialists.",
  },
];

const steps = [
  {
    number: "01",
    title: "Select a restoration project",
    description:
      "Browse verified ecosystem restoration opportunities built by local partners.",
    icon: Search,
  },
  {
    number: "02",
    title: "Invest from a few euros",
    description:
      "Access institutional grade nature investments with an accessible minimum.",
    icon: Coins,
  },
  {
    number: "03",
    title: "Funds are deployed on the ground",
    description:
      "Capital flows directly into reforestation, biodiversity, and carbon programs.",
    icon: Leaf,
  },
  {
    number: "04",
    title: "Impact is monitored over time",
    description:
      "Track progress through transparent reporting on ecological and financial metrics.",
    icon: BarChart3,
  },
];

const projects = [
  {
    region: "Bolivia",
    title: "Tropical Agroforestry Corridor",
    description:
      "Restore soil health while supporting long-term environmental value creation.",
    duration: "10 to 15 years",
    returnRange: "6 to 9% per year",
    impact: "Biodiversity corridors and soil regeneration",
  },
  {
    region: "Brazil",
    title: "Amazonian Forest Restoration",
    description:
      "Large scale restoration combining reforestation, habitat recovery, and carbon capture.",
    duration: "10 to 12 years",
    returnRange: "6 to 8% per year",
    impact: "Forest regeneration and biodiversity protection",
  },
  {
    region: "Indonesia",
    title: "Mangrove Restoration",
    description:
      "Coastal ecosystem restoration improving carbon capture and shoreline resilience.",
    duration: "8 to 10 years",
    returnRange: "7 to 10% per year",
    impact: "Blue carbon and climate adaptation",
  },
];

const valueProps = [
  {
    title: "Verified project pipeline",
    description:
      "Only projects with on-the-ground partners and third-party verification.",
    icon: ShieldCheck,
  },
  {
    title: "Simple portfolio view",
    description:
      "Track commitments, impact, and returns in a single clean dashboard.",
    icon: BarChart3,
  },
  {
    title: "Aligned with nature",
    description:
      "Investments focus on measurable restoration and community benefit.",
    icon: Leaf,
  },
];

const investmentRanges = [
  "Below 100 EUR",
  "100 to 1,000 EUR",
  "1,000 to 5,000 EUR",
  "Above 5,000 EUR",
];

export default function Home() {
  return (
    <div className="relative min-h-screen overflow-hidden bg-background text-foreground">
      <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(circle_at_20%_15%,rgba(64,120,88,0.18),transparent_45%),radial-gradient(circle_at_80%_20%,rgba(120,170,140,0.18),transparent_45%),radial-gradient(circle_at_50%_90%,rgba(64,120,88,0.12),transparent_50%)]" />

      <header className="sticky top-0 z-30 border-b border-border/60 bg-background/80 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-full border border-border/70 bg-card">
              <Leaf className="h-4 w-4 text-foreground" />
            </div>
            <span className="text-lg font-semibold tracking-tight">Sylvy</span>
          </div>
          <nav className="hidden items-center gap-8 text-sm text-muted-foreground md:flex">
            <a className="transition hover:text-foreground" href="#projects">
              Projects
            </a>
            <a className="transition hover:text-foreground" href="#how-it-works">
              How it works
            </a>
            <a className="transition hover:text-foreground" href="#early-access">
              Early access
            </a>
          </nav>
          <div className="flex items-center gap-3">
            <div className="hidden items-center gap-2 rounded-full border border-border/70 px-3 py-1 text-xs text-muted-foreground md:flex">
              <span className="font-medium text-foreground">EN</span>
              <span>/</span>
              <span>FR</span>
            </div>
            <Button size="sm">Get Early Access</Button>
          </div>
        </div>
      </header>

      <main className="relative">
        <section className="mx-auto max-w-6xl px-6 pb-16 pt-14 lg:pt-20">
          <div className="grid items-center gap-12 lg:grid-cols-[1.1fr_0.9fr]">
            <div className="animate-fade-up">
              <Badge variant="outline" className="mb-4 w-fit text-xs uppercase tracking-[0.25em]">
                Opening Soon
              </Badge>
              <h1 className="font-display text-4xl leading-tight sm:text-5xl lg:text-6xl">
                Invest in ecosystem restoration
              </h1>
              <p className="mt-4 max-w-xl text-base text-muted-foreground sm:text-lg">
                Finance real-world nature restoration projects starting with a
                small amount. Simple, transparent, and designed to grow trust.
              </p>
              <div className="mt-6 flex flex-wrap gap-3">
                <Button size="lg">
                  Get Early Access
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
                <Button size="lg" variant="outline">
                  View available projects
                </Button>
              </div>
              <div className="mt-8 flex flex-wrap gap-6 text-xs text-muted-foreground">
                <div className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-foreground/80" />
                  Transparent reporting
                </div>
                <div className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-foreground/80" />
                  Verified restoration partners
                </div>
                <div className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-foreground/80" />
                  Simple portfolio view
                </div>
              </div>
            </div>

            <Card
              className="animate-fade-up border-border/70 bg-card/90 shadow-sm"
              style={{ animationDelay: "120ms" }}
            >
              <CardHeader className="space-y-4">
                <div className="rounded-2xl border border-border/70 bg-gradient-to-br from-emerald-50 to-white p-4">
                  <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
                    Pilot project
                  </p>
                  <CardTitle className="font-display text-2xl">
                    Tropical Agroforestry Corridor
                  </CardTitle>
                  <p className="mt-2 text-sm text-muted-foreground">
                    Restore soil health while generating long-term environmental value.
                  </p>
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
                      Duration
                    </p>
                    <p className="text-base font-semibold">10 to 15 years</p>
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
                      Target return
                    </p>
                    <p className="text-base font-semibold">6 to 9% per year</p>
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
                      Impact
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Soil regeneration and biodiversity corridors
                    </p>
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
                      Revenue sources
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Carbon credits and sustainable land value
                    </p>
                  </div>
                </div>
                <Button variant="outline" className="w-full">
                  View available projects
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </CardHeader>
            </Card>
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-6 pb-12">
          <div className="grid gap-6 md:grid-cols-3">
            {stats.map((stat, index) => (
              <Card
                key={stat.label}
                className="animate-fade-up border-border/70 bg-card/80 shadow-sm"
                style={{ animationDelay: `${200 + index * 120}ms` }}
              >
                <CardHeader className="space-y-2">
                  <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
                    {stat.label}
                  </p>
                  <CardTitle className="text-2xl font-semibold">
                    {stat.value}
                  </CardTitle>
                  <p className="text-sm text-muted-foreground">{stat.detail}</p>
                </CardHeader>
              </Card>
            ))}
          </div>
        </section>

        <section id="how-it-works" className="mx-auto max-w-6xl px-6 py-16">
          <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
            <div>
              <Badge variant="outline" className="mb-4 text-xs uppercase tracking-[0.25em]">
                How it works
              </Badge>
              <h2 className="font-display text-3xl sm:text-4xl">
                How investing will work
              </h2>
            </div>
            <p className="max-w-lg text-sm text-muted-foreground">
              A simple flow inspired by Kubera's clarity, focused on clear
              steps and transparent reporting.
            </p>
          </div>
          <div className="mt-8 grid gap-4">
            {steps.map((step, index) => (
              <Card
                key={step.number}
                className="animate-fade-up border-border/70 bg-card/80 shadow-sm"
                style={{ animationDelay: `${index * 120}ms` }}
              >
                <CardContent className="flex flex-col gap-4 p-6 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex items-start gap-4">
                    <div className="text-sm font-semibold text-muted-foreground">
                      {step.number}
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold">{step.title}</h3>
                      <p className="text-sm text-muted-foreground">
                        {step.description}
                      </p>
                    </div>
                  </div>
                  <div className="flex h-11 w-11 items-center justify-center rounded-full border border-border/70 bg-background">
                    <step.icon className="h-5 w-5 text-foreground" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        <section id="projects" className="mx-auto max-w-6xl px-6 py-16">
          <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
            <div>
              <Badge variant="outline" className="mb-4 text-xs uppercase tracking-[0.25em]">
                Pre-launch phase
              </Badge>
              <h2 className="font-display text-3xl sm:text-4xl">
                Examples of projects
              </h2>
            </div>
            <Button variant="outline">View all projects</Button>
          </div>
          <div className="mt-10 grid gap-6 lg:grid-cols-3">
            {projects.map((project, index) => (
              <Card
                key={project.title}
                className="animate-fade-up border-border/70 bg-card/80 shadow-sm"
                style={{ animationDelay: `${index * 120}ms` }}
              >
                <CardHeader className="space-y-3">
                  <div className="h-36 rounded-2xl border border-border/70 bg-gradient-to-br from-emerald-100 via-white to-emerald-50" />
                  <p className="text-xs uppercase tracking-[0.25em] text-muted-foreground">
                    {project.region}
                  </p>
                  <CardTitle className="font-display text-2xl">
                    {project.title}
                  </CardTitle>
                  <p className="text-sm text-muted-foreground">
                    {project.description}
                  </p>
                </CardHeader>
                <CardContent className="space-y-3 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Duration</span>
                    <span className="font-medium">{project.duration}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Target return</span>
                    <span className="font-medium">{project.returnRange}</span>
                  </div>
                  <div className="text-muted-foreground">{project.impact}</div>
                  <Button variant="outline" className="w-full">
                    View project details
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
          <p className="mt-6 text-xs text-muted-foreground">
            Project details and returns are illustrative pilot simulations.
          </p>
        </section>

        <section className="mx-auto max-w-6xl px-6 pb-16">
          <div className="grid gap-6 md:grid-cols-3">
            {valueProps.map((item, index) => (
              <Card
                key={item.title}
                className="animate-fade-up border-border/70 bg-card/80 shadow-sm"
                style={{ animationDelay: `${index * 120}ms` }}
              >
                <CardHeader className="space-y-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full border border-border/70 bg-background">
                    <item.icon className="h-5 w-5 text-foreground" />
                  </div>
                  <CardTitle className="text-lg">{item.title}</CardTitle>
                  <p className="text-sm text-muted-foreground">{item.description}</p>
                </CardHeader>
              </Card>
            ))}
          </div>
        </section>

        <section id="early-access" className="mx-auto max-w-6xl px-6 pb-20">
          <Card className="animate-fade-up border-border/70 bg-card/90 shadow-sm">
            <CardContent className="grid gap-8 p-8 lg:grid-cols-[1.1fr_0.9fr]">
              <div>
                <Badge variant="outline" className="mb-4 text-xs uppercase tracking-[0.25em]">
                  Get early access
                </Badge>
                <h2 className="font-display text-3xl sm:text-4xl">
                  Join the waitlist
                </h2>
                <p className="mt-3 text-sm text-muted-foreground">
                  Be the first to access pilot projects and receive launch
                  incentives when the platform opens.
                </p>
                <div className="mt-6 flex flex-col gap-3 sm:flex-row">
                  <Input className="sm:flex-1" placeholder="Email address" type="email" />
                  <Button size="lg">Request early access</Button>
                </div>
                <div className="mt-6 grid gap-3 sm:grid-cols-2">
                  {investmentRanges.map((range) => (
                    <Button key={range} variant="outline" className="justify-start">
                      {range}
                    </Button>
                  ))}
                </div>
                <p className="mt-4 text-xs text-muted-foreground">
                  No investment offer is made at this stage. Target returns are
                  illustrative only.
                </p>
              </div>
              <div className="rounded-2xl border border-border/70 bg-gradient-to-br from-emerald-100 via-white to-emerald-50 p-6">
                <div className="space-y-4">
                  <p className="text-xs uppercase tracking-[0.25em] text-muted-foreground">
                    Early access benefits
                  </p>
                  <div className="space-y-3 text-sm text-muted-foreground">
                    <div className="flex items-start gap-3">
                      <span className="mt-1 h-2 w-2 rounded-full bg-foreground" />
                      Priority access to upcoming restoration offerings.
                    </div>
                    <div className="flex items-start gap-3">
                      <span className="mt-1 h-2 w-2 rounded-full bg-foreground" />
                      Personalized onboarding to set up your portfolio.
                    </div>
                    <div className="flex items-start gap-3">
                      <span className="mt-1 h-2 w-2 rounded-full bg-foreground" />
                      First look at impact reports and live progress updates.
                    </div>
                  </div>
                  <Separator className="opacity-60" />
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Waitlist size</span>
                    <span className="font-semibold text-foreground">1,248</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Next cohort</span>
                    <span className="font-semibold text-foreground">Q3 2025</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </section>
      </main>

      <footer className="border-t border-border/60 bg-background/80">
        <div className="mx-auto flex max-w-6xl flex-col gap-4 px-6 py-6 text-sm text-muted-foreground md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-3 text-foreground">
            <div className="flex h-8 w-8 items-center justify-center rounded-full border border-border/70 bg-card">
              <Leaf className="h-4 w-4 text-foreground" />
            </div>
            <span className="font-semibold">Sylvy</span>
            <span className="text-muted-foreground">
              2025 Sylvy. All rights reserved.
            </span>
          </div>
          <div className="flex items-center gap-6">
            <a className="transition hover:text-foreground" href="#">
              Privacy Policy
            </a>
            <a className="transition hover:text-foreground" href="#">
              Legal Notice
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
