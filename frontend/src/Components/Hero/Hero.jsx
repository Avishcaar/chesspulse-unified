import React, { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowUpRight } from "lucide-react";
import gsap from "gsap";
import GrandmasterCenterpiece from "./GrandmasterCenterpiece";
import ArenaSwitcher from "./ArenaSwitcher";
import "./hero.css";

const ARENA_THEMES = {
  classic: {
    inner: "#15392f",
    mid: "#15221f",
    outer: "#111318",
    accent: "#10b981",
  },
  blitz: {
    inner: "#4a1824",
    mid: "#24161c",
    outer: "#111318",
    accent: "#f43f5e",
  },
  gold: {
    inner: "#49311d",
    mid: "#241d18",
    outer: "#111318",
    accent: "#d6a34a",
  },
};

const Hero = () => {
  const [currentArena, setCurrentArena] = useState(() =>
    typeof document === "undefined" ? "blitz" : document.body.dataset.arena || "blitz"
  );
  const centerpieceRef = useRef(null);

  useEffect(() => {
    document.body.dataset.arena = currentArena;
  }, [currentArena]);

  const handleSelectArena = (arenaId) => {
    if (arenaId === currentArena) return;

    const theme = ARENA_THEMES[arenaId];
    const heroEl = document.querySelector(".hero-root");
    document.body.dataset.arena = arenaId;

    if (window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches) {
      setCurrentArena(arenaId);
      return;
    }

    if (heroEl && theme) {
      gsap.to(heroEl, {
        "--hero-bg-inner": theme.inner,
        "--hero-bg-mid": theme.mid,
        duration: 0.65,
        ease: "power2.out",
      });
    }

    if (centerpieceRef.current?.triggerSpin) {
      centerpieceRef.current.triggerSpin(() => setCurrentArena(arenaId));
    } else {
      setCurrentArena(arenaId);
    }
  };

  return (
    <div className={`hero-root arena-theme-${currentArena}`}>
      <section className="hero-section" id="hero-stage-section">
        <div className="hero-coordinate-grid" aria-hidden="true" />

        <div className="hero-inner">
          <div className="hero-left">
            <p className="hero-kicker">
              <span className="hero-kicker-mark" aria-hidden="true" />
              Play, study, improve
            </p>

            <h1 className="hero-title">
              Find your move.
              <br />
              Understand why.
            </h1>

            <p className="hero-description">
              Analyze with Stockfish. Follow live speed chess. Practice against
              opponents tuned to your level.
            </p>

            <div className="hero-actions">
              <Link to="/play/online" className="hero-action hero-action-primary">
                <span>Play online</span>
                <ArrowUpRight size={17} strokeWidth={2} />
              </Link>
              <Link to="/analysis" className="hero-action hero-action-secondary">
                Analyze a position
              </Link>
            </div>

            <ArenaSwitcher
              currentArena={currentArena}
              onSelectArena={handleSelectArena}
            />

            <div className="hero-capabilities" aria-label="ChessPulse features">
              <span>Engine analysis</span>
              <span>Live games</span>
              <span>AI practice</span>
            </div>
          </div>

          <div className="hero-right">
            <div className="hero-art-stage">
              <div className="hero-stage-halo" aria-hidden="true" />
              <div className="hero-stage-grid" aria-hidden="true" />
              <div className="hero-stage-heading">
                <span>ChessPulse</span>
                <span>Play · Study · Spar</span>
              </div>

              <GrandmasterCenterpiece
                ref={centerpieceRef}
                currentArena={currentArena}
              />

              <div className="hero-stage-caption">
                <span className="hero-stage-caption-mark" aria-hidden="true">e4</span>
                <span>One board. Many ways to get better.</span>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Hero;
