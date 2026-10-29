import React, { useEffect } from "react";
import { Routes, Route, useLocation } from "react-router-dom";
import Navbar from "./Components/Navbar/Navbar";
import { Footer } from "./Components/Footer/Footer";
import ProtectedRoute from "./Components/ProtectedRoute/ProtectedRoute";
import './index.css';

import Home from "./Pages/Home/Home";
import TournamentsPage from "./Pages/TournamentsPage/TournamentsPage";
import GameViewPage from "./Pages/GameViewPage/GameViewPage";
import SignInPage from "./Pages/SignInPage/SignInPage";
import SignUpPage from "./Pages/SignUpPage/SignUpPage";
import OAuthCallbackPage from "./Pages/OAuthCallbackPage/OAuthCallbackPage";
import ProfilePage from "./Pages/ProfilePage/ProfilePage";
import PuzzlesPage from "./Pages/PuzzlesPage";
import PuzzleRushPage from "./Pages/PuzzleRushPage";
import PuzzleSurvivalPage from "./Pages/PuzzleSurvivalPage";
import PuzzleRatedPage from "./Pages/PuzzleRatedPage";
import PuzzleThemedPage from "./Pages/PuzzleThemedPage";
import PuzzleStatsPage from "./Pages/PuzzleStatsPage";
import LeaderboardPage from "./Pages/LeaderboardPage";
import PuzzleCuratedPage from "./Pages/PuzzleCuratedPage";
import BotsPage from "./Pages/BotsPage";
import BotGamePage from "./Pages/BotGamePage";
import GameAnalysisPage from "./Pages/GameAnalysisPage";
import OnlineGamePage from "./Pages/OnlineGamePage";
import CustomizePage from "./Pages/CustomizePage";
import ArtCinemaPage from "./Pages/ArtCinemaPage/ArtCinemaPage";
import AcademyPage from "./Pages/AcademyPage";
import GuidedTourWizard from "./Components/Tour/GuidedTourWizard";
import ErrorBoundary from "./Components/common/ErrorBoundary";
import ScrollToTop from "./Components/common/ScrollToTop";
import { BoardCustomizationProvider } from "./contexts/BoardCustomizationContext";

export default function App() {
  const location = useLocation();
  const isHome = location.pathname === "/";

  // Instantly cancel any speech synthesis narration whenever navigating between pages
  useEffect(() => {
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.cancel();
    }
  }, [location.pathname]);

  return (
    <BoardCustomizationProvider>
      <ScrollToTop />
      <div className={`app-container ${isHome ? "app-home" : "app-subpage"}`}>
        <Navbar />
        <div className="main-content">
          <ErrorBoundary>
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/auth-success" element={<OAuthCallbackPage />} />
              <Route path="/tournaments" element={<TournamentsPage />} />
              <Route path="/game/:roundId/:gameIndex" element={<GameViewPage />} />
              <Route path="/signin" element={<SignInPage />} />
              <Route path="/signup" element={<SignUpPage />} />
              <Route path="/profile" element={<ProfilePage />} />
              <Route path="/puzzles" element={<PuzzlesPage />} />
              <Route path="/puzzles/rush" element={<PuzzleRushPage />} />
              <Route path="/puzzles/survival" element={<PuzzleSurvivalPage />} />
              <Route path="/puzzles/rating" element={<PuzzleRatedPage />} />
              <Route path="/puzzles/themed" element={<PuzzleThemedPage />} />
              <Route path="/puzzles/stats" element={<PuzzleStatsPage />} />
              <Route path="/puzzles/leaderboard" element={<LeaderboardPage />} />
              <Route
                path="/puzzles/curated"
                element={
                  <ProtectedRoute>
                    <PuzzleCuratedPage />
                  </ProtectedRoute>
                }
              />
              <Route path="/bots" element={<BotsPage />} />
              <Route path="/bots/play/:botId" element={<BotGamePage />} />
              <Route path="/analysis" element={<GameAnalysisPage />} />
              <Route path="/play/online" element={<OnlineGamePage />} />
              <Route path="/customize" element={<CustomizePage />} />
              <Route path="/art" element={<ArtCinemaPage />} />
              <Route path="/academy" element={<AcademyPage />} />
              <Route path="*" element={<Home />} />
            </Routes>
          </ErrorBoundary>
        </div>
        <Footer />
        <GuidedTourWizard />
      </div>
    </BoardCustomizationProvider>
  );
}
