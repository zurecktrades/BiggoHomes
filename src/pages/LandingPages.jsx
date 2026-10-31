import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  motion,
  useReducedMotion,
  AnimatePresence,
} from "framer-motion";
import {
  ArrowRight,
  Building2,
  ShieldCheck,
  TrendingUp,
  Wallet,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import InvestmentCorridorsSection from "../components/InvestmentCorridor";

const statsSlides = [
  [
    { value: "4,800+", label: "Trusted Investors" },
    { value: "18.5%", label: "Avg. Annualized Returns" },
    { value: "$24M+", label: "Invested in Real Estate" },
    { value: "45+", label: "Projects Completed" },
  ],
  [
    { value: "120+", label: "Active Property Deals" },
    { value: "99.4%", label: "Investor Satisfaction" },
    { value: "$50M+", label: "Total Asset Value" },
    { value: "15+", label: "Prime Urban Locations" },
  ],
];

const strategies = [
  {
    icon: Building2,
    title: "Residential Development",
    description:
      "Invest in residential property acquisition and development opportunities in carefully selected locations.",
    label: "Residential",
  },
  {
    icon: TrendingUp,
    title: "Commercial Development",
    description:
      "Explore commercial real estate projects designed around local demand, location and long-term asset value.",
    label: "Commercial",
  },
  {
    icon: Wallet,
    title: "Income-Generating Property",
    description:
      "Participate in eligible property investments that may generate rental income, subject to project performance.",
    label: "Income potential",
  },
  {
    icon: ShieldCheck,
    title: "Property Value Development",
    description:
      "Support property improvement and development projects intended to enhance the value and usefulness of real assets.",
    label: "Development",
  },
];

const reasons = [
  {
    num: "01",
    title: "Real-Asset Focus",
    description:
      "Explore investment opportunities connected to identified real estate assets and development projects.",
  },
  {
    num: "02",
    title: "Clear Investment Terms",
    description:
      "Review the project structure, investment duration, fees, risks and distribution terms before making an investment decision.",
  },
  {
    num: "03",
    title: "Project Visibility",
    description:
      "Follow project updates and access relevant information about acquisition, development and management progress.",
  },
  {
    num: "04",
    title: "Investor Reporting",
    description:
      "Access investment records, project reports and distribution statements through your investor account.",
  },
];

const viewportOptions = {
  once: true,
  amount: 0.18,
  margin: "0px 0px -60px 0px",
};

const fadeUp = {
  hidden: { opacity: 0, y: 36 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.75, ease: [0.22, 1, 0.36, 1] },
  },
};

const fadeIn = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.9, ease: "easeOut" } },
};

const scaleIn = {
  hidden: { opacity: 0, scale: 0.94 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: { duration: 0.85, ease: [0.22, 1, 0.36, 1] },
  },
};

const staggerContainer = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.13, delayChildren: 0.08 },
  },
};

function Reveal({
  children,
  className = "",
  variant = fadeUp,
  delay = 0,
  amount = 0.18,
}) {
  const shouldReduceMotion = useReducedMotion();
  return (
    <motion.div
      className={className}
      initial="hidden"
      whileInView="visible"
      viewport={{ ...viewportOptions, amount }}
      variants={shouldReduceMotion ? fadeIn : variant}
      transition={{ delay }}
    >
      {children}
    </motion.div>
  );
}

