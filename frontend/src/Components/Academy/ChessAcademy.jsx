import React, { useState, useEffect, useRef, useCallback } from "react";
import { Chess } from "chess.js";
import { Chessboard } from "react-chessboard";
import {
  ChevronLeft,
  ChevronRight,
  Play,
  Pause,
  RotateCcw,
  BookOpen,
  Volume2,
  VolumeX,
  Compass,
  Layers,
  Crown,
  Maximize2,
  CheckCircle2,
  HelpCircle,
  Eye,
  Sliders,
} from "lucide-react";
import { ACADEMY_MODULES, ACADEMY_LESSONS } from "../../data/academyLessons";
import { StauntonPiece } from "../Hero/ChessPiecesSVG";
import { useTheme } from "../../contexts/ThemeContext";
import { playSound } from "../../utils/sounds";
import "./chess-academy.css";

// Square highlight color mapping for the board
const HIGHLIGHT_COLORS = {
  gold: {
    background: "radial-gradient(circle, rgba(212, 175, 55, 0.45) 0%, rgba(212, 175, 55, 0.15) 70%)",
    boxShadow: "inset 0 0 14px rgba(212, 175, 55, 0.6)",
    borderRadius: "4px",
  },
  goldGlow: {
    background: "radial-gradient(circle, rgba(245, 158, 11, 0.6) 0%, rgba(212, 175, 55, 0.25) 75%)",
    boxShadow: "0 0 18px rgba(245, 158, 11, 0.8), inset 0 0 12px rgba(245, 158, 11, 0.5)",
    borderRadius: "6px",
  },
  emerald: {
    background: "radial-gradient(circle, rgba(16, 185, 129, 0.55) 0%, rgba(16, 185, 129, 0.15) 70%)",
    boxShadow: "inset 0 0 12px rgba(16, 185, 129, 0.6)",
    borderRadius: "4px",
  },
  rose: {
    background: "radial-gradient(circle, rgba(244, 63, 94, 0.55) 0%, rgba(244, 63, 94, 0.15) 70%)",
    boxShadow: "inset 0 0 12px rgba(244, 63, 94, 0.6)",
    borderRadius: "4px",
  },
};

