"use client";

import { useRef } from "react";

import { gsap, useGSAP } from "@/shared/lib/gsap-client";

const RAIL_LINE_REVEAL_END_PX = 140;

export function ScrollRevealHairline({ className }: Readonly<{ className: string }>): React.JSX.Element {
  const lineRef = useRef<HTMLSpanElement>(null);

  useGSAP(() => {
    const line = lineRef.current;
    if (!line) return;

    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reducedMotion) {
      const update = () => gsap.set(line, { autoAlpha: window.scrollY > 0 ? 1 : 0, scaleX: 1 });
      update();
      window.addEventListener("scroll", update, { passive: true });
      return () => window.removeEventListener("scroll", update);
    }

    gsap.set(line, { autoAlpha: 0, scaleX: 0.92, transformOrigin: "50% 50%" });
    const tween = gsap.to(line, {
      autoAlpha: 1,
      scaleX: 1,
      ease: "none",
      scrollTrigger: { start: 0, end: RAIL_LINE_REVEAL_END_PX, scrub: 0.4 },
    });
    return () => tween.kill();
  });

  return <span ref={lineRef} aria-hidden="true" className={className} />;
}
