import React, { useState, useEffect, useRef, useCallback } from "react";
import { Link } from "react-router-dom";
import { Chessboard } from "react-chessboard";
import { Chess } from "chess.js";
import {
  ChevronLeft,
  ChevronRight,
  Palette,
  CheckCircle2,
  RotateCcw,
} from "lucide-react";
import { GUIDED_TOUR_STEPS } from "../../data/guidedTourChessData";
import { useTheme } from "../../contexts/ThemeContext";
import { playSound } from "../../utils/sounds";
import "./chess-guided-tour-camera.css";

// Available High-Contrast Board Palettes (Emerald default)
export const BOARD_PALETTES = {
  emerald: {
    id: "emerald",
    name: "Tournament Emerald",
    dark: "#739552",
    light: "#ebecd0",
    veil: "rgba(8, 12, 8, 0.30)",
    label: "Emerald",
  },
  walnut: {
    id: "walnut",
    name: "Classic Walnut",
    dark: "#b58863",
    light: "#f0d9b5",
    veil: "rgba(10, 8, 7, 0.32)",
    label: "Walnut",
  },
  heritage: {
    id: "heritage",
    name: "Warm Mahogany",
    dark: "#8a5a36",
    light: "#ebd7b2",
    veil: "rgba(10, 7, 6, 0.32)",
    label: "Mahogany",
  },
};

// Helper to calculate square coordinates on the board
function getSquareInfo(sq, boardSize) {
  if (!sq || sq.length < 2 || !boardSize) return null;
  const squareSize = boardSize / 8;
  const file = sq.charCodeAt(0) - 97; // 0 to 7 (a to h)
  const rank = parseInt(sq[1], 10); // 1 to 8
  const row = 8 - rank; // 0 (rank 8) to 7 (rank 1)
  const left = file * squareSize;
  const top = row * squareSize;
  const centerX = left + squareSize / 2;
  const centerY = top + squareSize / 2;
  const deltaX = centerX - boardSize / 2;
  const deltaY = centerY - boardSize / 2;
  return { file, rank, row, left, top, centerX, centerY, deltaX, deltaY, size: squareSize };
}

// Helper to apply legal chess moves
function applyChessMove(currentFen, from, to) {
  try {
    const game = new Chess(currentFen);
    const move = game.move({ from, to, promotion: "q" });
    if (move) {
      return game.fen();
    }
  } catch {
    // fallback
  }
  return null;
}

function getValidStepIndex(index) {
  return typeof index === "number" &&
    Number.isInteger(index) &&
    index >= 0 &&
    index < GUIDED_TOUR_STEPS.length
    ? index
    : 0;
}

function getResponsiveBoardSize() {
  if (typeof window === "undefined") return 700;
  const availableH = window.innerHeight - 250;
  const availableW = window.innerWidth - 32;
  return Math.max(280, Math.min(740, availableH, availableW));
}