function SectionHeading({ eyebrow, title, description, centered = false }) {

useEffect(() => {
    // Set up Tawk_API on global window object
    window.Tawk_API = window.Tawk_API || {};
    window.Tawk_LoadStart = new Date();

    // Create and inject the Tawk.to script tag
    const s1 = document.createElement("script");
    const s0 = document.getElementsByTagName("script")[0];
    
    s1.async = true;
    s1.src = 'https://embed.tawk.to/6ae51566dbd3773477c36043/1k67dn6qs';
    s1.charset = 'UTF-8';
    s1.setAttribute('crossorigin', '*');
    s1.id = 'tawk-script';

    if (s0 && s0.parentNode) {
      s0.parentNode.insertBefore(s1, s0);
    }

    // Cleanup: Hide and remove Tawk widget when leaving LandingPage
    return () => {
      if (window.Tawk_API && typeof window.Tawk_API.hideWidget === 'function') {
        window.Tawk_API.hideWidget();
      }
      
      const existingScript = document.getElementById('tawk-script');
      if (existingScript) {
        existingScript.remove();
      }

      // Remove the floating widget container iframe created by Tawk
      const tawkIframe = document.querySelector('.tawk-min-container, [id^="tawk-"]');
      if (tawkIframe) {
        tawkIframe.remove();
      }
    };
  }, []);

  return (
    <Reveal
      className={`mb-12 ${centered ? "mx-auto max-w-3xl text-center" : "max-w-3xl"}`}
    >
      {eyebrow && (
        <p className="mb-3 text-xs font-bold uppercase tracking-[0.22em] text-[#B78319] dark:text-[#E5B94F]">
          {eyebrow}
        </p>
      )}
      <h2 className="text-3xl font-bold tracking-tight text-[#0B1F4B] dark:text-white sm:text-4xl lg:text-[2.75rem]">
        {title}
      </h2>
      {description && (
        <p className="mt-4 text-base leading-7 text-[#718096] dark:text-slate-300 sm:text-lg">
          {description}
        </p>
      )}
    </Reveal>
  );
}

