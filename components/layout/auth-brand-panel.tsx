"use client";

import Image from "next/image";
import { useEffect, useRef, useState, type KeyboardEvent } from "react";
import { BrandMark } from "./brand-mark";

const slides = [
  {
    id: "collaboration",
    title: "Your franchise pipeline, connected.",
    description: "Bring leads, meetings and approvals into one clear view for your team.",
    image: "/illustrations/crm-collaboration-refined.png",
    label: "Franchise collaboration",
  },
  {
    id: "security",
    title: "Secure access for your team",
    description: "An extra verification step helps protect your accounts and franchise data.",
    image: "/illustrations/account-security.png",
    label: "Account protection",
  },
] as const;

export function AuthBrandPanel() {
  const [active, setActive] = useState(0);
  const [cycle, setCycle] = useState(0);
  const [canAnimate, setCanAnimate] = useState(false);
  const [isVisible, setIsVisible] = useState(true);
  const [hovered, setHovered] = useState(false);
  const [focused, setFocused] = useState(false);
  const tabs = useRef<Array<HTMLButtonElement | null>>([]);
  const running = canAnimate && isVisible && !hovered && !focused;

  useEffect(() => {
    const motion = window.matchMedia("(min-width: 901px) and (prefers-reduced-motion: no-preference)");
    const syncMotion = () => setCanAnimate(motion.matches);
    const syncVisibility = () => setIsVisible(!document.hidden);
    syncMotion();
    syncVisibility();
    motion.addEventListener("change", syncMotion);
    document.addEventListener("visibilitychange", syncVisibility);
    return () => {
      motion.removeEventListener("change", syncMotion);
      document.removeEventListener("visibilitychange", syncVisibility);
    };
  }, []);

  function selectSlide(index: number) {
    setActive(index);
    setCycle(value => value + 1);
  }

  function move(event: KeyboardEvent<HTMLButtonElement>) {
    let next = active;
    if (event.key === "ArrowRight") next = (active + 1) % slides.length;
    else if (event.key === "ArrowLeft") next = (active + slides.length - 1) % slides.length;
    else if (event.key === "Home") next = 0;
    else if (event.key === "End") next = slides.length - 1;
    else return;
    event.preventDefault();
    selectSlide(next);
    tabs.current[next]?.focus();
  }

  return <aside className="auth-brand-panel" aria-label="About iFranchise CRM">
    <div className="auth-brand-heading"><BrandMark /></div>
    <div className="brand-carousel" data-running={running}
      onMouseEnter={() => setHovered(true)} onMouseLeave={() => setHovered(false)}
      onFocusCapture={() => setFocused(true)}
      onBlurCapture={event => {
        if (!event.currentTarget.contains(event.relatedTarget)) setFocused(false);
      }}>
      <div className="brand-slides">
        {slides.map((slide, index) => <section
          key={slide.id}
          id={`brand-slide-${slide.id}`}
          className={`brand-slide${index === active ? " is-active" : ""}`}
          role="tabpanel"
          aria-labelledby={`brand-tab-${slide.id}`}
          aria-hidden={index !== active}
          inert={index !== active}
        >
          <div className="brand-slide-art" aria-hidden="true">
            <Image src={slide.image} alt="" width={1254} height={1254} sizes="(min-width: 1044px) 400px, (min-width: 901px) calc(46vw - 80px), 1px" />
          </div>
          <div className="brand-slide-copy"><h2>{slide.title}</h2><p>{slide.description}</p></div>
        </section>)}
      </div>
      <div className="brand-slide-controls" role="tablist" aria-label="Explore iFranchise">
        {slides.map((slide, index) => <button
          key={slide.id}
          ref={element => { tabs.current[index] = element; }}
          id={`brand-tab-${slide.id}`}
          type="button"
          role="tab"
          aria-label={slide.label}
          aria-selected={active === index}
          aria-controls={`brand-slide-${slide.id}`}
          tabIndex={active === index ? 0 : -1}
          onClick={() => selectSlide(index)}
          onKeyDown={move}
        ><span className="brand-slide-track">
          {index === active && <span key={cycle} className={`brand-slide-progress${canAnimate ? " is-animated" : ""}`}
            onAnimationEnd={event => {
              // The fill and slide advance share one clock, including pause/resume.
              if (event.animationName === "brand-slide-fill" && running) selectSlide((index + 1) % slides.length);
            }} />}
        </span></button>)}
      </div>
    </div>
  </aside>;
}