export default function ChessGuidedTourCamera({
  isStandalonePage = false,
  initialStepIdx = 0,
}) {
  const { darkMode } = useTheme();
  const [currentStepIdx, setCurrentStepIdx] = useState(() =>
    getValidStepIndex(initialStepIdx)
  );
  const initialStep = GUIDED_TOUR_STEPS[getValidStepIndex(initialStepIdx)];
  const [hasStarted, setHasStarted] = useState(false);

  useEffect(() => {
    setCurrentStepIdx(getValidStepIndex(initialStepIdx));
  }, [initialStepIdx]);
  const [boardPosition, setBoardPosition] = useState(initialStep.initialFen);
  const [activeFocusSquare, setActiveFocusSquare] = useState(initialStep.focusSquare);
  const [activeTargetSquares, setActiveTargetSquares] = useState(initialStep.targetSquares || []);
  const [activeSpotlightSquares, setActiveSpotlightSquares] = useState(initialStep.spotlightSquares || []);
  const [activeArrows, setActiveArrows] = useState(initialStep.arrows || []);

  // Lesson & Drill Lifecycle: "instructing" -> "demonstrating" -> "testing" -> "passed"
  const [phase, setPhase] = useState("ready");
  const [narrationState, setNarrationState] = useState("idle");
  const [testResult, setTestResult] = useState(null); // null | "passed" | "failed"
  const [selectedSquare, setSelectedSquare] = useState(null); // click-to-move support

  // Dynamic responsive board size (calibrated to viewport height to avoid overlap with HUD & bottom bar)
  const [boardSize, setBoardSize] = useState(getResponsiveBoardSize);

  useEffect(() => {
    const handleResize = () => {
      setBoardSize(getResponsiveBoardSize());
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Audio state
  const [boardSfxEnabled] = useState(true);

  // Pure 2D Camera Settings
  const [isOverviewOverride, setIsOverviewOverride] = useState(false);

  // Board appearance & palette (default to emerald)
  const [selectedPaletteKey, setSelectedPaletteKey] = useState("emerald");
  const currentPalette = BOARD_PALETTES[selectedPaletteKey] || BOARD_PALETTES.emerald;
  const spotlightVeil = darkMode ? currentPalette.veil : "rgba(37, 42, 34, 0.24)";

  const step = GUIDED_TOUR_STEPS[currentStepIdx] || GUIDED_TOUR_STEPS[0];
  const timeoutsRef = useRef([]);
  const isMountedRef = useRef(true);
  const executeStepRef = useRef(null);
  const skipExecutionEffectRef = useRef(false);
  const clearStepTimeouts = useCallback(() => {
    timeoutsRef.current.forEach(clearTimeout);
    timeoutsRef.current = [];
  }, []);

  // Stop browser speech immediately when the learner navigates or leaves.
  const stopAllSpeech = useCallback(() => {
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.cancel();
    }
    if (isMountedRef.current) setNarrationState("idle");
  }, []);

  // ── 1. LIFECYCLE & PAGE CLEANUP: STOP SPEECH INSTANTLY ON UNMOUNT ────────
  useEffect(() => {
    isMountedRef.current = true;
    try {
      localStorage.removeItem("chesspulse_voice_config");
      localStorage.removeItem("chesspulse_narrator_voice");
    } catch (_) {}

    return () => {
      isMountedRef.current = false;
      clearStepTimeouts();
      stopAllSpeech();
    };
  }, [stopAllSpeech, clearStepTimeouts]);

  // Keep the selected lesson visible on a deep link before playback starts.
  useEffect(() => {
    if (hasStarted) return;
    setBoardPosition(step.initialFen);
    setActiveFocusSquare(step.focusSquare);
    setActiveTargetSquares(step.targetSquares || []);
    setActiveSpotlightSquares(step.spotlightSquares || []);
    setActiveArrows(step.arrows || []);
    setPhase("ready");
    setTestResult(null);
    setSelectedSquare(null);
  }, [currentStepIdx, hasStarted, step]);

  // ── 2. BROWSER-NATIVE TEXT-TO-SPEECH NARRATION ─────────────────────────────
  const speakNarration = useCallback(
    (text, onComplete) => {
      if (typeof window === "undefined" || !isMountedRef.current) {
        return;
      }

      stopAllSpeech();

      if (!text) {
        setNarrationState("idle");
        if (onComplete && isMountedRef.current) {
          const readingDelay = Math.min(2000, Math.max(900, text.split(" ").length * 110));
          const t = setTimeout(() => {
            if (isMountedRef.current && onComplete) onComplete();
          }, readingDelay);
          timeoutsRef.current.push(t);
        }
        return;
      }

      let completed = false;
      const safeComplete = () => {
        if (!isMountedRef.current || completed) return;
        completed = true;
        setNarrationState("idle");
        if (onComplete) onComplete();
      };

      setNarrationState("speaking");

      speakWithBrowserTTS(text, safeComplete);

      function speakWithBrowserTTS(fallbackText, onDone) {
        if (typeof window === "undefined" || !("speechSynthesis" in window)) {
          setNarrationState("idle");
          onDone();
          return;
        }
        const utterance = new SpeechSynthesisUtterance(fallbackText);
        const allVoices = window.speechSynthesis.getVoices() || [];
        const chosenVoice =
          allVoices.find(
            (v) =>
              v.lang.startsWith("en") &&
              (v.name.includes("Online (Natural)") ||
                v.name.includes("Natural") ||
                v.name.includes("Neural"))
          ) ||
          allVoices.find((v) => v.name.includes("Google") && v.lang.startsWith("en")) ||
          allVoices.find((v) => v.name.includes("Jenny") || v.name.includes("Guy") || v.name.includes("Aria")) ||
          allVoices.find((v) => v.lang.startsWith("en") && !v.name.includes("Desktop")) ||
          allVoices.find((v) => v.lang.startsWith("en")) ||
          allVoices[0];

        if (chosenVoice) utterance.voice = chosenVoice;
        utterance.rate = 0.94;
        utterance.pitch = 1.0;
        utterance.onend = onDone;
        utterance.onerror = (e) => {
          if (e?.error === "canceled" || e?.error === "interrupted" || !isMountedRef.current) return;
          onDone();
        };
        window.speechSynthesis.speak(utterance);
      }
    },
    [stopAllSpeech]
  );

  // ── 3. 2D CAMERA RIG COMPUTATION ─────────────────────────────────────────
  // Note: In testing phase, camera returns to natural board view with transform: "none"
  // so that react-chessboard's DragOverlay has NO CSS containing block and matches viewport coordinates 1:1!
  const isTestingMode = phase === "testing";

  const computeCameraStyles = () => {
    if (isOverviewOverride || isTestingMode) {
      return { x: 0, y: 0, zoom: 1 };
    }

    const { camera } = step;
    const currentTargetSquare = activeFocusSquare || camera?.focusSquare;

    if (!currentTargetSquare) {
      return {
        x: camera?.panOffsetX || 0,
        y: camera?.panOffsetY || 0,
        zoom: camera?.zoom ? Math.min(camera.zoom, 1.85) : 1,
      };
    }

    const sq = getSquareInfo(currentTargetSquare, boardSize);
    if (!sq) {
      return { x: 0, y: 0, zoom: 1 };
    }

    const zoom = camera?.zoom ? Math.min(camera.zoom, 1.95) : 1.85;
    const x = -sq.deltaX * zoom + (camera?.panOffsetX || 0);
    const y = -sq.deltaY * zoom + (camera?.panOffsetY || 0);

    return { x, y, zoom };
  };

  const cam = computeCameraStyles();

  // Rig transform style: strictly "none" during testing to prevent @dnd-kit containing block coordinate distortion!
  const rigTransformStyle = (isTestingMode || isOverviewOverride)
    ? "none"
    : `translate3d(${cam.x.toFixed(1)}px, ${cam.y.toFixed(1)}px, 0) scale(${cam.zoom})`;

  // ── 4. CHOREOGRAPHED DEMONSTRATION & PRACTICE TEST LAUNCHER ─────────────
  const startTesting = useCallback(() => {
    if (!isMountedRef.current) return;
    clearStepTimeouts();
    stopAllSpeech();
    if (!step.test) {
      setPhase("completed");
      return;
    }

    setPhase("testing");
    setBoardPosition(step.test.fen || step.initialFen);
    setActiveFocusSquare(step.focusSquare);
    setActiveTargetSquares([]);
    setActiveSpotlightSquares(step.spotlightSquares || []);
    setActiveArrows([]);
    setTestResult(null);
    setSelectedSquare(null);

    if (step.test.prompt) {
      speakNarration(step.test.prompt);
    }
  }, [step, speakNarration, clearStepTimeouts, stopAllSpeech]);

  const startDemonstration = useCallback(() => {
    if (!isMountedRef.current) return;
    setPhase("demonstrating");

    if (step.actions && step.actions.length > 0) {
      step.actions.forEach((act) => {
        const actT = setTimeout(() => {
          if (!isMountedRef.current) return;
          setBoardPosition(act.fen);
          if (act.focusSquare !== undefined) {
            setActiveFocusSquare(act.focusSquare);
          }
          if (act.targetSquares !== undefined) {
            setActiveTargetSquares(act.targetSquares);
          }
          if (act.spotlightSquares !== undefined) {
            setActiveSpotlightSquares(act.spotlightSquares);
          }
          if (act.arrows !== undefined) {
            setActiveArrows(act.arrows);
          }
          if (boardSfxEnabled) {
            playSound(act.sound || "move", "atelier", true);
          }
        }, act.time);
        timeoutsRef.current.push(actT);
      });

      const lastActionTime = Math.max(...step.actions.map((a) => a.time));
      const finishT = setTimeout(() => {
        if (!isMountedRef.current) return;
        if (step.test) {
          startTesting();
        } else {
          setPhase("completed");
        }
      }, lastActionTime + 1200);
      timeoutsRef.current.push(finishT);
    } else {
      if (step.test) {
        startTesting();
      } else {
        setPhase("completed");
      }
    }
  }, [step, boardSfxEnabled, startTesting]);

  const executeStep = useCallback(() => {
    if (!isMountedRef.current) return;
    clearStepTimeouts();
    stopAllSpeech();

    setBoardPosition(step.initialFen);
    setActiveFocusSquare(step.focusSquare);
    setActiveTargetSquares(step.targetSquares || []);
    setActiveSpotlightSquares(step.spotlightSquares || []);
    setActiveArrows(step.arrows || []);
    setPhase("instructing");
    setTestResult(null);
    setSelectedSquare(null);

    speakNarration(step.narration, () => {
      if (!isMountedRef.current) return;
      const waitT = setTimeout(() => {
        if (!isMountedRef.current) return;
        startDemonstration();
      }, 450);
      timeoutsRef.current.push(waitT);
    });
  }, [step, speakNarration, startDemonstration, stopAllSpeech, clearStepTimeouts]);

  executeStepRef.current = executeStep;

  useEffect(() => {
    if (!hasStarted) return undefined;
    if (skipExecutionEffectRef.current) {
      skipExecutionEffectRef.current = false;
      return undefined;
    }
    executeStepRef.current?.();
    return () => {
      clearStepTimeouts();
    };
  }, [currentStepIdx, hasStarted, clearStepTimeouts]);

  // Navigation handlers
  const handleNext = useCallback(() => {
    setIsOverviewOverride(false);
    setSelectedSquare(null);
    if (!hasStarted) {
      setHasStarted(true);
      // Start speech directly inside the user's click/keyboard gesture so the
      // browser can unlock its voice engine on the first lesson.
      skipExecutionEffectRef.current = true;
      executeStepRef.current?.();
      return;
    }

    clearStepTimeouts();
    stopAllSpeech();
    if (currentStepIdx >= GUIDED_TOUR_STEPS.length - 1) {
      setHasStarted(false);
      setCurrentStepIdx(0);
      setTestResult(null);
      setPhase("ready");
      return;
    }
    setTestResult(null);
    setCurrentStepIdx((prev) => Math.min(prev + 1, GUIDED_TOUR_STEPS.length - 1));
  }, [hasStarted, currentStepIdx, stopAllSpeech, clearStepTimeouts]);

  const handlePrev = useCallback(() => {
    if (currentStepIdx === 0) return;
    clearStepTimeouts();
    stopAllSpeech();
    setIsOverviewOverride(false);
    setSelectedSquare(null);
    setTestResult(null);
    setCurrentStepIdx((prev) => Math.max(0, prev - 1));
  }, [currentStepIdx, stopAllSpeech, clearStepTimeouts]);

  // ── 5. INTERACTIVE TEST HANDLER (DRAG & DROP + CLICK-TO-MOVE) ────────────
  const handlePieceDrop = (arg1, arg2) => {
    let sourceSquare, targetSquare;
    if (typeof arg1 === "object" && arg1 !== null && arg1.sourceSquare) {
      sourceSquare = arg1.sourceSquare;
      targetSquare = arg1.targetSquare;
    } else {
      sourceSquare = arg1;
      targetSquare = arg2;
    }

    if (phase !== "testing" || !step.test || !sourceSquare || !targetSquare) {
      return false;
    }

    const validMoves = step.test.validMoves || [];
    const isCorrect = validMoves.some(
      (m) =>
        m.from.toLowerCase() === sourceSquare.toLowerCase() &&
        m.to.toLowerCase() === targetSquare.toLowerCase()
    );

    if (isCorrect) {
      setTestResult("passed");
      setSelectedSquare(null);
      if (boardSfxEnabled) {
        playSound("game_start", "atelier", true);
      }

      let nextFen = step.test.resultFen;
      if (!nextFen) {
        nextFen = applyChessMove(boardPosition, sourceSquare, targetSquare) || boardPosition;
      }
      setBoardPosition(nextFen);
      setActiveFocusSquare(targetSquare);
      setActiveTargetSquares([]);
      setActiveArrows([]);

      if (step.test.successNarration) {
        speakNarration(step.test.successNarration);
      }
      return true;
    } else {
      setTestResult("failed");
      setSelectedSquare(null);
      if (boardSfxEnabled) {
        playSound("illegal", "atelier", true);
      }

      if (validMoves.length > 0) {
        setActiveArrows([
          {
            startSquare: validMoves[0].from,
            endSquare: validMoves[0].to,
            color: "rgba(245, 158, 11, 0.95)",
          },
        ]);
      }

      if (step.test.correctionNarration) {
        speakNarration(step.test.correctionNarration);
      }
      return false;
    }
  };

  // Click-to-move support for touch and precision clicking
  const handlePieceClick = ({ square }) => {
    if (phase !== "testing" || testResult === "passed") return;
    setSelectedSquare(square);
  };

  const handleSquareClick = ({ square }) => {
    if (phase !== "testing" || testResult === "passed") return;
    if (selectedSquare) {
      if (selectedSquare === square) {
        setSelectedSquare(null);
      } else {
        handlePieceDrop(selectedSquare, square);
      }
    } else {
      setSelectedSquare(square);
    }
  };

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.defaultPrevented || e.altKey || e.ctrlKey || e.metaKey) return;
      if (
        e.target?.closest?.("button, a, input, textarea, select, [role='menu'], [role='menuitem']")
      ) {
        return;
      }
      if (e.key === "ArrowRight" || e.key === "Enter") {
        e.preventDefault();
        handleNext();
      } else if (e.key === "ArrowLeft") {
        e.preventDefault();
        handlePrev();
      } else if (e.key === " ") {
        e.preventDefault();
        if (hasStarted) executeStep();
        else handleNext();
      } else if (e.key === "f" || e.key === "F") {
        e.preventDefault();
        setIsOverviewOverride((prev) => !prev);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleNext, handlePrev, executeStep, hasStarted]);

  // Compute spotlight cutouts
  const focusedSqInfo = activeFocusSquare ? getSquareInfo(activeFocusSquare, boardSize) : null;
  const targetSqInfos = (activeTargetSquares || []).map((sq) => getSquareInfo(sq, boardSize)).filter(Boolean);
  const spotlightSqInfos = (activeSpotlightSquares || [])
    .filter((sq) => sq !== activeFocusSquare)
    .map((sq) => getSquareInfo(sq, boardSize))
    .filter(Boolean);

  // Format tactical arrows for react-chessboard v5
  const formattedArrows = (activeArrows || [])
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
          ? "rgba(244, 63, 94, 0.9)"
          : color === "gold"
          ? "rgba(245, 158, 11, 0.95)"
          : color === "emerald"
          ? "rgba(16, 185, 129, 0.9)"
          : color || "rgba(245, 158, 11, 0.95)";
      return {
        startSquare: from,
        endSquare: to,
        color: colorVal,
      };
    })
    .filter(Boolean);

  const isDraggingAllowed = phase === "testing" && testResult !== "passed";
  const teachingStages = step.test ? ["Learn", "Watch", "Practice"] : ["Learn", "Watch"];
  const activeTeachingStage =
    testResult === "passed" || phase === "completed"
      ? teachingStages.length
      : phase === "testing"
      ? teachingStages.length - 1
      : phase === "demonstrating"
      ? 1
      : 0;

  return (
    <div
      className={`chess-camera-tour-root ${
        isStandalonePage ? "is-page-view" : "is-section-view"
      }`}
    >
      {/* ── TOP LEFT RETURN HOME / EXIT BUTTON ───────────────────────── */}
      <div className="camera-tour-topbar">
        <div className="camera-tour-control-group" role="group" aria-label="Class controls">
          <Link
            to="/"
            onClick={stopAllSpeech}
            className="camera-tour-exit-btn"
            title="Exit Academy and return home"
          >
            <ChevronLeft size={16} />
            <span>Exit Class</span>
          </Link>
          <span className="camera-hud-divider" aria-hidden="true" />
          <button
            type="button"
            onClick={() => {
              setSelectedPaletteKey((prev) =>
                prev === "emerald" ? "walnut" : prev === "walnut" ? "heritage" : "emerald"
              );
            }}
            title={`Change board colors. Current theme: ${currentPalette.name}`}
            aria-label={`Change board colors. Current theme: ${currentPalette.name}`}
            className="camera-hud-pill-btn"
          >
            <Palette size={15} />
            <span>Board: {currentPalette.label}</span>
          </button>
        </div>

        <div className="camera-tour-course-context">
          <span className="camera-tour-context-eyebrow">CHESS ACADEMY</span>
          <span className="camera-tour-context-title">{step.shortLabel || step.title}</span>
        </div>

        <div className="camera-tour-top-progress">
          <div className="camera-tour-top-progress-label">
            <span>LESSON</span>
            <strong>{String(currentStepIdx + 1).padStart(2, "0")}</strong>
            <span className="camera-tour-progress-total">/ {String(GUIDED_TOUR_STEPS.length).padStart(2, "0")}</span>
          </div>
          <div
            className="camera-tour-top-progress-track"
            role="progressbar"
            aria-label="Course progress"
            aria-valuemin={0}
            aria-valuemax={GUIDED_TOUR_STEPS.length}
            aria-valuenow={currentStepIdx + 1}
          >
            <span style={{ width: `${((currentStepIdx + 1) / GUIDED_TOUR_STEPS.length) * 100}%` }} />
          </div>
        </div>
      </div>
      <div className="camera-viewport-frame">
        {/* Ambient Radial Floor */}
        <div className="camera-ambient-floor" aria-hidden="true" />

        {/* ── THE 2D FLYING CAMERA RIG ───────────────────────────────────── */}
        <div
          className={`camera-moving-rig ${isTestingMode ? "is-testing-mode" : "is-flying"}`}
          style={{
            width: `${boardSize}px`,
            height: `${boardSize}px`,
            marginLeft: `-${boardSize / 2}px`,
            marginTop: `-${boardSize / 2}px`,
            transformOrigin: `${boardSize / 2}px ${boardSize / 2}px`,
            transform: isTestingMode || isOverviewOverride ? "none" : rigTransformStyle,
            willChange: isTestingMode || isOverviewOverride ? "auto" : "transform",
            transition: isTestingMode ? "none" : undefined,
          }}
        >
          <div
            className="camera-board-stage"
            style={{ width: `${boardSize}px`, height: `${boardSize}px` }}
          >
            <Chessboard
              id="guided-tour-camera-board"
              options={{
                id: "guided-tour-camera-board",
                boardWidth: boardSize,
                position: boardPosition,
                allowDragging: isDraggingAllowed,
                allowDragOffBoard: true,
                dragActivationDistance: 1,
                onPieceDrop: handlePieceDrop,
                onPieceClick: handlePieceClick,
                onSquareClick: handleSquareClick,
                animationDurationInMs: 380,
                showAnimations: true,
                showNotation: true,
                arrows: formattedArrows,
                clearArrowsOnPositionChange: false,
                allowDrawingArrows: false,
                customSquareStyles: selectedSquare
                  ? { [selectedSquare]: { backgroundColor: "rgba(212, 175, 55, 0.45)" } }
                  : {},
                darkSquareStyle: { backgroundColor: currentPalette.dark },
                lightSquareStyle: { backgroundColor: currentPalette.light },
                boardStyle: {
                  borderRadius: "12px",
                  boxShadow: darkMode
                    ? "0 25px 60px rgba(0, 0, 0, 0.95)"
                    : "0 22px 50px rgba(43, 48, 40, 0.25)",
                  outline: darkMode
                    ? "2px solid rgba(212, 175, 55, 0.4)"
                    : "2px solid rgba(145, 111, 32, 0.45)",
                  boxSizing: "border-box",
                },
              }}
            />

            {/* SVG Spotlight Mask */}
            <svg
              className="camera-spotlight-svg"
              width={boardSize}
              height={boardSize}
              viewBox={`0 0 ${boardSize} ${boardSize}`}
              aria-hidden="true"
            >
              <defs>
                <mask id="camera-piece-spotlight-mask">
                  <rect
                    x="0"
                    y="0"
                    width={boardSize}
                    height={boardSize}
                    fill="white"
                  />

                  {focusedSqInfo && (
                    <rect
                      x={focusedSqInfo.left}
                      y={focusedSqInfo.top}
                      width={focusedSqInfo.size}
                      height={focusedSqInfo.size}
                      rx="10"
                      fill="black"
                    />
                  )}

                  {spotlightSqInfos.map((s, idx) => (
                    <rect
                      key={`spotlight-${idx}`}
                      x={s.left}
                      y={s.top}
                      width={s.size}
                      height={s.size}
                      rx="8"
                      fill="black"
                    />
                  ))}

                  {targetSqInfos.map((t, idx) => (
                    <rect
                      key={`target-${idx}`}
                      x={t.left}
                      y={t.top}
                      width={t.size}
                      height={t.size}
                      rx="8"
                      fill="black"
                    />
                  ))}
                </mask>
              </defs>

              {(activeFocusSquare || (activeSpotlightSquares && activeSpotlightSquares.length > 0)) && (
                <rect
                  x="0"
                  y="0"
                  width={boardSize}
                  height={boardSize}
                  fill={spotlightVeil}
                  mask="url(#camera-piece-spotlight-mask)"
                  style={{
                    opacity: (isOverviewOverride || isTestingMode) ? 0 : 1,
                    transition: "opacity 0.4s ease",
                  }}
                />
              )}
            </svg>

            {/* Highlights on Focused Piece */}
            {focusedSqInfo && (
              <div
                className="camera-piece-focus-ring"
                style={{
                  left: focusedSqInfo.left,
                  top: focusedSqInfo.top,
                  width: focusedSqInfo.size,
                  height: focusedSqInfo.size,
                }}
              >
                <div className="focus-pulse-glow" />
                <div className="focus-corner corner-tl" />
                <div className="focus-corner corner-tr" />
                <div className="focus-corner corner-bl" />
                <div className="focus-corner corner-br" />
                <div className="focus-coordinate-tag">{activeFocusSquare.toUpperCase()}</div>
              </div>
            )}

            {/* Target Square Beacons */}
            {targetSqInfos.map((t, idx) => (
              <div
                key={idx}
                className="camera-target-beacon"
                style={{
                  left: t.left,
                  top: t.top,
                  width: t.size,
                  height: t.size,
                }}
              >
                <div className="beacon-ping" />
                <div className="beacon-dot" />
                <span className="beacon-tag">
                  {(activeTargetSquares[idx] || "").toUpperCase()}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* ── ATELIER LUXURY CONTROLLER BAR (EXHIBITION DESIGN) ─────────────── */}
        <div className="tour-minimal-bar">
          {/* Gilded Top Specular Accent Line */}
          <div className="tour-bar-accent-line" aria-hidden="true" />

          <div className="tour-learning-meta">
            {/* Meta Strip */}
            <div className="tour-badge-row">
              <span className="tour-step-badge">{step.badge}</span>
              <span className="tour-meta-dot" aria-hidden="true">·</span>

              {/* Status Indicator */}
              {phase === "ready" && (
                <span className="tour-status-pill is-instructing">
                  <span className="status-beacon-dot is-gold" />
                  <span>READY TO BEGIN</span>
                </span>
              )}
              {phase === "instructing" && (
                <span className="tour-status-pill is-instructing">
                  <span className={`status-beacon-dot is-gold ${narrationState === "speaking" ? "animate-pulse" : ""}`} />
                  <span>{narrationState === "speaking" ? "INSTRUCTOR SPEAKING" : "LESSON INTRODUCTION"}</span>
                </span>
              )}
              {phase === "demonstrating" && (
                <span className="tour-status-pill is-demo">
                  <span className="status-beacon-dot is-cyan" />
                  <span>CHOREOGRAPHED DEMO</span>
                </span>
              )}
              {phase === "testing" && testResult === null && (
                <span className="tour-status-pill is-testing">
                  <span className="status-beacon-dot is-emerald" />
                  <span>PRACTICE DRILL · YOUR MOVE</span>
                </span>
              )}
              {testResult === "passed" && (
                <span className="tour-status-pill is-passed">
                  <CheckCircle2 size={12} className="text-emerald-400" />
                  <span>MOVE MASTERED</span>
                </span>
              )}
              {testResult === "failed" && (
                <span className="tour-status-pill is-failed">
                  <RotateCcw size={11} className="text-amber-400" />
                  <span>RETRY MOVE</span>
                </span>
              )}

              <span className="tour-counter-tag">
                {String(currentStepIdx + 1).padStart(2, "0")} / {String(GUIDED_TOUR_STEPS.length).padStart(2, "0")}
              </span>
            </div>

            <ol className="tour-learning-path" aria-label="Lesson stages">
              {teachingStages.map((stageLabel, index) => (
                <li
                  key={stageLabel}
                  className={
                    index < activeTeachingStage
                      ? "is-complete"
                      : index === activeTeachingStage
                      ? "is-current"
                      : ""
                  }
                >
                  <span className="tour-learning-path-marker" aria-hidden="true">
                    {index < activeTeachingStage ? "✓" : index + 1}
                  </span>
                  <span>{stageLabel}</span>
                </li>
              ))}
            </ol>

            {/* Editorial Heading Title & Narrative Caption */}
            {testResult === "passed" ? (
              <>
                <h2 className="tour-heading-title is-passed-title">
                  Brilliant. Move Mastered.
                </h2>
                <p className="tour-heading-caption">
                  {step.test?.successNarration || "Excellent execution! Ready for the next lesson."}
                </p>
              </>
            ) : testResult === "failed" ? (
              <>
                <h2 className="tour-heading-title is-failed-title">
                  Not quite. Try again.
                </h2>
                <p className="tour-heading-caption">
                  {step.test?.hint || "Follow the golden arrow guidance on the board."}
                </p>
              </>
            ) : phase === "testing" ? (
              <>
                <h2 className="tour-heading-title">
                  {step.test?.prompt || "Your Turn to Play"}
                </h2>
                <p className="tour-heading-caption">
                  {step.test?.hint || "Drag the piece or click squares to complete the move."}
                </p>
              </>
            ) : (
              <>
                <h2 className="tour-heading-title">{step.title}</h2>
                {step.caption && (
                  <p className="tour-heading-caption">{step.caption}</p>
                )}
              </>
            )}

            {/* Contextual Sub-actions */}
            <div className="tour-subactions-row">
              {hasStarted && step.test && (phase === "instructing" || phase === "demonstrating") && (
                <button
                  type="button"
                  onClick={startTesting}
                  className="tour-subaction-link"
                >
                  <span>Skip directly to Practice Drill</span>
                  <ChevronRight size={12} />
                </button>
              )}
              {phase === "testing" && (
                <button
                  type="button"
                  onClick={executeStep}
                  className="tour-subaction-link"
                >
                  <RotateCcw size={11} />
                  <span>Re-watch Lesson & Demonstration</span>
                </button>
              )}
            </div>
          </div>

          {/* Luxury Gilded Navigation Buttons */}
          <div className="tour-minimal-nav-group">
            {currentStepIdx > 0 && (
              <button
                type="button"
                onClick={handlePrev}
                className="tour-minimal-nav-btn tour-btn-prev"
                title="Previous Lesson (Left Arrow)"
              >
                <ChevronLeft size={16} />
                <span>Previous</span>
              </button>
            )}

            <button
              type="button"
              onClick={handleNext}
              className={`tour-minimal-nav-btn tour-btn-next ${
                testResult === "passed" ? "is-passed-pulse" : ""
              }`}
              title={`${!hasStarted ? "Start lesson" : currentStepIdx === GUIDED_TOUR_STEPS.length - 1 ? "Restart tour" : "Next lesson"} (Right Arrow / Enter)`}
            >
              <span>
                {!hasStarted
                  ? "Start Lesson"
                  : currentStepIdx === GUIDED_TOUR_STEPS.length - 1
                  ? "Restart Tour"
                  : currentStepIdx === 0 && phase === "completed"
                  ? "Begin Lessons"
                  : testResult === "passed"
                  ? "Next Lesson"
                  : currentStepIdx === 0
                  ? "Skip Intro"
                  : "Next"}
              </span>
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
