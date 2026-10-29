import React, { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { ChevronDown, ArrowRight } from "lucide-react";
import { useGsapChapterReveal } from "../../utils/useGsapReveal";
import CinematicChessBackground from "./CinematicChessBackground";
import "./chess-art-cinematic.css";

// Register ScrollTrigger safely
if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

// 4 Convergence Assembly Phases (Educational Chess Foundations)
const CONVERGENCE_PHASES = [
  {
    id: "board-geometry",
    phaseNum: "01",
    tag: "FOUNDATIONS",
    title: "The 64 Squares",
    caption:
      "Every chess position unfolds across 64 alternating light and dark squares: 8 ranks, 8 files, and 26 intersecting diagonals.",
  },
  {
    id: "piece-corps",
    phaseNum: "02",
    tag: "THE ARMY",
    title: "Six Unique Movements",
    caption:
      "Pawns march forward, Knights leap in L-shapes, Bishops sweep diagonals, Rooks rule files, and Queens command all directions.",
  },
  {
    id: "strategy-center",
    phaseNum: "03",
    tag: "TACTICS",
    title: "Center Control & Safety",
    caption:
      "Occupy central squares (e4, d4, e5, d5), develop minor pieces swiftly, and castle your King into safety.",
  },
  {
    id: "academy-curriculum",
    phaseNum: "04",
    tag: "ACADEMY",
    title: "Piece Discovery",
    caption:
      "Explore fundamental piece movements and launch directly into your dedicated Academy lesson.",
  },
];

// Helper: Cubic Ease Out for weighted physical docking
function easeOutCubic(t) {
  return 1 - Math.pow(1 - t, 3);
}

export default function ChessArtCinematic() {
  const [scrollPhaseIndex, setScrollPhaseIndex] = useState(0);
  const targetProgressRef = useRef(0);
  const currentProgressRef = useRef(0);
  const lastPhaseIndexRef = useRef(0);

  // Element Refs
  const chapterRef = useGsapChapterReveal();
  const sectionRef = useRef(null);
  const pinContainerRef = useRef(null);
  const stageRef = useRef(null);
  const bgLayerRef = useRef(null);
  const boardLayerRef = useRef(null);
  const boyLayerRef = useRef(null);
  const grandpaLayerRef = useRef(null);
  const stInstanceRef = useRef(null);

  const mouseRef = useRef({ x: 0, y: 0, currentX: 0, currentY: 0 });

  const currentPhase =
    CONVERGENCE_PHASES[scrollPhaseIndex] || CONVERGENCE_PHASES[0];

  // 1. GSAP ScrollTrigger Setup: Smooth Pinning
  useEffect(() => {
    if (!sectionRef.current) return;

    const timer = setTimeout(() => {
      if (!sectionRef.current) return;

      const pinTarget = pinContainerRef.current || sectionRef.current;
      const st = ScrollTrigger.create({
        trigger: sectionRef.current,
        pin: pinTarget,
        start: "top 88px",
        end: "+=1600", // 1600px of smooth scrub travel
        scrub: 0.6,
        anticipatePin: 1,
        invalidateOnRefresh: true,
        onUpdate: (self) => {
          targetProgressRef.current = self.progress;
        },
      });

      stInstanceRef.current = st;
      try {
        ScrollTrigger.refresh();
      } catch {
        // ignore
      }
    }, 120);

    return () => {
      clearTimeout(timer);
      if (stInstanceRef.current) {
        stInstanceRef.current.kill(true);
        stInstanceRef.current = null;
        try {
          ScrollTrigger.refresh();
        } catch {
          // ignore
        }
      }
    };
  }, []);

  // 2. 60 FPS Render Loop (Convergence Docking + 2.5D Parallax)
  useEffect(() => {
    let breathTime = 0;
    let animId = null;

    const renderLoop = () => {
      breathTime += 0.015;

      // Mouse position smoothing (lerp)
      const m = mouseRef.current;
      m.currentX += (m.x - m.currentX) * 0.06;
      m.currentY += (m.y - m.currentY) * 0.06;

      const breathX = Math.sin(breathTime * 0.7) * 0.035;
      const breathY = Math.cos(breathTime * 0.5) * 0.035;

      const totalMouseX = m.currentX + breathX;
      const totalMouseY = m.currentY + breathY;

      // Exponential spring lerp for silky progression
      currentProgressRef.current +=
        (targetProgressRef.current - currentProgressRef.current) * 0.085;
      const curP = currentProgressRef.current;

      const bg = bgLayerRef.current;
      const board = boardLayerRef.current;
      const boy = boyLayerRef.current;
      const grandpa = grandpaLayerRef.current;

      // Docking occurs from 0.0 to 0.85; remaining 0.85-1.0 is unified 2.5D optical parallax
      const normP = Math.min(1.0, curP / 0.85);
      const t = easeOutCubic(normP); // 0.0 -> 1.0 (converged)
      const isFullyAssembled = normP >= 0.98;

      // Subtle mouse parallax depth
      const pMouseX = totalMouseX * 1.0;
      const pMouseY = totalMouseY * 1.0;

      // Base stage camera
      if (stageRef.current) {
        const stageRotY = pMouseX * 4.5;
        const stageRotX = -pMouseY * 3.5;
        stageRef.current.style.transform = `
          translate3d(0, 0, 0)
          rotateX(${stageRotX}deg)
          rotateY(${stageRotY}deg)
          scale(${1.01 + 0.03 * t})
        `;
        if (isFullyAssembled) {
          stageRef.current.classList.add("is-fully-docked");
        } else {
          stageRef.current.classList.remove("is-fully-docked");
        }
      }

      // Layer 0: Creative Animated Canvas Background (drifts in deep parallax)
      if (bg) {
        bg.style.transform = `translate3d(${-pMouseX * 10}px, ${-pMouseY * 8}px, -35px)`;
      }

      // Layer 1: Chessboard emerges from the CENTER-BOTTOM — BEHIND the characters (15px z-depth)
      if (board) {
        const boardY = 28 * (1 - t);
        const boardRotX = 12 * (1 - t);
        const boardOpacity = Math.min(1, 0.15 + 2.5 * normP);
        board.style.transform = `
          translate3d(${pMouseX * 8}px, calc(${boardY}% + ${-pMouseY * 10}px), ${15 + 15 * (1 - t)}px)
          rotateX(${boardRotX}deg)
        `;
        board.style.opacity = boardOpacity;
      }

      // Layer 2: Boy comes from the LEFT (-48% to -18%) — stops earlier on left flank
      if (boy) {
        const boyX = -18 - 30 * (1 - t);
        const boyRotY = 12 * (1 - t);
        const boyOpacity = Math.min(1, 0.15 + 2.5 * normP);
        boy.style.transform = `
          translate3d(calc(${boyX}% + ${pMouseX * 10}px), ${pMouseY * 8}px, ${35 + 25 * (1 - t)}px)
          rotateY(${boyRotY}deg)
        `;
        boy.style.opacity = boyOpacity;
      }

      // Layer 3: Chess Grandpa comes from the RIGHT (+48% to +30%) — moves 50% less inward
      if (grandpa) {
        const gpX = 30 + 18 * (1 - t);
        const gpRotY = -10 * (1 - t);
        const gpOpacity = Math.min(1, 0.15 + 2.5 * normP);
        grandpa.style.transform = `
          translate3d(calc(${gpX}% + ${pMouseX * 12}px), ${pMouseY * 9}px, ${45 + 25 * (1 - t)}px)
          rotateY(${gpRotY}deg)
        `;
        grandpa.style.opacity = gpOpacity;
      }

      // Determine current narrative phase (0 to 3)
      let phase = 0;
      if (curP >= 0.82) phase = 3;
      else if (curP >= 0.52) phase = 2;
      else if (curP >= 0.22) phase = 1;

      if (phase !== lastPhaseIndexRef.current) {
        lastPhaseIndexRef.current = phase;
        setScrollPhaseIndex(phase);
      }

      animId = requestAnimationFrame(renderLoop);
    };

    animId = requestAnimationFrame(renderLoop);
    return () => cancelAnimationFrame(animId);
  }, []);

  // Mouse Move Handler for 2.5D Optical Parallax
  const handleMouseMove = (e) => {
    if (!stageRef.current) return;
    const rect = stageRef.current.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    const nx = Math.max(-1, Math.min(1, (e.clientX - cx) / (rect.width / 2)));
    const ny = Math.max(-1, Math.min(1, (e.clientY - cy) / (rect.height / 2)));
    mouseRef.current.x = nx;
    mouseRef.current.y = ny;
  };

  const handleMouseLeave = () => {
    mouseRef.current.x = 0;
    mouseRef.current.y = 0;
  };

  const isFullyDocked = currentProgressRef.current >= 0.82;

  return (
    <section
      id="art-cinema"
      ref={sectionRef}
      className="cp-art-cinema-section is-blended-assembly"
    >
      <div ref={pinContainerRef} className="cp-art-cinema-pin-stage w-full">
        <div className="cp-art-cinema-container">
          {/* Chapter Header */}
          <div className="cp-chapter-header is-centered" ref={chapterRef}>
            <div className="cp-chapter-meta">
              <span className="cp-chapter-index">
                <span className="cp-chapter-index-dot" />
                ACADEMY
              </span>
              <span className="cp-chapter-subtag">PIECE DISCOVERY</span>
            </div>
            <div className="cp-chapter-main">
              <h2 className="cp-chapter-title">
                Learn Chess:{" "}
                <span className="art-italic cp-chapter-title-accent">
                  The Interactive Board
                </span>
              </h2>
              <p className="cp-chapter-desc">
                Scroll down to explore piece movement and launch interactive lessons.
              </p>
            </div>
          </div>

          {/* Master Seamless Exhibition Frame (Embedded Directly into Background) */}
          <div
            className="art-stage-viewport"
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
          >
            {/* 3D Perspective Stage */}
            <div className="art-perspective-wrapper">
              <div
                ref={stageRef}
                className="art-3d-stage"
              >
                {/* LAYER 0: Atelier Atmosphere (Volumetric God Rays, Perspective Grid & Tactical Vectors) */}
                <div ref={bgLayerRef} className="art-layer art-layer-bg">
                  <CinematicChessBackground mouseRef={mouseRef} />
                </div>

                {/* LAYER 1: The Chessboard & Table - Emerges from BOTTOM (BEHIND characters) */}
                <div ref={boardLayerRef} className="art-layer art-layer-board">
                  <picture>
                    <source srcSet="/assets/art/chessboard.webp" type="image/webp" />
                    <img
                      src="/assets/art/chessboard.png"
                      alt="The Chessboard and Staunton Pieces"
                      className="art-img"
                      loading="eager"
                    />
                  </picture>
                </div>

                {/* LAYER 2: The Boy (Challenger Cutout) - Enters from LEFT */}
                <div ref={boyLayerRef} className="art-layer art-layer-boy">
                  <picture>
                    <source srcSet="/assets/art/chessboy.webp" type="image/webp" />
                    <img
                      src="/assets/art/chessboy.png"
                      alt="The Challenger (Boy Cutout)"
                      className="art-img"
                      loading="eager"
                    />
                  </picture>
                </div>

                {/* LAYER 3: The Chess Grandpa (Teacher Cutout) - Enters from RIGHT */}
                <div ref={grandpaLayerRef} className="art-layer art-layer-grandpa">
                  <picture>
                    <source srcSet="/assets/art/chessgrandpa.webp" type="image/webp" />
                    <img
                      src="/assets/art/chessgrandpa.png"
                      alt="The Chess Mentor (Grandpa Cutout)"
                      className="art-img"
                      loading="eager"
                    />
                  </picture>
                </div>

                {/* Atmospheric Light Motes */}
                <div className="art-motes-overlay" aria-hidden="true">
                  <span className="mote mote-1" />
                  <span className="mote mote-2" />
                  <span className="mote mote-3" />
                  <span className="mote mote-4" />
                  <span className="mote mote-5" />
                </div>
              </div>
            </div>

            {/* Floating Minimal Transparent Narrative & Pawn Action */}
            <div className="art-scene-caption">
              {!isFullyDocked ? (
                <div className="art-minimal-card">
                  <span className="art-caption-phase">
                    {currentPhase.tag} · {currentPhase.phaseNum} OF 04
                  </span>
                  <h3 className="art-caption-title">{currentPhase.title}</h3>
                  <p className="art-caption-text">{currentPhase.caption}</p>
                </div>
              ) : (
                <div className="art-minimal-card is-docked">
                  <h3 className="art-caption-title">The Pawn</h3>
                  <p className="art-caption-text">
                    Marches 1 square forward, captures diagonally.
                  </p>
                  <div className="art-minimal-actions">
                    <Link
                      to="/academy?step=2"
                      className="art-minimal-btn-primary"
                    >
                      <span>Start Pawn Lesson</span>
                      <ArrowRight size={15} />
                    </Link>
                    <Link
                      to="/academy"
                      className="art-minimal-btn-secondary"
                    >
                      <span>Full Course</span>
                    </Link>
                  </div>
                </div>
              )}
            </div>

            {/* Initial Subtle Scroll Prompt */}
            {currentProgressRef.current < 0.06 && (
              <div className="art-scroll-prompt">
                <div className="prompt-mouse">
                  <div className="prompt-wheel" />
                </div>
                <span className="prompt-text">
                  Scroll to explore piece movement
                </span>
                <ChevronDown size={14} className="prompt-chevron" />
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
