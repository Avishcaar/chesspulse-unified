import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import {
  Layers,
  Zap,
  Flame,
  TrendingUp,
  Target,
  Cpu,
  BarChart3,
  Trophy
} from 'lucide-react';
import './PuzzleSubnav.css';

const PUZZLE_TABS = [
  {
    path: '/puzzles',
    label: 'Daily Lab',
    icon: Layers,
    exact: true
  },
  {
    path: '/puzzles/rush',
    label: 'Puzzle Rush',
    icon: Zap
  },
  {
    path: '/puzzles/survival',
    label: '3-Life Survival',
    icon: Flame
  },
  {
    path: '/puzzles/rating',
    label: 'Rated ELO Track',
    icon: TrendingUp
  },
  {
    path: '/puzzles/themed',
    label: '11 Motif Lab',
    icon: Target
  },
  {
    path: '/puzzles/curated',
    label: 'Pulse',
    icon: Cpu
  },
  {
    path: '/puzzles/stats',
    label: 'Analytics',
    icon: BarChart3
  },
  {
    path: '/puzzles/leaderboard',
    label: 'Standings',
    icon: Trophy
  }
];

export default function PuzzleSubnav() {
  const { isAuthenticated } = useAuth();
  const visibleTabs = PUZZLE_TABS.filter(
    (tab) => tab.path !== '/puzzles/curated' || isAuthenticated
  );

  return (
    <nav className="puzzle-subnav-strip" aria-label="Tactical Training Modes">
      <div className="puzzle-subnav-scroll">
        {visibleTabs.map((tab) => {
          const Icon = tab.icon;
          return (
            <NavLink
              key={tab.path}
              to={tab.path}
              end={tab.exact}
              className={({ isActive }) =>
                `puzzle-subnav-pill ${isActive ? 'active' : ''}`
              }
            >
              <span className="subnav-pill-icon">
                <Icon size={14} />
              </span>
              <span className="subnav-pill-label">{tab.label}</span>
            </NavLink>
          );
        })}
      </div>
    </nav>
  );
}
