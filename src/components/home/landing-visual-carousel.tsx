"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "motion/react";

const slides = [
  {
    src: "https://images.unsplash.com/photo-1544531586-fde5298cdd40?auto=format&fit=crop&w=1600&q=80",
    alt: "Speaker presenting to an audience at a live event",
  },
  {
    src: "https://images.unsplash.com/photo-1540575467063-178a50c2df87?auto=format&fit=crop&w=1600&q=80",
    alt: "Audience seated in a presentation room during a speaking session",
  },
  {
    src: "https://images.unsplash.com/photo-1594122230689-45899d9e6f69?auto=format&fit=crop&w=1600&q=80",
    alt: "Attendees listening during a professional speaking event",
  },
];

const locations = [
  "Abuja City",
  "Wuse Zone 5",
  "Wuse 2",
  "Central Business District",
];

export function LandingVisualCarousel() {
  const [activeIndex, setActiveIndex] = useState(0);
  const [locationIndex, setLocationIndex] = useState(0);

  useEffect(() => {
    const intervalId = window.setInterval(() => {
      setActiveIndex((current) => (current + 1) % slides.length);
    }, 4500);

    return () => window.clearInterval(intervalId);
  }, []);

  useEffect(() => {
    const intervalId = window.setInterval(() => {
      setLocationIndex((current) => (current + 1) % locations.length);
    }, 2200);

    return () => window.clearInterval(intervalId);
  }, []);

  return (
    <section className="relative h-full min-h-[24rem] overflow-hidden bg-[#ece8e1] lg:min-h-[40rem]">
      <AnimatePresence mode="wait">
        <motion.img
          key={slides[activeIndex].src}
          src={slides[activeIndex].src}
          alt={slides[activeIndex].alt}
          className="absolute inset-0 h-full w-full object-cover"
          initial={{ opacity: 0, scale: 1.035 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.985 }}
          transition={{ duration: 0.75, ease: [0.22, 1, 0.36, 1] }}
        />
      </AnimatePresence>

      <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(255,255,255,0.06),rgba(17,19,24,0.14))]" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_18%_18%,rgba(255,255,255,0.38),transparent_26%)]" />

      <div className="absolute inset-x-0 bottom-0 flex items-center justify-between gap-4 p-5 sm:p-6">
        <div className="inline-flex items-center rounded-full border border-white/50 bg-white/66 px-3 py-1.5 text-[11px] font-medium tracking-[0.22em] text-zinc-700 uppercase backdrop-blur">
          <span className="text-zinc-500">Toast Masters -</span>
          <AnimatePresence mode="wait">
            <motion.span
              key={locations[locationIndex]}
              initial={{ opacity: 0, y: 8, filter: "blur(6px)" }}
              animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
              exit={{ opacity: 0, y: -8, filter: "blur(6px)" }}
              transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
              className="ml-1 text-zinc-900"
            >
              {locations[locationIndex]}
            </motion.span>
          </AnimatePresence>
        </div>

        <div className="flex items-center gap-2 rounded-full border border-white/50 bg-white/70 px-3 py-2 backdrop-blur">
          {slides.map((slide, index) => (
            <button
              key={slide.alt}
              type="button"
              aria-label={`Show image ${index + 1}`}
              aria-pressed={index === activeIndex}
              onClick={() => setActiveIndex(index)}
              className={`h-2.5 rounded-full transition-all ${
                index === activeIndex
                  ? "w-9 bg-zinc-900"
                  : "w-2.5 bg-zinc-500/35 hover:bg-zinc-700/50"
              }`}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
