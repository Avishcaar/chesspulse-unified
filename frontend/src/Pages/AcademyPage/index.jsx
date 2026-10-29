import React, { useState, useEffect } from "react";
import { useSearchParams, Link } from "react-router-dom";
import ChessGuidedTourCamera from "../../Components/Academy/ChessGuidedTourCamera";
import ChessAcademy from "../../Components/Academy/ChessAcademy";
import { BookOpen, Video, Book, ChevronLeft } from "lucide-react";
import "./academy-page.css";

export default function AcademyPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialView = searchParams.get("view") === "curriculum" ? "curriculum" : "camera";
  const [viewStyle, setViewStyle] = useState(initialView);
  const stepParam = searchParams.get("step");
  const initialStepIdx =
    stepParam !== null && !isNaN(parseInt(stepParam, 10))
      ? parseInt(stepParam, 10)
      : 0;

  useEffect(() => {
    const v = searchParams.get("view");
    if (v === "curriculum") setViewStyle("curriculum");
    else if (v === "camera") setViewStyle("camera");
  }, [searchParams]);

  const handleModeChange = (mode) => {
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.cancel();
    }
    setViewStyle(mode);
    setSearchParams(mode === "curriculum" ? { view: "curriculum" } : {});
  };

  // Cancel any lingering speech when leaving the academy page
  useEffect(() => {
    return () => {
      if (typeof window !== "undefined" && "speechSynthesis" in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  return (
    <div
      className={`cp-academy-page ${
        viewStyle === "camera" ? "is-camera-mode" : "is-curriculum-mode"
      }`}
    >
      {viewStyle === "camera" ? (
        /* Full Viewport 2D Camera POV Flight */
        <ChessGuidedTourCamera
          isStandalonePage={true}
          viewMode={viewStyle}
          onModeChange={handleModeChange}
          initialStepIdx={initialStepIdx}
        />
      ) : (
        /* Interactive Curriculum Masterclass Mode */
        <div className="cp-academy-page-container">
          <div className="cp-academy-bg-glow" aria-hidden="true" />
          <div className="cp-academy-top-bar">
            <Link
              to="/"
              className="cp-academy-back-link"
              title="Return to Home Battlefield"
            >
              <ChevronLeft size={16} />
              <span>Battlefield</span>
            </Link>

            <div className="cp-academy-center-masthead">
              <div className="flex items-center justify-center gap-2">
                <span className="cp-academy-pill">
                  <BookOpen size={12} className="text-amber-400" />
                  <span>MASTERCLASS ACADEMY</span>
                </span>
              </div>
              <h1 className="cp-academy-hero-title">
                Chess<span className="text-amber-400">Pulse</span> Curriculum
              </h1>
            </div>

            {/* Mode Switcher Group */}
            <div className="academy-page-mode-switcher">
              <button
                type="button"
                onClick={() => handleModeChange("camera")}
                className="academy-mode-pill"
                title="Interactive Visual Tour"
              >
                <Video size={14} />
                <span>Visual Tour</span>
              </button>
              <button
                type="button"
                onClick={() => handleModeChange("curriculum")}
                className="academy-mode-pill is-selected"
                title="Interactive Curriculum Reference"
              >
                <Book size={14} />
                <span>Curriculum</span>
              </button>
            </div>
          </div>

          <ChessAcademy isStandalonePage={true} />
        </div>
      )}
    </div>
  );
}
