import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Chess } from 'chess.js';
import {
  X,
  Play,
  ArrowRight,
  FileCode2,
  Swords
} from 'lucide-react';
import './RecruiterSandboxModal.css';

const PRESET_GAMES = [
  {
    id: 'kasparov',
    title: 'Kasparov vs. Topalov (1999)',
    subtitle: 'Wijk aan Zee — The immortal rook sacrifice 24.Rxd4!!',
    event: 'Hoogovens Wijk aan Zee 1999',
    white: 'Garry Kasparov (2812)',
    black: 'Veselin Topalov (2700)',
    result: '1-0',
    moves: [
      'e4', 'd6', 'd4', 'Nf6', 'Nc3', 'g6', 'Be3', 'Bg7', 'Qd2', 'c6',
      'f3', 'b5', 'Nge2', 'Nbd7', 'Bh6', 'Bxh6', 'Qxh6', 'Bb7', 'a3', 'e5',
      'O-O-O', 'Qe7', 'Kb1', 'a6', 'Nc1', 'O-O-O', 'Nb3', 'exd4', 'Rxd4', 'c5',
      'Rd1', 'Nb6', 'g3', 'Kb8', 'Na5', 'Ba8', 'Bh3', 'd5', 'Qf4+', 'Ka7',
      'Rhe1', 'd4', 'Nd5', 'Nbxd5', 'exd5', 'Qd6', 'Rxd4', 'cxd4', 'Re7+', 'Kb6',
      'Qxd4+', 'Kxa5', 'b4+', 'Ka4', 'Qc3', 'Qxd5', 'Ra7', 'Bb7', 'Rxb7', 'Qc4'
    ]
  },
  {
    id: 'fischer',
    title: 'Fischer vs. Byrne (1956)',
    subtitle: 'Game of the Century — 13-year-old Fischer Queen sacrifice 17...Be6!!',
    event: 'Rosenwald Memorial, New York 1956',
    white: 'Donald Byrne',
    black: 'Bobby Fischer (13 yo)',
    result: '0-1',
    moves: [
      'Nf3', 'Nf6', 'c4', 'g6', 'Nc3', 'Bg7', 'd4', 'O-O', 'Bf4', 'd5',
      'Qb3', 'dxc4', 'Qxc4', 'c6', 'e4', 'Nbd7', 'Rd1', 'Nb6', 'Qc5', 'Bg4',
      'Bg5', 'Na4', 'Qa3', 'Nxc3', 'bxc3', 'Nxe4', 'Bxe7', 'Qb6', 'Bc4', 'Nxc3',
      'Bc5', 'Rfe8+', 'Kf1', 'Be6', 'Bxb6', 'Bxc4+', 'Kg1', 'Ne2+', 'Kf1', 'Nxd4+',
      'Kg1', 'Ne2+', 'Kf1', 'Nc3+', 'Kg1', 'axb6', 'Qb4', 'Ra4', 'Qxb6', 'Nxd1',
      'h3', 'Rxa2', 'Kh2', 'Nxf2', 'Re1', 'Rxe1', 'Qd8+', 'Bf8', 'Nxe1', 'Bd5',
      'Nf3', 'Ne4', 'Qb8', 'b5', 'Ne5', 'Kg7', 'Nd7', 'Bd6+'
    ]
  },
  {
    id: 'opera',
    title: 'Morphy Opera Game (1858)',
    subtitle: 'Paris Opera — Rapid piece development and queen sacrifice mate',
    event: 'Paris Opera House 1858',
    white: 'Paul Morphy',
    black: 'Duke of Brunswick & Count Isouard',
    result: '1-0',
    moves: [
      'e4', 'e5', 'Nf3', 'd6', 'd4', 'Bg4', 'dxe5', 'Bxf3', 'Qxf3', 'dxe5',
      'Bc4', 'Nf6', 'Qb3', 'Qe7', 'Nc3', 'c6', 'Bg5', 'b5', 'Nxb5', 'cxb5',
      'Bxb5+', 'Nbd7', 'O-O-O', 'Rd8', 'Rxd7', 'Rxd7', 'Rd1', 'Qe6', 'Bxf6', 'gxf6',
      'Bxd7+', 'Qxd7', 'Rxd7', 'Kxd7', 'Qxf7+'
    ]
  }
];

