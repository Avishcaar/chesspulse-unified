import React from 'react';
import { Link } from 'react-router-dom';
import './footer.css';

export const Footer = () => {
    return (
        <footer className="footer-modern">
            <div className="footer-container">
                <div className="footer-grid">
                    {/* Brand & Description */}
                    <div className="footer-brand-col">
                        <Link to="/" className="footer-brand-link">
                            <span className="footer-logo">
                                Chess<span className="footer-logo-accent">Pulse</span>
                            </span>
                        </Link>

                        <p className="footer-statement">
                            High-performance in-browser chess analysis, grandmaster broadcasts, and tactical training powered by Stockfish 17 WebAssembly.
                        </p>

                        <div className="footer-status-tag">
                            <span className="footer-status-dot" />
                            <span>Stockfish 17 WASM Active</span>
                        </div>
                    </div>

                    {/* Platform */}
                    <div className="footer-links-col">
                        <h4 className="footer-col-title">Platform</h4>
                        <nav className="footer-nav-list">
                            <Link to="/analysis">Position Analysis</Link>
                            <Link to="/academy">Chess Academy</Link>
                            <Link to="/tournaments">FIDE Broadcasts</Link>
                            <Link to="/play/online">Play Online</Link>
                            <Link to="/customize">Board Customizer</Link>
                        </nav>
                    </div>

                    {/* Puzzles */}
                    <div className="footer-links-col">
                        <h4 className="footer-col-title">Puzzles</h4>
                        <nav className="footer-nav-list">
                            <Link to="/puzzles">Daily Puzzles</Link>
                            <Link to="/puzzles/rush">Puzzle Rush</Link>
                            <Link to="/puzzles/survival">Survival</Link>
                            <Link to="/puzzles/themed">Tactical Motifs</Link>
                        </nav>
                    </div>

                    {/* Practice */}
                    <div className="footer-links-col">
                        <h4 className="footer-col-title">Practice</h4>
                        <nav className="footer-nav-list">
                            <Link to="/bots">Play vs AI Bots</Link>
                            <Link to="/puzzles/rating">Rated Training</Link>
                            <Link to="/puzzles/leaderboard">Leaderboard</Link>
                            <a
                                href="https://github.com/aavishkark/ChessPulse"
                                target="_blank"
                                rel="noreferrer"
                            >
                                GitHub Source
                            </a>
                        </nav>
                    </div>
                </div>

                {/* Bottom Bar */}
                <div className="footer-bottom-bar">
                    <div className="footer-copyright">
                        © {new Date().getFullYear()} ChessPulse. All rights reserved.
                    </div>
                    <div className="footer-bottom-meta">
                        <span>Stockfish 17 NNUE · WebAssembly · Client-Side</span>
                    </div>
                </div>
            </div>
        </footer>
    );
};

export default Footer;
