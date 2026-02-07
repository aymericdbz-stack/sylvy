export default function HeroIntroGreen() {
  return (
    <section className="relative min-h-screen overflow-hidden bg-[#063B2B] text-white">
      <div className="pointer-events-none absolute inset-0">
        <div className="hero-intro-blob hero-intro-blob--one" />
        <div className="hero-intro-blob hero-intro-blob--two" />
        <div className="hero-intro-blob hero-intro-blob--three" />
        <div className="hero-intro-blob hero-intro-blob--four" />
      </div>
      <div className="relative z-10 flex min-h-screen items-center justify-center px-6 text-center">
        <div>
          <p className="text-[16rem] font-semibold tracking-[0.1em] text-white sm:text-7xl lg:text-7xl">
            RESEARCH
          </p>
          <p className="mt-4 text-2xl font-medium text-white/80 sm:text-3xl lg:text-4xl">
            Sylvy does the boring stuff
          </p>
        </div>
      </div>
    </section>
  );
}