export default function RecruiterSandboxModal({ isOpen, onClose }) {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('masterpieces'); // 'masterpieces' | 'pgn'
  const [customPgn, setCustomPgn] = useState('');
  const [errorMessage, setErrorMessage] = useState(null);

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleLaunchScenario = (scenario) => {
    onClose();
    navigate('/analysis', {
      state: {
        moves: scenario.moves,
        white: scenario.white,
        black: scenario.black,
        event: scenario.event,
        result: scenario.result,
        source: 'sandbox'
      }
    });
  };

  const handleCustomUpload = () => {
    setErrorMessage(null);
    if (!customPgn.trim()) {
      setErrorMessage('Please enter or paste PGN moves.');
      return;
    }

    try {
      const chess = new Chess();
      let loaded = false;
      if (typeof chess.loadPgn === 'function') {
        loaded = chess.loadPgn(customPgn);
      } else if (typeof chess.load_pgn === 'function') {
        loaded = chess.load_pgn(customPgn);
      }

      const history = chess.history();
      if (!loaded || history.length === 0) {
        setErrorMessage('Invalid PGN format. Could not parse legal moves.');
        return;
      }

      onClose();
      navigate('/analysis', {
        state: {
          moves: history,
          white: (chess.header && chess.header().White) || 'White',
          black: (chess.header && chess.header().Black) || 'Black',
          event: (chess.header && chess.header().Event) || 'Custom Game',
          result: (chess.header && chess.header().Result) || '*',
          source: 'custom_pgn'
        }
      });
    } catch (e) {
      setErrorMessage('Could not parse PGN: ' + e.message);
    }
  };

  return (
    <div className="sandbox-modal-backdrop" onClick={onClose}>
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 16 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 16 }}
        transition={{ type: 'spring', damping: 25, stiffness: 320 }}
        className="sandbox-modal-window"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="sandbox-modal-header">
          <div className="sandbox-title-col">
            <h2 className="sandbox-title">Guest Studio</h2>
            <p className="sandbox-subtitle">
              Test drive client-side Stockfish 17 analysis on a grandmaster masterpiece or your own PGN.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="sandbox-close-btn"
            aria-label="Close"
          >
            <X size={18} />
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="sandbox-mode-tabs">
          <button
            type="button"
            className={`sandbox-tab-pill ${activeTab === 'masterpieces' ? 'active' : ''}`}
            onClick={() => {
              setActiveTab('masterpieces');
              setErrorMessage(null);
            }}
          >
            <Swords size={13} />
            <span>Grandmaster Games</span>
          </button>
          <button
            type="button"
            className={`sandbox-tab-pill ${activeTab === 'pgn' ? 'active' : ''}`}
            onClick={() => {
              setActiveTab('pgn');
              setErrorMessage(null);
            }}
          >
            <FileCode2 size={13} />
            <span>Paste PGN</span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="sandbox-modal-body">
          {activeTab === 'masterpieces' ? (
            <div className="scenarios-list">
              {PRESET_GAMES.map((game) => (
                <div
                  key={game.id}
                  className="scenario-clean-card"
                  onClick={() => handleLaunchScenario(game)}
                >
                  <div className="scenario-card-info">
                    <div className="scenario-card-header">
                      <h4 className="scenario-name">{game.title}</h4>
                      <span className="scenario-result-chip">{game.result}</span>
                    </div>
                    <p className="scenario-desc">{game.subtitle}</p>
                    <div className="scenario-meta-line">
                      <span>{game.event}</span>
                      <span>·</span>
                      <span>{game.moves.length} moves</span>
                    </div>
                  </div>
                  <button
                    type="button"
                    className="scenario-launch-action"
                    title="Launch analysis"
                  >
                    <span>Analyze</span>
                    <ArrowRight size={14} />
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <div className="custom-pgn-form">
              <textarea
                className="sandbox-pgn-textarea"
                rows={5}
                placeholder='Paste PGN here... e.g. 1. e4 e5 2. Nf3 Nc6 3. Bb5 a6...'
                value={customPgn}
                onChange={(e) => {
                  setCustomPgn(e.target.value);
                  setErrorMessage(null);
                }}
              />

              {errorMessage && (
                <div className="sandbox-error-notice">
                  {errorMessage}
                </div>
              )}

              <div className="custom-pgn-actions">
                <button
                  type="button"
                  className="sandbox-launch-btn"
                  onClick={handleCustomUpload}
                >
                  <Play size={14} />
                  <span>Analyze PGN</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}
