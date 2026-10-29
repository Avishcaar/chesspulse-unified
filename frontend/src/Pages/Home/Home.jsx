import React from "react";
import PageLoader from "../../Components/PageLoader/PageLoader";
import Hero from "../../Components/Hero/Hero";
import FeatureBand from "../../Components/FeatureBand/FeatureBand";
import ChessArtCinematic from "../../Components/ChessArtCinematic/ChessArtCinematic";
import EvalSection from "../../Components/EvalSection/EvalSection";
import LiveGame from "../../Components/LiveGame/LiveGame";
import Rankings from "../../Components/Rankings/Rankings";

export default function Home() {
  return (
    <>
      {/* Intro Telemetry Loader */}
      <PageLoader />

      {/* Hero with Interactive Canvas, Typographic Watermark & 3D Centerpiece */}
      <Hero />

      {/* 4-Card Curated Exhibition Gallery */}
      <FeatureBand />

      {/* Interactive Living Canvas: 2.5D Optical Parallax & Cinematic Story */}
      <ChessArtCinematic />

      {/* Interactive Telemetry Workstation Preview */}
      <EvalSection />

      {/* Live Grandmaster Arena TV Streams */}
      <LiveGame />

      {/* World Grandmaster Leaderboard */}
      <Rankings />

    </>
  );
}
