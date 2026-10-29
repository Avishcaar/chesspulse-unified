import React, { useState } from "react";
import { Link } from "react-router-dom";
import { ArrowUpRight } from "lucide-react";
import { StauntonPiece } from "../Hero/ChessPiecesSVG";
import { useSpecularSpotlight } from "../../utils/useSpecularSpotlight";
import { useGsapChapterReveal } from "../../utils/useGsapReveal";
import "./featureband.css";

const EXHIBITION_ITEMS = [
  {
    num: "01",
    tag: "ENGINE ROOM",
    archiveRef: "PLATE 17 · WASM NNUE",
    titlePrefix: "Stockfish 17",
    titleAccent: "Analysis",
    desc: "Depth-22 NNUE evaluation running entirely client-side in WebAssembly with zero server latency.",
    metric: "1.45M+",
    metricLabel: "Positions / sec",
    piece: "queen",
    theme: "engine",
    accent: "#f43f5e",
    link: "/analysis",
  },
  {
    num: "02",
    tag: "CHAMPIONSHIPS",
    archiveRef: "FIDE · WORLD BROADCASTS",
    titlePrefix: "World",
    titleAccent: "Broadcasts",
    desc: "Official FIDE World Championship streams, live game clocks, and synchronized board feeds.",
    metric: "< 14ms",
    metricLabel: "Sync Latency",
    piece: "king",
    theme: "gold",
    accent: "#06b6d4",
    link: "/tournaments",
  },
  {
    num: "03",
    tag: "TACTICS",
    archiveRef: "REPERTOIRE · 2,500+ MOTIFS",
    titlePrefix: "Tactics &",
    titleAccent: "Motifs",
    desc: "Curated grandmaster combinations, timed Puzzle Rush runs, and motif-specific drill sets.",
    metric: "99.4%",
    metricLabel: "Drill Accuracy",
    piece: "knight",
    theme: "classic",
    accent: "#10b981",
    link: "/puzzles",
  },
  {
    num: "04",
    tag: "AUTOMATA",
    archiveRef: "SPARRING · 400-2400 ELO",
    titlePrefix: "Sparring",
    titleAccent: "Bots",
    desc: "Calibrated AI opponents ranging from club sparring partners to master-strength engines.",
    metric: "7 Bots",
    metricLabel: "Calibrated ELO",
    piece: "rook",
    theme: "blitz",
    accent: "#f59e0b",
    link: "/bots",
  },
];

export default function FeatureBand() {
  const [hoveredIdx, setHoveredIdx] = useState(null);
  const { handleMouseMove } = useSpecularSpotlight();
  const chapterRef = useGsapChapterReveal();

  return (
    <section className="cp-studio-section feature-band-section">
      <div className="cp-studio-container">
        {/* Chapter Header */}
        <div className="cp-chapter-header" ref={chapterRef}>
          <div className="cp-chapter-meta">
            <span className="cp-chapter-index">
              <span className="cp-chapter-index-dot" />
              EXHIBITION GALLERIES
            </span>
          </div>
          <div className="cp-chapter-main">
            <h2 className="cp-chapter-title art-editorial-title">
              Crafted for Speed & <span className="art-italic cp-chapter-title-accent">Precision</span>
            </h2>
            <p className="cp-chapter-desc">
              Explore the four core interactive modules curated inside the ChessPulse studio.
            </p>
          </div>
        </div>

        {/* 4-Card Editorial Exhibition Gallery */}
        <div className="exhibition-gallery-grid">
          {EXHIBITION_ITEMS.map((item, idx) => {
            const isHovered = hoveredIdx === idx;

            return (
              <Link
                to={item.link}
                key={item.num}
                className={`exhibition-card interactive-specular-card ${isHovered ? "is-hovered" : ""}`}
                onMouseEnter={() => setHoveredIdx(idx)}
                onMouseLeave={() => setHoveredIdx(null)}
                onMouseMove={handleMouseMove}
                style={{
                  "--card-accent": item.accent,
                }}
              >
                {/* Subtle Ambient Accent Glow */}
                <div className="exhibition-card-glow" aria-hidden="true" />

                {/* Card Top: Garamond Italic Numeral + Badge */}
                <div className="exhibition-card-top">
                  <span className="exhibition-card-num">{item.num}</span>
                  <span className="exhibition-card-tag">{item.tag}</span>
                </div>

                {/* Center Visual: Curated Staunton Piece in Atmospheric Halo */}
                <div className="exhibition-piece-window">
                  <div className="exhibition-piece-halo" />
                  <div className="exhibition-piece-archival-backdrop">
                    <div className="piece-archival-ring" />
                    <span className="piece-archival-stamp">{item.archiveRef}</span>
                  </div>
                  <div className="exhibition-piece-render">
                    <StauntonPiece
                      type={item.piece}
                      theme={item.theme}
                      size={96}
                      uid={`exhibition-${item.num}`}
                    />
                  </div>
                </div>

                {/* Content: Editorial Title & 1-line summary */}
                <div className="exhibition-card-body">
                  <h3 className="exhibition-card-title">
                    {item.titlePrefix}{" "}
                    <span className="art-italic exhibition-title-italic">{item.titleAccent}</span>
                  </h3>
                  <p className="exhibition-card-desc">{item.desc}</p>
                </div>

                {/* Bottom Footer: Metric Telemetry + Action Pill */}
                <div className="exhibition-card-footer">
                  <div className="exhibition-metric-wrap">
                    <span className="exhibition-metric-val">{item.metric}</span>
                    <span className="exhibition-metric-lbl">{item.metricLabel}</span>
                  </div>
                  <div className="exhibition-arrow-pill" aria-hidden="true">
                    <span>View</span>
                    <ArrowUpRight size={15} />
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}
