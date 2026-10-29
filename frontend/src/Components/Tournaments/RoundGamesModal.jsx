import { useState, useEffect } from 'react';
import { X, Radio } from 'lucide-react';
import { fetchRoundGames, splitGames } from '../../utils/pgnStream';
import { parsePlayerNames, getGameResult } from '../../utils/pgnParser';
import ChessLoader from '../ChessLoader/ChessLoader';
import './round-games-modal.css';

const RoundGamesModal = ({ roundId, roundName, isOpen, onClose, onSelectGame }) => {
    const [games, setGames] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        if (!isOpen || !roundId) return;

        setLoading(true);
        setError(null);

        let cleanupFn = null;

        (async () => {
            try {
                cleanupFn = await fetchRoundGames(roundId, (buffer) => {
                    const gamesParsed = splitGames(buffer);

                    const gamesData = gamesParsed.map((pgn, index) => {
                        const { white, black } = parsePlayerNames(pgn);
                        const result = getGameResult(pgn);

                        return {
                            index,
                            white: white || 'White',
                            black: black || 'Black',
                            result,
                            isLive: result === null || result === '*'
                        };
                    });

                    setGames(gamesData);
                    setLoading(false);
                });
            } catch (err) {
                console.error('Error loading games:', err);
                setError('Failed to load games');
                setLoading(false);
            }
        })();

        return () => {
            if (cleanupFn && typeof cleanupFn === 'function') {
                cleanupFn();
            }
        };
    }, [isOpen, roundId]);

    const handleGameClick = (gameIndex) => {
        onSelectGame(roundId, gameIndex);
        onClose();
    };

    if (!isOpen) return null;

    return (
        <div className="round-games-modal-overlay" onClick={onClose}>
            <div className="round-games-modal" onClick={(e) => e.stopPropagation()}>
                <div className="round-games-header">
                    <div className="round-header-left">
                        <span className="round-kicker">
                            <Radio size={13} className="round-kicker-icon" />
                            <span>ROUND BROADCAST BOARDS</span>
                        </span>
                        <h2 className="round-title">{roundName || 'Round Games'}</h2>
                    </div>
                    <button
                        type="button"
                        className="modal-close-icon-btn"
                        onClick={onClose}
                        aria-label="Close modal"
                    >
                        <X size={18} />
                    </button>
                </div>

                {loading && (
                    <div className="loading-state">
                        <ChessLoader text="Syncing live broadcast boards..." />
                    </div>
                )}

                {error && (
                    <div className="error-state">
                        <p>{error}</p>
                    </div>
                )}

                {!loading && !error && games.length === 0 && (
                    <div className="empty-state">
                        <p>No games currently recorded for this round.</p>
                    </div>
                )}

                {!loading && !error && games.length > 0 && (
                    <div className="games-grid">
                        {games.map((game) => (
                            <div
                                key={game.index}
                                className="game-card"
                                onClick={() => handleGameClick(game.index)}
                            >
                                <div className="game-card-topbar">
                                    <span className="game-board-index">Board {game.index + 1}</span>
                                    {game.isLive ? (
                                        <span className="game-live-pill">
                                            <span className="live-dot" /> LIVE
                                        </span>
                                    ) : (
                                        <span className="game-result-pill">
                                            {game.result}
                                        </span>
                                    )}
                                </div>

                                <div className="game-matchup">
                                    <div className="modal-player white-player">
                                        <span className="stone-dot white" />
                                        <span className="modal-player-name">{game.white}</span>
                                    </div>

                                    <div className="game-vs-row">
                                        <span className="vs-text">vs</span>
                                    </div>

                                    <div className="modal-player black-player">
                                        <span className="stone-dot black" />
                                        <span className="modal-player-name">{game.black}</span>
                                    </div>
                                </div>

                                <div className="game-card-cta">
                                    <span>Watch Board</span>
                                    <span className="cta-arrow">→</span>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default RoundGamesModal;
