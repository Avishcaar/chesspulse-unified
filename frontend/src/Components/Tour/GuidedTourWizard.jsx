import React, { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import "./guided-tour-wizard.css";

export const CHESS_TOUR_STEPS = [
  {
    id: "hero-stage",
    targetId: "hero-stage-section",
    title: "Interactive 3D Stage",
    description: "Staunton diorama with real-time cursor physics.",
    techStack: ["GSAP 3", "Canvas 2D", "CSS 3D"],
    highlights: ["720° spin physics", "Sub-pixel particles", "Dynamic themes"],
  },
  {
    id: "art-cinema",
    targetId: "art-cinema",
    title: "Living Canvas Art",
    description: "Scroll-driven visual board convergence.",
    techStack: ["GSAP ScrollTrigger", "SVG Vectors"],
    highlights: ["Scrubbed timeline", "Cubic easing", "Depth veils"],
  },
  {
    id: "eval-engine",
    targetId: "eval-analysis-section",
    title: "Stockfish 17 Analysis",
    description: "Grandmaster depth-22 in-browser evaluation.",
    techStack: ["Stockfish 17 WASM", "Web Workers", "chess.js"],
    highlights: ["NNUE networks", "Zero server lag", "UCI protocol"],
  },
  {
    id: "live-broadcasts",
    targetId: "live-broadcasts-section",
    title: "Speed Chess Live",
    description: "Spectate live Bullet, Blitz, and Rapid games from Lichess TV.",
    techStack: ["Lichess TV API", "Game stream API", "Live clock sync"],
    highlights: ["Live board updates", "Clock sync", "Move sound FX"],
  },
  {
    id: "world-standings",
    targetId: "world-grandmaster-standings",
    title: "World Grandmaster Standings",
    description: "Explore live rating tables collected from 2700chess.com and normalized by the ChessPulse API.",
    techStack: ["Web scraping", "2700chess JSON feed", "Express API", "15-minute cache"],
    highlights: ["Standard, rapid, and blitz", "Category filters", "Fallback standings"],
  },
  {
    id: "multiplayer",
    targetId: "nav-link-play",
    mobileTargetId: "mobile-nav-link-play",
    title: "Multiplayer Battles",
    description: "Real-time P2P chess matchmaking.",
    techStack: ["WebSockets", "Socket.io", "Optimistic UI"],
    highlights: ["Sub-20ms latency", "Clock drift sync", "Spectator rooms"],
  },
  {
    id: "voice-academy",
    targetId: "nav-link-academy",
    mobileTargetId: "mobile-nav-link-academy",
    title: "Voice Chess Academy",
    description: "Interactive drills narrated with your device's built-in speech voices.",
    techStack: ["Web Speech API", "Browser text-to-speech"],
    highlights: ["No microphone required", "2D camera POV", "Move verification"],
  },
  {
    id: "sparring-bots",
    targetId: "nav-link-bots",
    mobileTargetId: "mobile-nav-link-bots",
    title: "Calibrated Sparring Bots",
    description: "7 specialized AI bots rated from 400 to 2400 ELO.",
    techStack: ["Depth Throttling", "Elo Heuristics"],
    highlights: ["Club-strength bots", "Error simulation", "Custom styles"],
  },
  {
    id: "tournaments",
    targetId: "nav-link-tournaments",
    mobileTargetId: "mobile-nav-link-tournaments",
    title: "Live Tournaments",
    description: "Browse tournament rounds, follow featured games, and inspect live or completed boards.",
    techStack: ["Tournament data feeds", "Round-based navigation", "PGN replay"],
    highlights: ["Tournament schedules", "Live game boards", "Round results"],
  },
];

function getStepTarget(step) {
  const isMobileViewport = typeof window !== "undefined"
    && window.matchMedia?.("(max-width: 960px)").matches;
  const isMobileNavTarget = Boolean(isMobileViewport && step?.mobileTargetId);
  const targetId = isMobileNavTarget ? step.mobileTargetId : step?.targetId;
  return {
    element: targetId ? document.getElementById(targetId) : null,
    isMobileNavTarget,
  };
}

export default function GuidedTourWizard() {
  const [isOpen, setIsOpen] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [targetRect, setTargetRect] = useState(null);
  const navigate = useNavigate();
  const location = useLocation();

  // Listen for global custom event to open tour from Navbar or Banner
  useEffect(() => {
    const handleOpen = () => {
      if (location.pathname !== "/") {
        navigate("/");
        setTimeout(() => {
          setCurrentStep(0);
          setIsOpen(true);
        }, 300);
      } else {
        setCurrentStep(0);
        setIsOpen(true);
      }
    };

    window.addEventListener("open-guided-tour", handleOpen);
    return () => window.removeEventListener("open-guided-tour", handleOpen);
  }, [location.pathname, navigate]);

  // Lock manual user scrolling when tour is open so user stays focused
  useEffect(() => {
    if (!isOpen) return;

    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const preventScroll = (e) => {
      // Don't intercept clicks or events inside the tour card
      if (e.target.closest && e.target.closest(".tour-popover-card")) return;
      e.preventDefault();
    };

    window.addEventListener("wheel", preventScroll, { passive: false });
    window.addEventListener("touchmove", preventScroll, { passive: false });

    return () => {
      document.body.style.overflow = originalOverflow;
      window.removeEventListener("wheel", preventScroll);
      window.removeEventListener("touchmove", preventScroll);
    };
  }, [isOpen]);

  // Measure and track target DOM element for spotlight cutout
  const measureTarget = useCallback(() => {
    if (!isOpen) return;
    const step = CHESS_TOUR_STEPS[currentStep];
    if (!step?.targetId) return;

    const { element: el } = getStepTarget(step);
    if (!el) {
      setTargetRect(null);
      return;
    }

    const rect = el.getBoundingClientRect();
    const isNavBtn = el.offsetHeight < 65;
    const padding = isNavBtn ? 8 : 12;

    const x = Math.max(8, rect.left - padding);
    const y = Math.max(8, rect.top - padding);
    const width = Math.min(window.innerWidth - 16, rect.width + padding * 2);
    const height = rect.height + padding * 2;
    const borderRadius = isNavBtn ? 14 : 20;

    setTargetRect({
      x,
      y,
      width,
      height,
      borderRadius,
    });
  }, [isOpen, currentStep]);

  useEffect(() => {
    const step = CHESS_TOUR_STEPS[currentStep];
    const { isMobileNavTarget } = getStepTarget(step);
    window.dispatchEvent(new CustomEvent("guided-tour-mobile-nav", {
      detail: { open: Boolean(isOpen && isMobileNavTarget) },
    }));
  }, [isOpen, currentStep]);

  // Scroll target element into view smoothly whenever current step changes
  useEffect(() => {
    if (!isOpen) return;
    const step = CHESS_TOUR_STEPS[currentStep];
    if (!step?.targetId) return;

    const { element: el } = getStepTarget(step);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "center" });
      measureTarget();
      const t1 = setTimeout(measureTarget, 120);
      const t2 = setTimeout(measureTarget, 350);
      const t3 = setTimeout(measureTarget, 650);
      return () => {
        clearTimeout(t1);
        clearTimeout(t2);
        clearTimeout(t3);
      };
    }
  }, [isOpen, currentStep, measureTarget]);

  // Dynamic continuous tracking on resize
  useEffect(() => {
    if (!isOpen) return;

    const handleResize = () => {
      const step = CHESS_TOUR_STEPS[currentStep];
      const { isMobileNavTarget } = getStepTarget(step);
      window.dispatchEvent(new CustomEvent("guided-tour-mobile-nav", {
        detail: { open: Boolean(isMobileNavTarget) },
      }));
      measureTarget();
      window.setTimeout(measureTarget, 400);
    };

    window.addEventListener("resize", handleResize, { passive: true });
    return () => window.removeEventListener("resize", handleResize);
  }, [isOpen, measureTarget]);

  // Keyboard navigation: Escape to skip/end, ArrowRight / Enter for next, ArrowLeft for back
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e) => {
      if (e.key === "Escape") {
        handleDismiss();
      } else if (e.key === "ArrowRight" || e.key === "Enter") {
        handleNext();
      } else if (e.key === "ArrowLeft") {
        handlePrev();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, currentStep]);

  const handleNext = () => {
    if (currentStep < CHESS_TOUR_STEPS.length - 1) {
      setCurrentStep((prev) => prev + 1);
    } else {
      handleDismiss();
    }
  };

  const handlePrev = () => {
    if (currentStep > 0) {
      setCurrentStep((prev) => prev - 1);
    }
  };

  const handleDismiss = () => {
    window.dispatchEvent(new CustomEvent("guided-tour-mobile-nav", { detail: { open: false } }));
    try {
      localStorage.setItem("chesspulse_tour_completed", "true");
    } catch (_) {}
    setIsOpen(false);
  };

  if (!isOpen) return null;

  const step = CHESS_TOUR_STEPS[currentStep];
  const isFinalStep = currentStep === CHESS_TOUR_STEPS.length - 1;
  const isMobileNavStep = Boolean(
    step.mobileTargetId && window.matchMedia?.("(max-width: 960px)").matches
  );
  const mobilePopoverAtTop = isMobileNavStep && targetRect
    ? targetRect.y + targetRect.height / 2 > window.innerHeight / 2
    : false;

  return (
    <div className="tour-overlay-portal">
      {/* ── 1. Full-Screen Backdrop with SVG Cutout Mask ────────────────────────── */}
      <svg
        className="tour-svg-backdrop"
        onClick={handleDismiss}
        aria-hidden="true"
      >
        <defs>
          <mask id="chess-tour-spotlight-mask">
            {/* White = opaque backdrop */}
            <rect x="0" y="0" width="100%" height="100%" fill="white" />

            {/* Black cutout = transparent hole around target element */}
            {targetRect && (
              <motion.rect
                animate={{
                  x: targetRect.x,
                  y: targetRect.y,
                  width: targetRect.width,
                  height: targetRect.height,
                  rx: targetRect.borderRadius,
                  ry: targetRect.borderRadius,
                }}
                transition={{ type: "spring", damping: 28, stiffness: 350 }}
                fill="black"
              />
            )}
          </mask>
        </defs>

        {/* Darkened overlay applied through mask */}
        <rect
          x="0"
          y="0"
          width="100%"
          height="100%"
          fill="rgba(8, 7, 6, 0.76)"
          mask="url(#chess-tour-spotlight-mask)"
        />
      </svg>

      {/* ── 2. Glowing Spotlight Ring Around Target ───────────────────────────── */}
      {targetRect && (
        <motion.div
          animate={{
            top: targetRect.y,
            left: targetRect.x,
            width: targetRect.width,
            height: targetRect.height,
            borderRadius: targetRect.borderRadius,
          }}
          transition={{ type: "spring", damping: 28, stiffness: 350 }}
          className="tour-spotlight-frame"
        />
      )}

      {/* ── 3. Minimalist Top-Left Fixed HUD Card (Zero Icons, Transparent Glass) ─ */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2 }}
        className={`tour-popover-card ${isMobileNavStep ? "mobile-nav-step" : ""} ${mobilePopoverAtTop ? "mobile-nav-step-top" : ""}`}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-label={`Step ${currentStep + 1}: ${step.title}`}
      >
        {/* Header: Step Counter & Step Dots & End Button */}
        <div className="tour-header-row">
          <span className="tour-step-counter">
            Step {currentStep + 1} of {CHESS_TOUR_STEPS.length}
          </span>

          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
            {/* Step Dot Indicators */}
            <div className="tour-steps-dots">
              {CHESS_TOUR_STEPS.map((s, idx) => (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => setCurrentStep(idx)}
                  className={`tour-dot-btn ${currentStep === idx ? "active" : ""}`}
                  title={`Step ${idx + 1}: ${s.title}`}
                />
              ))}
            </div>

            {/* End Tour Button */}
            <button
              type="button"
              onClick={handleDismiss}
              className="tour-close-text-btn"
              title="End Tour (Esc)"
              aria-label="End Tour"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Body Content */}
        <div className="tour-body-area">
          <h3 className="tour-step-title">{step.title}</h3>
          <p className="tour-step-desc">{step.description}</p>

          {/* Minimal Tech Chips Row */}
          <div className="tour-tech-row">
            <span className="tour-tech-tag-label">Tech:</span>
            {step.techStack.map((tech, idx) => (
              <span key={idx} className="tour-tech-chip">
                {tech}
              </span>
            ))}
          </div>

          {/* Keyword Highlights */}
          <div className="tour-highlights-row">
            {step.highlights.map((item, idx) => (
              <span key={idx} className="tour-highlight-tag">
                {item}
              </span>
            ))}
          </div>
        </div>

        {/* Navigation Footer */}
        <div className="tour-footer-row">
          <button
            type="button"
            onClick={handleDismiss}
            className="tour-skip-btn"
          >
            End Tour
          </button>

          <div className="tour-nav-btns">
            {currentStep > 0 && (
              <button
                type="button"
                onClick={handlePrev}
                className="tour-prev-btn"
              >
                Back
              </button>
            )}

            <button
              type="button"
              onClick={handleNext}
              className="tour-next-btn"
            >
              {isFinalStep ? "Finish" : "Next"}
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
