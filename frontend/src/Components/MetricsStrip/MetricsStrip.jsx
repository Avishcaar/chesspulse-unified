import React, { useState, useEffect, useRef } from "react";
import { ChevronDown, BarChart2 } from "lucide-react";
import { useSpecularSpotlight } from "../../utils/useSpecularSpotlight";
import "./metricsstrip.css";

const METRICS = [
  {
    code: "PLATE I",
    target: 1450000,
    prefix: "",
    suffix: "+",
    label: "Neural Evaluations",
    detail: "In-browser Stockfish NNUE nodes per second",
    barFill: 94,
    accent: "#f43f5e",
    format: (n) => (n / 1000000).toFixed(2) + "M",
  },
  {
    code: "PLATE II",
    target: 22,
    prefix: "DEPTH ",
    suffix: "",
    label: "Search Horizon",
    detail: "Multi-threaded WASM search horizon",
    barFill: 88,
    accent: "#06b6d4",
    format: (n) => String(Math.floor(n)),
  },
  {
    code: "PLATE III",
    target: 14,
    prefix: "< ",
    suffix: "ms",
    label: "Compute Latency",
    detail: "Zero round-trip server overhead",
    barFill: 96,
    accent: "#10b981",
    format: (n) => String(Math.floor(n)),
  },
  {
    code: "PLATE IV",
    target: 2500,
    prefix: "",
    suffix: "+",
    label: "Grandmaster Tactics",
    detail: "Verified tactical combination motifs",
    barFill: 90,
    accent: "#f59e0b",
    format: (n) => (n / 1000).toFixed(1) + "k",
  },
  {
    code: "PLATE V",
    target: 100,
    prefix: "",
    suffix: "%",
    label: "Client-Side Privacy",
    detail: "100% local WASM binary execution",
    barFill: 100,
    accent: "#fb7185",
    format: (n) => String(Math.floor(n)),
  },
];

export default function MetricsStrip() {
  const [animated, setAnimated] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [values, setValues] = useState(METRICS.map(() => 0));
  const containerRef = useRef(null);
  const { handleMouseMove } = useSpecularSpotlight();

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !animated) {
          setAnimated(true);

          const startTime = performance.now();
          const duration = 1800;

          const updateCounter = (now) => {
            const elapsed = now - startTime;
            const progress = Math.min(1, elapsed / duration);
            const eased = progress === 1 ? 1 : 1 - Math.pow(2, -10 * progress);

            setValues(METRICS.map((m) => m.target * eased));

            if (progress < 1) {
              requestAnimationFrame(updateCounter);
            }
          };

          requestAnimationFrame(updateCounter);
        }
      },
      { threshold: 0.2 }
    );

    if (containerRef.current) {
      observer.observe(containerRef.current);
    }

    return () => observer.disconnect();
  }, [animated]);

  return (
    <section className="metrics-strip-section" ref={containerRef}>
      <div className="metrics-strip-container">
        <div className="metrics-monolith">
          <div className="metrics-monolith-topbar">
            <div className="metrics-topbar-left">
              <span className="metrics-live-dot" />
              <span>STUDIO BENCHMARKS · STOCKFISH 17 WASM ARCHIVE</span>
            </div>
            <div className="metrics-topbar-right">
              <button
                type="button"
                className={`metrics-toggle-pill ${isExpanded ? "active" : ""}`}
                onClick={() => setIsExpanded(!isExpanded)}
                aria-expanded={isExpanded}
                title="Toggle detailed benchmark telemetry"
              >
                <BarChart2 size={13} />
                <span>{isExpanded ? "Hide Benchmark Cards" : "Expand Full Benchmarks (5 Nodes)"}</span>
                <ChevronDown size={14} className={`metrics-chevron ${isExpanded ? "rotated" : ""}`} />
              </button>
            </div>
          </div>

          {!isExpanded ? (
            /* Clean, Uncluttered 1-Line Summary Ribbon */
            <div
              className="metrics-summary-ribbon"
              onClick={() => setIsExpanded(true)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') setIsExpanded(true); }}
              title="Click to expand detailed benchmark cards"
            >
              <div className="metrics-ribbon-items">
                {METRICS.map((m, i) => (
                  <div key={m.code} className="metrics-ribbon-item">
                    <span className="m-ribbon-dot" style={{ background: m.accent }} />
                    <strong className="m-ribbon-val">{m.prefix}{m.format(values[i])}{m.suffix}</strong>
                    <span className="m-ribbon-lbl">{m.label}</span>
                  </div>
                ))}
              </div>
              <div className="metrics-ribbon-prompt">
                <span>View Full Nodes</span>
                <ChevronDown size={13} />
              </div>
            </div>
          ) : (
            /* Detailed 5-Card Telemetry Grid */
            <div className="metrics-grid">
              {METRICS.map((m, i) => (
                <div
                  key={m.code}
                  className="metric-box interactive-specular-card"
                  onMouseMove={handleMouseMove}
                  style={{ "--m-accent": m.accent }}
                >
                  <div className="metric-cell-top">
                    <span className="metric-code">{m.code}</span>
                    <span className="metric-status-tag">VERIFIED</span>
                  </div>

                  <div className="metric-number-row">
                    <span className="metric-prefix">{m.prefix}</span>
                    <span className="metric-number">{m.format(values[i])}</span>
                    <span className="metric-suffix">{m.suffix}</span>
                  </div>

                  <div className="metric-label">{m.label}</div>
                  <div className="metric-detail">{m.detail}</div>

                  <div className="metric-bar-track" aria-hidden="true">
                    <div
                      className="metric-bar-fill"
                      style={{
                        width: animated ? `${m.barFill}%` : "0%",
                        background: m.accent,
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
