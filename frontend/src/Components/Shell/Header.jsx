import React, { useState, useRef, useEffect } from 'react';
import { useLocation, Link, useNavigate } from 'react-router-dom';
import {
  Menu,
  Sun,
  Moon,
  ChevronDown,
  User,
  Palette,
  LogOut,
  LogIn,
  ExternalLink,
  ChevronRight,
  ShieldCheck
} from 'lucide-react';
import { useTheme } from '../../contexts/ThemeContext';
import { useAuth } from '../../contexts/AuthContext';
import Button from '../UI/Button';

const ROUTE_META = {
  '/': { title: 'Overview', section: 'ChessPulse' },
  '/tournaments': { title: 'Live Tournaments', section: 'Broadcasts' },
  '/analysis': { title: 'Game Analysis', section: 'Stockfish 17' },
  '/puzzles': { title: 'Tactics Trainer', section: 'Puzzles' },
  '/puzzles/rush': { title: 'Puzzle Rush', section: 'Puzzles' },
  '/puzzles/survival': { title: '3-Life Survival', section: 'Puzzles' },
  '/puzzles/rating': { title: 'Rated Puzzles', section: 'Puzzles' },
  '/puzzles/themed': { title: 'Tactical Motifs', section: 'Puzzles' },
  '/puzzles/curated': { title: 'Pulse', section: 'Chess Training' },
  '/puzzles/stats': { title: 'Stats', section: 'Puzzles' },
  '/puzzles/leaderboard': { title: 'Leaderboard', section: 'Puzzles' },
  '/bots': { title: 'AI Opponents', section: 'Sparring' },
  '/play/online': { title: 'Play Online', section: 'Multiplayer' },
  '/profile': { title: 'Profile', section: 'Account' },
  '/customize': { title: 'Board Customizer', section: 'Appearance' },
  '/signin': { title: 'Sign In', section: 'Account' },
  '/signup': { title: 'Register', section: 'Account' }
};

export default function Header({ onToggleSidebar }) {
  const location = useLocation();
  const navigate = useNavigate();
  const { darkMode, toggleDarkMode } = useTheme();
  const { user, isAuthenticated, logout } = useAuth();
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  const currentPath = location.pathname;
  const meta = ROUTE_META[currentPath] || {
    title: currentPath.split('/')[1]?.toUpperCase() || 'Workspace',
    section: 'ChessPulse'
  };

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setUserDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = async () => {
    await logout();
    setUserDropdownOpen(false);
    navigate('/');
  };

  return (
    <header className="sticky top-0 z-30 h-16 w-full bg-white/80 dark:bg-[#0B0F19]/80 backdrop-blur-xl border-b border-gray-200 dark:border-white/[0.08] px-4 lg:px-6 flex items-center justify-between transition-colors">
      {/* Left: Mobile Toggle & Breadcrumbs */}
      <div className="flex items-center gap-3">
        <button
          onClick={onToggleSidebar}
          className="lg:hidden p-2 rounded-xl text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-white/[0.06] transition-colors"
          aria-label="Toggle navigation"
        >
          <Menu className="w-5 h-5" />
        </button>

        {/* Dynamic Breadcrumbs */}
        <div className="flex items-center gap-2 text-xs">
          <span className="text-gray-400 dark:text-gray-500 font-mono hidden sm:inline">
            {meta.section}
          </span>
          <ChevronRight className="w-3.5 h-3.5 text-gray-300 dark:text-gray-600 hidden sm:inline" />
          <h1 className="text-sm font-semibold text-gray-900 dark:text-gray-100 tracking-tight">
            {meta.title}
          </h1>
        </div>
      </div>

      {/* Right Action Strip */}
      <div className="flex items-center gap-2.5">
        {/* Theme Toggle Button */}
        <button
          onClick={toggleDarkMode}
          className="p-2 rounded-xl text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-white/[0.06] border border-gray-200 dark:border-white/[0.08] transition-colors cursor-pointer"
          title={`Switch to ${darkMode ? 'Light' : 'Dark'} mode`}
          aria-label="Toggle Theme"
        >
          {darkMode ? (
            <Sun className="w-4 h-4 text-amber-400 animate-spin-slow" />
          ) : (
            <Moon className="w-4 h-4 text-indigo-500" />
          )}
        </button>

        {/* User Pill & Dropdown */}
        {isAuthenticated ? (
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setUserDropdownOpen(!userDropdownOpen)}
              className="flex items-center gap-2 pl-1 pr-2.5 py-1 rounded-full bg-gray-100 dark:bg-white/[0.06] hover:bg-gray-200 dark:hover:bg-white/[0.1] border border-gray-200 dark:border-white/[0.08] transition-all cursor-pointer"
            >
              <div className="w-6 h-6 rounded-full bg-gradient-to-tr from-violet-600 to-cyan-500 text-white flex items-center justify-center font-bold text-xs select-none shadow-sm">
                {user?.username ? user.username.charAt(0).toUpperCase() : 'U'}
              </div>
              <span className="text-xs font-medium text-gray-800 dark:text-gray-200 hidden md:inline">
                {user?.username || 'Account'}
              </span>
              <ChevronDown className="w-3.5 h-3.5 text-gray-400" />
            </button>

            {userDropdownOpen && (
              <div className="absolute right-0 mt-2 w-56 rounded-2xl bg-white dark:bg-[#111827] border border-gray-200 dark:border-white/[0.08] shadow-2xl py-1.5 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                <div className="px-4 py-3 border-b border-gray-100 dark:border-white/[0.06]">
                  <p className="text-xs font-medium text-gray-900 dark:text-gray-100">
                    {user?.username}
                  </p>
                  <p className="text-[11px] font-mono text-gray-400 dark:text-gray-500 truncate mt-0.5">
                    {user?.email}
                  </p>
                </div>

                <div className="py-1">
                  <Link
                    to="/profile"
                    onClick={() => setUserDropdownOpen(false)}
                    className="flex items-center gap-2.5 px-4 py-2 text-xs text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-white/[0.06]"
                  >
                    <User className="w-3.5 h-3.5 text-violet-500" />
                    <span>My Profile & Rating Dossier</span>
                  </Link>

                  <Link
                    to="/customize"
                    onClick={() => setUserDropdownOpen(false)}
                    className="flex items-center gap-2.5 px-4 py-2 text-xs text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-white/[0.06]"
                  >
                    <Palette className="w-3.5 h-3.5 text-cyan-500" />
                    <span>Board Studio & Customization</span>
                  </Link>
                </div>

                <div className="border-t border-gray-100 dark:border-white/[0.06] pt-1">
                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center gap-2.5 px-4 py-2 text-xs text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-500/10 text-left transition-colors"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    <span>Sign Out</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        ) : (
          <Link
            to="/signin"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white shadow-sm shadow-violet-500/20 border border-violet-500/30 transition-all"
          >
            <LogIn className="w-3.5 h-3.5" />
            <span>Sign In</span>
          </Link>
        )}
      </div>
    </header>
  );
}
