import React from "react";
import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import ChessArtCinematic from "../../Components/ChessArtCinematic/ChessArtCinematic";

export default function ArtCinemaPage() {
  return (
    <div className="art-cinema-page min-h-screen bg-[#080706] pt-24 pb-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 mb-6">
        <Link
          to="/"
          className="inline-flex items-center gap-2 text-stone-400 hover:text-stone-200 text-sm font-medium transition-colors"
        >
          <ArrowLeft size={16} />
          <span>Return to ChessPulse</span>
        </Link>
      </div>

      <ChessArtCinematic />
    </div>
  );
}
