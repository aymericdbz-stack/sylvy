export default function HeroIntroGreen() {
  return (
    <section
      className="snap-section relative min-h-screen overflow-hidden text-[color:var(--theme-hero-intro-text)]"
      style={{ background: "var(--theme-hero-intro-bg)" }}
    >
      <div className="pointer-events-none absolute inset-0">
        <div className="hero-intro-blob hero-intro-blob--one" />
        <div className="hero-intro-blob hero-intro-blob--two" />
        <div className="hero-intro-blob hero-intro-blob--three" />
        <div className="hero-intro-blob hero-intro-blob--four" />
      </div>
      <div className="relative z-10 flex min-h-screen items-center justify-center px-6 text-center">
        <div>
          <p className="text-[16rem] font-semibold tracking-[0.1em] text-[color:var(--theme-hero-intro-text)] sm:text-7xl lg:text-7xl">
            FOCUS ON RESEARCH
          </p>
          <p className="mt-4 text-2xl font-medium text-[color:var(--theme-hero-intro-subtext)] sm:text-3xl lg:text-4xl">
            Sylvy handles the rest
          </p>
        </div>
      </div>
    </section>
  );
}