export default function ChessAcademy({
  initialLessonId = "pawn",
  onSelectLesson,
  isStandalonePage = false,
}) {
  const { darkMode } = useTheme();
  // Curriculum state
  const [activeModuleId, setActiveModuleId] = useState("pieces");
  const [activeLessonIndex, setActiveLessonIndex] = useState(0);
  const [activeStageIndex, setActiveStageIndex] = useState(0);

  // Playback & Animation state
  const [isAutoPlaying, setIsAutoPlaying] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const soundEnabledRef = useRef(soundEnabled);
  soundEnabledRef.current = soundEnabled;
  const [is3DView, setIs3DView] = useState(true);
  const [boardPosition, setBoardPosition] = useState("start");
  const [customSquareStyles, setCustomSquareStyles] = useState({});
  const [customArrows, setCustomArrows] = useState([]);
  const [hasAnimatedMove, setHasAnimatedMove] = useState(false);
  const [autoPlayProgress, setAutoPlayProgress] = useState(0);

  const autoPlayTimerRef = useRef(null);
  const progressIntervalRef = useRef(null);
  const moveTimeoutRef = useRef(null);

  // Filter lessons by module
  const currentModuleLessons = ACADEMY_LESSONS.filter(
    (l) => l.moduleId === activeModuleId
  );
  const currentLesson =
    currentModuleLessons[activeLessonIndex] || currentModuleLessons[0] || ACADEMY_LESSONS[0];
  const currentStage = currentLesson.stages[activeStageIndex] || currentLesson.stages[0];

  // Global index among all lessons
  const globalLessonIndex = ACADEMY_LESSONS.findIndex((l) => l.id === currentLesson.id);
  const isCourseStart = globalLessonIndex === 0 && activeStageIndex === 0;
  const isCourseEnd =
    globalLessonIndex === ACADEMY_LESSONS.length - 1 &&
    activeStageIndex === currentLesson.stages.length - 1;

  // Initialize or update lesson if initialLessonId is passed
  useEffect(() => {
    if (initialLessonId) {
      const idx = ACADEMY_LESSONS.findIndex((l) => l.id === initialLessonId);
      if (idx !== -1) {
        const found = ACADEMY_LESSONS[idx];
        setActiveModuleId(found.moduleId);
        const modLessons = ACADEMY_LESSONS.filter((l) => l.moduleId === found.moduleId);
        const inModIdx = modLessons.findIndex((l) => l.id === found.id);
        setActiveLessonIndex(inModIdx !== -1 ? inModIdx : 0);
        setActiveStageIndex(0);
      }
    }
  }, [initialLessonId]);

  // Execute Stage Animation & Board Reset
  const runStageAnimation = useCallback(() => {
    if (moveTimeoutRef.current) clearTimeout(moveTimeoutRef.current);

    // 1. Reset board to stage starting FEN
    const initialFen = currentStage.fen;
    setBoardPosition(initialFen);
    setHasAnimatedMove(false);

    // 2. Compute initial highlight styles
    const styles = {};
    if (currentStage.highlights) {
      Object.entries(currentStage.highlights).forEach(([sq, colorKey]) => {
        styles[sq] = HIGHLIGHT_COLORS[colorKey] || HIGHLIGHT_COLORS.gold;
      });
    }
    setCustomSquareStyles(styles);

    // 3. Set arrows for react-chessboard v5
    if (currentStage.arrows && currentStage.arrows.length > 0) {
      const formattedArrows = currentStage.arrows
        .map((arr) => {
          if (!arr) return null;
          let from, to, color;
          if (Array.isArray(arr)) {
            [from, to, color] = arr;
          } else if (typeof arr === "object") {
            from = arr.startSquare || arr.from;
            to = arr.endSquare || arr.to;
            color = arr.color;
          }
          if (!from || !to || typeof from !== "string" || typeof to !== "string") {
            return null;
          }
          const colorVal =
            color === "rose"
              ? "rgba(244, 63, 94, 0.85)"
              : color === "gold"
              ? "rgba(245, 158, 11, 0.9)"
              : "rgba(16, 185, 129, 0.9)";
          return {
            startSquare: from,
            endSquare: to,
            color: colorVal,
          };
        })
        .filter(Boolean);
      setCustomArrows(formattedArrows);
    } else {
      setCustomArrows([]);
    }

    // 4. If stage has an animated move, execute it automatically after a graceful delay
    if (currentStage.animatedMove) {
      moveTimeoutRef.current = setTimeout(() => {
        try {
          const game = new Chess(initialFen);
          const moveResult = game.move({
            from: currentStage.animatedMove.from,
            to: currentStage.animatedMove.to,
            promotion: currentStage.animatedMove.promotion || "q",
          });

          if (moveResult) {
            setBoardPosition(game.fen());
            setHasAnimatedMove(true);

            // Play tactile sound
            if (soundEnabledRef.current) {
              const isCapture = moveResult.captured !== undefined;
              playSound(isCapture ? "capture" : "move", "atelier", true);
            }

            // Update square highlights to focus on the arrival square
            const arrivalStyles = { ...styles };
            arrivalStyles[currentStage.animatedMove.to] = HIGHLIGHT_COLORS.goldGlow;
            arrivalStyles[currentStage.animatedMove.from] = {
              background: "rgba(212, 175, 55, 0.2)",
              border: "1px dashed rgba(212, 175, 55, 0.5)",
              borderRadius: "4px",
            };
            setCustomSquareStyles(arrivalStyles);
          }
        } catch {
          // Fallback if illegal move in custom FEN
        }
      }, 700);
    }
  }, [currentStage]);

  // Re-run animation when stage or lesson changes
  useEffect(() => {
    runStageAnimation();
    return () => {
      if (moveTimeoutRef.current) clearTimeout(moveTimeoutRef.current);
    };
  }, [runStageAnimation]);

  // Auto-play timer engine (advances automatically if user toggles autoplay)
  useEffect(() => {
    if (!isAutoPlaying) {
      setAutoPlayProgress(0);
      if (autoPlayTimerRef.current) clearTimeout(autoPlayTimerRef.current);
      if (progressIntervalRef.current) clearInterval(progressIntervalRef.current);
      return;
    }

    const duration = 5200; // 5.2s per stage
    const intervalStep = 50;
    let elapsed = 0;

    progressIntervalRef.current = setInterval(() => {
      elapsed += intervalStep;
      setAutoPlayProgress(Math.min(100, (elapsed / duration) * 100));
    }, intervalStep);

    autoPlayTimerRef.current = setTimeout(() => {
      handleNextStage();
    }, duration);

    return () => {
      if (autoPlayTimerRef.current) clearTimeout(autoPlayTimerRef.current);
      if (progressIntervalRef.current) clearInterval(progressIntervalRef.current);
    };
  }, [isAutoPlaying, activeStageIndex, activeLessonIndex, activeModuleId]);

  // Navigation handlers
  const handleNextStage = () => {
    setAutoPlayProgress(0);
    if (activeStageIndex < currentLesson.stages.length - 1) {
      // Advance to next stage within same lesson
      setActiveStageIndex((prev) => prev + 1);
    } else {
      // Advance to next lesson
      handleNextLesson();
    }
  };

  const handlePrevStage = () => {
    setAutoPlayProgress(0);
    if (activeStageIndex > 0) {
      setActiveStageIndex((prev) => prev - 1);
    } else {
      // Go to previous lesson's last stage
      handlePrevLesson();
    }
  };

  const handleNextLesson = () => {
    setAutoPlayProgress(0);
    if (activeLessonIndex < currentModuleLessons.length - 1) {
      setActiveLessonIndex((prev) => prev + 1);
      setActiveStageIndex(0);
    } else {
      // Advance to next module
      const currentModIdx = ACADEMY_MODULES.findIndex((m) => m.id === activeModuleId);
      if (currentModIdx < ACADEMY_MODULES.length - 1) {
        const nextMod = ACADEMY_MODULES[currentModIdx + 1];
        setActiveModuleId(nextMod.id);
        setActiveLessonIndex(0);
        setActiveStageIndex(0);
      } else {
        // Loop back to start or stop autoplay
        setIsAutoPlaying(false);
      }
    }
  };

  const handlePrevLesson = () => {
    setAutoPlayProgress(0);
    if (activeLessonIndex > 0) {
      setActiveLessonIndex((prev) => prev - 1);
      setActiveStageIndex(0);
    } else {
      const currentModIdx = ACADEMY_MODULES.findIndex((m) => m.id === activeModuleId);
      if (currentModIdx > 0) {
        const prevMod = ACADEMY_MODULES[currentModIdx - 1];
        setActiveModuleId(prevMod.id);
        const prevModLessons = ACADEMY_LESSONS.filter((l) => l.moduleId === prevMod.id);
        setActiveLessonIndex(prevModLessons.length - 1);
        const lastPrevLesson = prevModLessons[prevModLessons.length - 1];
        setActiveStageIndex(Math.max(0, (lastPrevLesson?.stages.length || 1) - 1));
      }
    }
  };

  const selectModule = (modId) => {
    setActiveModuleId(modId);
    setActiveLessonIndex(0);
    setActiveStageIndex(0);
    setAutoPlayProgress(0);
  };

  const selectLesson = (index) => {
    setActiveLessonIndex(index);
    setActiveStageIndex(0);
    setAutoPlayProgress(0);
  };

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Keep page shortcuts out of form fields and native button/link interactions.
      if (
        e.defaultPrevented ||
        e.altKey ||
        e.ctrlKey ||
        e.metaKey ||
        e.target?.closest?.("button, a, input, textarea, select, [contenteditable='true']")
      ) return;

      if (e.key === "ArrowRight") {
        e.preventDefault();
        handleNextStage();
      } else if (e.key === "ArrowLeft") {
        e.preventDefault();
        handlePrevStage();
      } else if (e.key === " ") {
        e.preventDefault();
        runStageAnimation();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleNextStage, handlePrevStage, runStageAnimation]);

  return (
    <div className={`cp-academy-wrapper ${isStandalonePage ? "is-page-view" : "is-section-view"}`}>
      {/* ── 1. MODULE & CURRICULUM SELECTOR TABS ───────────────────────── */}
      <div className="cp-academy-header-strip">
        <div className="cp-academy-brand-meta">
          <div className="cp-academy-badge-pill">
            <BookOpen size={13} className="text-amber-400" />
            <span>CHESS ACADEMY</span>
          </div>
          <span className="cp-academy-progress-label">
            Lesson {globalLessonIndex + 1} of {ACADEMY_LESSONS.length}
          </span>
        </div>

        {/* Module Switcher Pills */}
        <div className="cp-academy-module-tabs">
          {ACADEMY_MODULES.map((mod) => (
            <button
              key={mod.id}
              type="button"
              onClick={() => selectModule(mod.id)}
              className={`cp-module-tab-btn ${activeModuleId === mod.id ? "is-active" : ""}`}
            >
              <span className="cp-module-tab-badge">{mod.badge}</span>
              <span className="cp-module-tab-title">{mod.title}</span>
            </button>
          ))}
        </div>

        {/* Perspective & Sound Toggles */}
        <div className="cp-academy-controls-top">
          <button
            type="button"
            onClick={() => setIs3DView(!is3DView)}
            title={is3DView ? "Switch to 2D Flat Plane" : "Switch to 3D Perspective Tilt"}
            className={`cp-academy-icon-btn ${is3DView ? "is-active" : ""}`}
          >
            <Compass size={15} />
            <span className="hidden sm:inline text-xs">{is3DView ? "3D Tilt" : "2D Flat"}</span>
          </button>

          <button
            type="button"
            onClick={() => setSoundEnabled(!soundEnabled)}
            title={soundEnabled ? "Mute Board Audio" : "Enable Tactile Clicks"}
            className={`cp-academy-icon-btn ${soundEnabled ? "is-active" : ""}`}
          >
            {soundEnabled ? <Volume2 size={15} /> : <VolumeX size={15} />}
          </button>
        </div>
      </div>

      {/* ── 2. LESSON SUB-CAROUSEL / TABS ─────────────────────────────────── */}
      <div className="cp-academy-lesson-rail">
        {currentModuleLessons.map((l, idx) => (
          <button
            key={l.id}
            type="button"
            onClick={() => selectLesson(idx)}
            className={`cp-lesson-rail-card ${activeLessonIndex === idx ? "is-active" : ""}`}
          >
            {l.pieceType ? (
              <div className="cp-rail-icon">
                <StauntonPiece type={l.pieceType} theme="gold" size={20} />
              </div>
            ) : (
              <div className="cp-rail-num">{l.stepIndex < 10 ? `0${l.stepIndex}` : l.stepIndex}</div>
            )}
            <div className="cp-rail-text">
              <span className="cp-rail-title">{l.title}</span>
              <span className="cp-rail-role">{l.role}</span>
            </div>
          </button>
        ))}
      </div>

      {/* ── 3. MAIN INTERACTIVE DIORAMA STAGE ───────────────────────────── */}
      <div className="cp-academy-stage-container">
        {/* Left: 3D Chessboard Viewport */}
        <div className="cp-academy-board-col">
          <div className={`cp-board-stage-wrapper ${is3DView ? "view-3d-perspective" : "view-2d-flat"}`}>
            {/* Ambient Base Shadow & Hardwood Bevel Rim */}
            <div className="cp-board-bezel">
              <div className="cp-board-inner">
                <Chessboard
                  id="academy-curriculum-board"
                  options={{
                    position: boardPosition,
                    boardOrientation: currentLesson.boardOrientation || "white",
                    allowDragging: false,
                    animationDurationInMs: 450,
                    showAnimations: true,
                    showNotation: true,
                    squareStyles: customSquareStyles,
                    arrows: customArrows,
                    darkSquareStyle: {
                      backgroundColor: darkMode ? "#2b231d" : "#769656",
                    },
                    lightSquareStyle: {
                      backgroundColor: darkMode ? "#52443a" : "#eeeed2",
                    },
                    boardStyle: {
                      borderRadius: "8px",
                      boxShadow: darkMode
                        ? "0 10px 30px rgba(0, 0, 0, 0.7)"
                        : "0 10px 30px rgba(42, 47, 36, 0.2)",
                    },
                  }}
                />
              </div>
            </div>

            {/* In-Board Telemetry Pip */}
            <div className="cp-board-telemetry-tag">
              <span className="telemetry-dot" />
              <span>
                {hasAnimatedMove ? "Move Demonstrated" : "Awaiting Execution"} ·{" "}
                {currentStage.animatedMove
                  ? `${currentStage.animatedMove.from.toUpperCase()} → ${currentStage.animatedMove.to.toUpperCase()}`
                  : "Static Position"}
              </span>
            </div>
          </div>

          {/* Stepper Stage Selector Pills (Below the Board) */}
          <div className="cp-stage-stepper-pills">
            {currentLesson.stages.map((stage, sIdx) => (
              <button
                key={stage.id}
                type="button"
                onClick={() => {
                  setActiveStageIndex(sIdx);
                  setAutoPlayProgress(0);
                }}
                className={`cp-stage-pill ${activeStageIndex === sIdx ? "is-active" : ""}`}
              >
                <span className="pill-dot" />
                <span className="pill-name">{stage.name}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Right: Guided Director Card & Tactical Breakdown */}
        <div className="cp-academy-director-col">
          <div className="cp-director-card">
            {/* Header: Piece Showcase or Strategy Emblem */}
            <div className="cp-director-header">
              {currentLesson.pieceType && (
                <div className="cp-director-piece-avatar">
                  <StauntonPiece type={currentLesson.pieceType} theme="gold" size={54} />
                  <div className="cp-piece-glow-aura" />
                </div>
              )}
              <div className="cp-director-title-box">
                <div className="flex items-center gap-2">
                  <span className="cp-director-badge">{currentStage.badge}</span>
                  {currentLesson.value && (
                    <span className="cp-director-value-pill">{currentLesson.value}</span>
                  )}
                </div>
                <h3 className="cp-director-heading">{currentLesson.title}</h3>
                <p className="cp-director-tagline">{currentLesson.tagline}</p>
              </div>
            </div>

            {/* Stage Explanation */}
            <div className="cp-director-body">
              <div className="cp-explanation-bubble">
                <p className="cp-explanation-text">{currentStage.explanation}</p>
              </div>

              {/* Grandmaster Wisdom Quote */}
              {currentLesson.proTip && (
                <div className="cp-pro-tip-box">
                  <div className="cp-pro-tip-header">
                    <Crown size={14} className="text-amber-400" />
                    <span>GRANDMASTER PRINCIPLE</span>
                  </div>
                  <p className="cp-pro-tip-text">{currentLesson.proTip}</p>
                </div>
              )}
            </div>

            {/* Stepper Footer Controls */}
            <div className="cp-director-footer">
              {/* Autoplay Progress Meter */}
              {isAutoPlaying && (
                <div className="cp-autoplay-progress-track">
                  <div
                    className="cp-autoplay-progress-fill"
                    style={{ width: `${autoPlayProgress}%` }}
                  />
                </div>
              )}

              <div className="cp-controls-row">
                <div className="flex items-center gap-2">
                  {/* Replay Movement Button */}
                  <button
                    type="button"
                    onClick={runStageAnimation}
                    title="Replay Movement Animation (Spacebar)"
                    className="cp-ctrl-btn cp-ctrl-replay"
                  >
                    <RotateCcw size={15} />
                    <span>Replay</span>
                  </button>

                  {/* Auto-play Walkthrough Button */}
                  <button
                    type="button"
                    onClick={() => setIsAutoPlaying(!isAutoPlaying)}
                    title={isAutoPlaying ? "Pause Auto-Tour" : "Start Guided Auto-Walkthrough"}
                    className={`cp-ctrl-btn cp-ctrl-autoplay ${isAutoPlaying ? "is-playing" : ""}`}
                  >
                    {isAutoPlaying ? <Pause size={15} /> : <Play size={15} />}
                    <span>{isAutoPlaying ? "Pause Tour" : "Auto-Play"}</span>
                  </button>
                </div>

                {/* Back & Next Navigation Buttons */}
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handlePrevStage}
                    disabled={isCourseStart}
                    title="Previous Lesson or Stage (Left Arrow)"
                    className="cp-nav-btn cp-nav-prev"
                  >
                    <ChevronLeft size={16} />
                    <span>Back</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleNextStage}
                    disabled={isCourseEnd}
                    title={isCourseEnd ? "You have reached the end of the curriculum" : "Next Lesson or Stage (Right Arrow)"}
                    className="cp-nav-btn cp-nav-next"
                  >
                    <span>{isCourseEnd ? "Course Complete" : "Next"}</span>
                    <ChevronRight size={16} />
                  </button>
                </div>
              </div>

              {/* Keyboard shortcuts hint */}
              <div className="cp-shortcuts-hint">
                <span>Use keyboard</span>
                <kbd className="cp-kbd">←</kbd>
                <kbd className="cp-kbd">→</kbd>
                <span>to navigate</span>
                <kbd className="cp-kbd">Space</kbd>
                <span>to replay</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