export default function LandingPage() {
  const shouldReduceMotion = useReducedMotion();
  const sectionAnimation = shouldReduceMotion ? fadeIn : fadeUp;

  // Stats Carousel State
  const [currentSlide, setCurrentSlide] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % statsSlides.length);
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % statsSlides.length);
  };

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + statsSlides.length) % statsSlides.length);
  };

  return (
    <main className="min-h-screen overflow-hidden bg-white font-sans text-[#172338] transition-colors duration-300 dark:bg-[#071326] dark:text-slate-100">
      
      {/* 1. HERO SECTION */}
      <section className="relative isolate overflow-hidden bg-slate-50 dark:bg-[#0B1F4B] px-4 py-12 lg:py-20 text-[#0B1F4B] dark:text-white transition-colors duration-300">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -right-24 -top-28 h-96 w-96 rounded-full bg-[#D9A55E]/15 blur-3xl"
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -bottom-40 -left-20 h-96 w-96 rounded-full bg-blue-400/10 blur-3xl"
        />

        <div className="relative z-10 mx-auto grid max-w-7xl items-center gap-12 lg:grid-cols-12">
          <motion.div
            className="space-y-8 lg:col-span-7"
            initial="hidden"
            animate="visible"
            variants={staggerContainer}
          >
            <motion.h1
              variants={sectionAnimation}
              className="text-4xl font-bold leading-[1.08] tracking-tight text-[#0B1F4B] dark:text-white sm:text-6xl lg:text-7xl"
            >
              Tangible Investments.
              <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#D9A52E] to-[#F2D58A]">
                Real Opportunities.
              </span>
            </motion.h1>

            <motion.p
              variants={sectionAnimation}
              className="max-w-2xl text-base font-normal leading-8 text-slate-600 dark:text-slate-300 sm:text-lg"
            >
              Discover real estate development and property investment
              opportunities with clear project information, defined investment
              terms and transparent investor reporting.
            </motion.p>

            <motion.div
              variants={sectionAnimation}
              className="flex flex-col gap-4 pt-2 sm:flex-row"
            >
              <Link
                to="/auth"
                className="inline-flex items-center justify-center gap-3 rounded-xl bg-[#0B1F4B] dark:bg-[#D9A52E] px-7 py-4 font-bold text-white dark:text-[#0B1F4B] shadow-lg transition hover:opacity-90"
              >
                Become an Investor
                <ArrowRight className="h-5 w-5" />
              </Link>

              <Link
                to="/properties"
                className="inline-flex items-center justify-center gap-3 rounded-xl border border-slate-300 dark:border-white/30 bg-white dark:bg-white/5 px-7 py-4 font-semibold text-[#0B1F4B] dark:text-white backdrop-blur-sm transition hover:bg-slate-100 dark:hover:bg-white/10"
              >
                Explore Properties
                <ArrowRight className="h-5 w-5" />
              </Link>
            </motion.div>
          </motion.div>

          {/* Hero project showcase */}
          <motion.div
            className="lg:col-span-5"
            initial="hidden"
            animate="visible"
            variants={shouldReduceMotion ? fadeIn : scaleIn}
            transition={{ duration: 0.9, delay: 0.25 }}
          >
            <div className="relative rounded-3xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#07152F]/90 p-7 shadow-xl dark:shadow-2xl backdrop-blur-xl sm:p-9">
              <div className="absolute -right-3 -top-4 rounded-full bg-[#D9A52E] px-4 py-2 text-[10px] font-bold uppercase tracking-[0.16em] text-[#0B1F4B] shadow-lg">
                Featured opportunity
              </div>

              <div className="mb-7 flex items-start justify-between gap-4">
                <div>
                  <p className="mb-2 text-xs font-bold uppercase tracking-[0.18em] text-[#B78319] dark:text-[#E5B94F]">
                    Explore our projects
                  </p>
                  <h2 className="text-2xl font-bold text-[#0B1F4B] dark:text-white">
                    Property Investment
                  </h2>
                  <p className="mt-2 text-sm leading-6 text-slate-500 dark:text-slate-400">
                    Review available real estate opportunities and their
                    investment information.
                  </p>
                </div>
                <div className="rounded-2xl border border-[#D9A52E]/20 bg-[#D9A52E]/10 p-3">
                  <Building2 className="h-7 w-7 text-[#E5B94F]" />
                </div>
              </div>

              <div className="space-y-5 border-t border-slate-100 dark:border-white/10 pt-6">
                <div className="flex items-center justify-between gap-4">
                  <span className="text-sm text-slate-600 dark:text-slate-300">Project details</span>
                  <span className="text-sm font-bold text-[#0B1F4B] dark:text-white">
                    View opportunities
                  </span>
                </div>
                <div className="flex items-center justify-between gap-4">
                  <span className="text-sm text-slate-600 dark:text-slate-300">Investment terms</span>
                  <span className="text-sm font-bold text-[#B78319] dark:text-[#F2D58A]">
                    Project-specific
                  </span>
                </div>
              </div>

              <Link
                to="/properties"
                className="mt-8 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#0B1F4B] dark:bg-white/10 px-5 py-3 text-sm font-bold text-white transition hover:opacity-95"
              >
                View investment opportunities
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* 2. STATS CAROUSEL SECTION */}
      <section className="relative border-b border-[#E5E9F0] bg-[#F5F7FA] px-4 py-8 dark:border-[#263A56] dark:bg-[#0D1B32] sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl relative">
          <div className="absolute left-0 right-0 top-1/2 -translate-y-1/2 flex justify-between z-20 pointer-events-none px-2">
            <button
              onClick={prevSlide}
              className="pointer-events-auto p-2 rounded-full bg-white dark:bg-[#10213B] shadow-md border border-[#E5E9F0] dark:border-[#263A56] text-[#0B1F4B] dark:text-white hover:bg-slate-50 transition"
              aria-label="Previous Stats"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button
              onClick={nextSlide}
              className="pointer-events-auto p-2 rounded-full bg-white dark:bg-[#10213B] shadow-md border border-[#E5E9F0] dark:border-[#263A56] text-[#0B1F4B] dark:text-white hover:bg-slate-50 transition"
              aria-label="Next Stats"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>

          <div className="overflow-hidden px-12">
            <AnimatePresence mode="wait">
              <motion.div
                key={currentSlide}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.4, ease: "easeInOut" }}
                className="grid grid-cols-2 gap-8 text-center md:grid-cols-4"
              >
                {statsSlides[currentSlide].map((stat, idx) => (
                  <div key={idx} className="rounded-2xl px-3">
                    <p className="text-3xl font-bold tracking-tight text-[#0B1F4B] dark:text-white sm:text-4xl lg:text-3xl">
                      {stat.value}
                    </p>
                    <p className="mt-2 text-xs font-semibold text-[#718096] dark:text-slate-400 sm:text-sm">
                      {stat.label}
                    </p>
                  </div>
                ))}
              </motion.div>
            </AnimatePresence>
          </div>

          <div className="flex justify-center space-x-2 mt-4">
            {statsSlides.map((_, idx) => (
              <button
                key={idx}
                onClick={() => setCurrentSlide(idx)}
                className={`h-2 rounded-full transition-all duration-300 ${
                  currentSlide === idx ? "w-6 bg-[#D9A52E]" : "w-2 bg-slate-300 dark:bg-slate-700"
                }`}
                aria-label={`Go to slide ${idx + 1}`}
              />
            ))}
          </div>
        </div>
      </section>

      {/* 3. INVESTMENT STRATEGIES */}
      <section className="px-4 py-20 sm:px-6 lg:px-8 lg:py-28">
        <div className="mx-auto max-w-7xl">
          <SectionHeading
            centered
            eyebrow="Investment approach"
            title="Real estate opportunities built around tangible assets."
            description="Explore the types of property acquisition, development and investment opportunities BiggoHomes may offer."
          />

          <motion.div
            className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4"
            initial="hidden"
            whileInView="visible"
            viewport={viewportOptions}
            variants={staggerContainer}
          >
            {strategies.map((strategy) => {
              const Icon = strategy.icon;
              return (
                <motion.article
                  key={strategy.title}
                  variants={sectionAnimation}
                  whileHover={shouldReduceMotion ? undefined : { y: -7, transition: { duration: 0.25 } }}
                  className="group flex h-full flex-col rounded-2xl border border-[#E5E9F0] bg-[#F5F7FA] p-7 shadow-sm transition-shadow duration-300 hover:shadow-xl dark:border-[#263A56] dark:bg-[#0D1B32]"
                >
                  <div className="mb-6 flex h-12 w-12 items-center justify-center rounded-xl bg-[#D9A52E]/15 text-[#B78319] transition duration-300 group-hover:bg-[#D9A52E] group-hover:text-[#0B1F4B] dark:text-[#E5B94F]">
                    <Icon className="h-6 w-6" />
                  </div>
                  <span className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#B78319] dark:text-[#E5B94F]">
                    {strategy.label}
                  </span>
                  <h3 className="mt-3 text-xl font-semibold text-[#0B1F4B] dark:text-white">
                    {strategy.title}
                  </h3>
                  <p className="mt-3 flex-1 text-sm leading-7 text-[#718096] dark:text-slate-400">
                    {strategy.description}
                  </p>
                  <Link
                    to="/properties"
                    className="mt-7 inline-flex items-center gap-2 border-t border-[#E5E9F0] pt-5 text-sm font-semibold text-[#0B1F4B] transition-colors hover:text-[#B78319] dark:border-[#263A56] dark:text-[#E5B94F]"
                  >
                    Explore projects
                    <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                  </Link>
                </motion.article>
              );
            })}
          </motion.div>
        </div>
      </section>

      {/* 4. WHY BIGGOHOMES */}
      <section className="border-y border-[#E5E9F0] bg-[#F5F7FA] px-4 py-20 dark:border-[#263A56] dark:bg-[#0D1B32] sm:px-6 lg:px-8 lg:py-28">
        <div className="mx-auto max-w-7xl">
          <SectionHeading
            eyebrow="Why BiggoHomes"
            title="A clearer way to explore property investment."
            description="Give investors the information they need to understand each opportunity, its structure and its associated risks."
          />

          <motion.div
            className="grid gap-5 md:grid-cols-2"
            initial="hidden"
            whileInView="visible"
            viewport={viewportOptions}
            variants={staggerContainer}
          >
            {reasons.map((reason) => (
              <motion.article
                key={reason.num}
                variants={sectionAnimation}
                className="flex items-start gap-6 rounded-2xl border border-[#E5E9F0] bg-white p-7 shadow-sm dark:border-[#263A56] dark:bg-[#10213B] sm:p-9"
              >
                <span className="text-3xl font-bold text-[#D9A52E] sm:text-4xl">{reason.num}</span>
                <div>
                  <h3 className="text-lg font-semibold text-[#0B1F4B] dark:text-white sm:text-xl">
                    {reason.title}
                  </h3>
                  <p className="mt-3 text-sm leading-7 text-[#718096] dark:text-slate-300">
                    {reason.description}
                  </p>
                </div>
              </motion.article>
            ))}
          </motion.div>
        </div>
      </section>

      {/* 5. HOW IT WORKS */}
      <section className="px-4 py-20 sm:px-6 lg:px-8 lg:py-28">
        <div className="mx-auto max-w-7xl">
          <SectionHeading
            centered
            eyebrow="The process"
            title="From property opportunity to investor reporting."
            description="A simple overview of how an investor may engage with a BiggoHomes opportunity."
          />

          <motion.div
            className="grid gap-8 md:grid-cols-3"
            initial="hidden"
            whileInView="visible"
            viewport={viewportOptions}
            variants={staggerContainer}
          >
            {[
              { number: "01", title: "Explore", text: "Review available properties, project information, investment terms and risk disclosures." },
              { number: "02", title: "Understand & subscribe", text: "Complete the required investor checks and subscription process for an eligible opportunity." },
              { number: "03", title: "Track & receive updates", text: "Follow project progress and view distribution records or investor reports when available." },
            ].map((step) => (
              <motion.div
                key={step.number}
                variants={sectionAnimation}
                className="relative rounded-2xl border border-[#E5E9F0] bg-white p-8 dark:border-[#263A56] dark:bg-[#0D1B32]"
              >
                <span className="text-sm font-bold tracking-[0.2em] text-[#B78319] dark:text-[#E5B94F]">
                  STEP {step.number}
                </span>
                <h3 className="mt-5 text-2xl font-semibold text-[#0B1F4B] dark:text-white">{step.title}</h3>
                <p className="mt-3 text-sm leading-7 text-[#718096] dark:text-slate-400">{step.text}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      <section>
        <InvestmentCorridorsSection />
      </section>

      {/* 6. FINAL CALL TO ACTION */}
      <section className="px-4 py-20 text-center sm:px-6 lg:px-8 lg:py-28 bg-[#F5F7FA] dark:bg-[#071326] border-t border-[#E5E9F0] dark:border-[#263A56]">
        <Reveal className="mx-auto max-w-3xl">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#B78319] dark:text-[#E5B94F]">
            Start with the right information
          </p>
          <h2 className="mt-4 text-3xl font-bold tracking-tight text-[#0B1F4B] dark:text-white sm:text-5xl">
            Explore real estate investment opportunities with BiggoHomes.
          </h2>
          <p className="mx-auto mt-5 max-w-2xl leading-8 text-[#718096] dark:text-slate-300">
            Discover our projects, understand the investment terms and decide
            whether an opportunity aligns with your investment objectives.
          </p>

          <div className="mt-9 flex flex-col justify-center gap-4 sm:flex-row">
            <Link
              to="/auth"
              className="inline-flex items-center justify-center gap-3 rounded-full bg-[#0B1F4B] px-8 py-4 font-semibold text-white transition hover:-translate-y-1 hover:bg-[#193866] dark:bg-[#D9A52E] dark:text-[#071326] dark:hover:bg-[#E5B94F]"
            >
              Create an account
              <ArrowRight className="h-5 w-5" />
            </Link>
            <Link
              to="/properties"
              className="inline-flex items-center justify-center gap-3 rounded-full border border-[#0B1F4B]/20 px-8 py-4 font-semibold text-[#0B1F4B] transition hover:-translate-y-1 hover:border-[#D9A52E] dark:border-white/20 dark:text-white"
            >
              Browse properties
            </Link>
          </div>
        </Reveal>
      </section>
    </main>
  );
  
}



