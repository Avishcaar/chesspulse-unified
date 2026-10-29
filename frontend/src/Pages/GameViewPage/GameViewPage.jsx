import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Chess } from 'chess.js';
import { Chessboard } from 'react-chessboard';
import { useBoardCustomization } from '../../contexts/BoardCustomizationContext';
import { getCustomPieces } from '../../utils/pieceSets';
import { getGameByIndex } from '../../utils/pgnStream';
import { parsePlayerNames, parsePlayerRatings, getCurrentFEN, getMoveList, getGameResult, parseClockInfo } from '../../utils/pgnParser';
import { getStockfishService } from '../../services/stockfishService';
import ChessLoader from '../../Components/ChessLoader/ChessLoader';
import { PageAmbient } from '../../Components/UI/PageHeader';
import {
    Radio,
    ChevronLeft,
    ChevronRight,
    SkipBack,
    SkipForward,
    ExternalLink,
    Copy,
    Check,
    RotateCw,
    ArrowLeft,
    Trophy
} from 'lucide-react';
import './game-view-page.css';

export default function GameViewPage() {
    const { roundId, gameIndex } = useParams();
    const navigate = useNavigate();
    const [liveFen, setLiveFen] = useState('rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1');
    const [activeMoveIndex, setActiveMoveIndex] = useState(null);
    const [players, setPlayers] = useState({ white: 'White GM', black: 'Black GM' });
    const [ratings, setRatings] = useState({ white: '-', black: '-' });
    const [displayClock, setDisplayClock] = useState({ w: 0, b: 0 });
    const [evaluation, setEvaluation] = useState(0.18);
    const [moves, setMoves] = useState([]);
    const [result, setResult] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [arrows, setArrows] = useState([]);
    const [boardOrientation, setBoardOrientation] = useState('white');
    const [rawPgn, setRawPgn] = useState('');
    const [copiedToast, setCopiedToast] = useState(false);

    const { darkSquareColor, lightSquareColor, showNotation, pieceSet, animationSpeed, arrowColor } = useBoardCustomization();
    const previousFenRef = useRef(null);
    const baseClockRef = useRef({ w: 0, b: 0 });
    const lastUpdateRef = useRef(Date.now());
    const turnRef = useRef('w');
    const abortControllerRef = useRef(null);
    const engineRef = useRef(null);
    const scoresheetEndRef = useRef(null);

    // Initialize Stockfish engine
    useEffect(() => {
        const initEngine = async () => {
            try {
                engineRef.current = await getStockfishService();
            } catch (error) {
                console.error('Failed to initialize Stockfish:', error);
            }
        };
        initEngine();
    }, []);

    // Format digital clock
    const formatClock = useCallback((t) => {
        if (typeof t !== 'number' || Number.isNaN(t) || t <= 0) return '00:00';
        const total = Math.max(0, Math.floor(t));
        const h = Math.floor(total / 3600);
        const m = Math.floor((total % 3600) / 60);
        const s = total % 60;

        if (h > 0) {
            return `${h}:${m < 10 ? '0' + m : m}:${s < 10 ? '0' + s : s}`;
        }
        return `${m}:${s < 10 ? '0' + s : s}`;
    }, []);

    // Clock calculation
    const calcDisplayClock = useCallback(() => {
        const now = Date.now();
        const elapsed = (now - lastUpdateRef.current) / 1000;
        let w = baseClockRef.current.w;
        let b = baseClockRef.current.b;
        if (turnRef.current === 'w') w = Math.max(0, w - elapsed);
        else b = Math.max(0, b - elapsed);
        return { w, b };
    }, []);

    // Detect last move squares for visual board arrows
    const getLastMoveSquares = useCallback((oldFen, newFen) => {
        if (!oldFen || !newFen || oldFen === newFen) return null;
        try {
            const newChess = new Chess(newFen);
            const history = newChess.history({ verbose: true });
            if (history.length === 0) return null;
            const lastMoveData = history[history.length - 1];
            return { from: lastMoveData.from, to: lastMoveData.to };
        } catch {
            return null;
        }
    }, []);

    // Ticking clock interval
    useEffect(() => {
        const id = setInterval(() => {
            setDisplayClock(calcDisplayClock());
        }, 1000);
        return () => clearInterval(id);
    }, [calcDisplayClock]);

    // Build array of FENs for historical move stepping
    const fenHistory = useMemo(() => {
        const g = new Chess();
        const fens = [g.fen()];
        for (const m of moves) {
            try {
                const moved = g.move(m, { sloppy: true });
                if (!moved) break;
                fens.push(g.fen());
            } catch {
                break;
            }
        }
        return fens;
    }, [moves]);

    // The FEN currently displayed on the board
    const displayFen = useMemo(() => {
        if (activeMoveIndex !== null && typeof fenHistory[activeMoveIndex] === 'string') {
            return fenHistory[activeMoveIndex];
        }
        return liveFen;
    }, [activeMoveIndex, fenHistory, liveFen]);

    // Metadata extracted from PGN headers
    const meta = useMemo(() => {
        if (!rawPgn) {
            return { event: 'FIDE Broadcast', round: '', eco: '', opening: '' };
        }
        const eventMatch = rawPgn.match(/\[Event "(.+?)"\]/);
        const roundMatch = rawPgn.match(/\[Round "(.+?)"\]/);
        const ecoMatch = rawPgn.match(/\[ECO "(.+?)"\]/);
        const openingMatch = rawPgn.match(/\[Opening "(.+?)"\]/);
        return {
            event: eventMatch ? eventMatch[1] : 'FIDE Broadcast',
            round: roundMatch ? roundMatch[1] : '',
            eco: ecoMatch ? ecoMatch[1] : '',
            opening: openingMatch ? openingMatch[1] : ''
        };
    }, [rawPgn]);

    // Evaluate active position
    const fetchEvaluation = useCallback(async (currentFen) => {
        try {
            const engine = engineRef.current || (engineRef.current = await getStockfishService());
            if (engine) {
                const score = await engine.evaluatePosition(currentFen, 12);
                setEvaluation(score);
            }
        } catch (err) {
            console.error('Error fetching evaluation:', err);
        }
    }, []);

    // Evaluate whenever displayed FEN changes
    useEffect(() => {
        if (displayFen) {
            fetchEvaluation(displayFen);
        }
    }, [displayFen, fetchEvaluation]);

    // Process incoming PGN buffer
    const processPGN = useCallback((pgnText) => {
        const gamePgn = getGameByIndex(pgnText, parseInt(gameIndex || 0, 10));

        if (gamePgn) {
            setRawPgn(gamePgn);

            const playerNames = parsePlayerNames(gamePgn);
            setPlayers(playerNames);

            const playerRatings = parsePlayerRatings(gamePgn);
            setRatings(playerRatings);

            const clockInfo = parseClockInfo(gamePgn);
            baseClockRef.current = { w: clockInfo.white, b: clockInfo.black };
            lastUpdateRef.current = Date.now();
            setDisplayClock(calcDisplayClock());

            const oldFen = previousFenRef.current;
            const currentFen = getCurrentFEN(gamePgn);
            setLiveFen(currentFen);
            previousFenRef.current = currentFen;

            const parts = (currentFen || '').split(' ');
            if (parts[1] === 'w' || parts[1] === 'b') {
                turnRef.current = parts[1];
            }

            const moveSquares = getLastMoveSquares(oldFen, currentFen);
            if (moveSquares) {
                setArrows([{
                    startSquare: moveSquares.from,
                    endSquare: moveSquares.to,
                    color: arrowColor
                }]);
            } else {
                setArrows([]);
            }

            const moveList = getMoveList(gamePgn);
            setMoves(moveList);

            const gameResult = getGameResult(gamePgn);
            setResult(gameResult);

            setLoading(false);
        } else {
            console.log('No game found at index:', gameIndex);
        }
    }, [gameIndex, calcDisplayClock, getLastMoveSquares, arrowColor]);

    // Live Stream connection
    useEffect(() => {
        if (!roundId || gameIndex === undefined) {
            setError('Invalid round or game identifier');
            setLoading(false);
            return;
        }

        setLoading(true);
        setError(null);

        const startStream = async () => {
            try {
                if (abortControllerRef.current) {
                    abortControllerRef.current.abort();
                }

                abortControllerRef.current = new AbortController();
                const response = await fetch(
                    `https://lichess.org/api/stream/broadcast/round/${roundId}.pgn`,
                    { signal: abortControllerRef.current.signal }
                );

                if (response.status === 429) {
                    setError('Rate limited by Lichess. Please wait 15 minutes before refreshing live boards.');
                    setLoading(false);
                    return;
                }

                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }

                const reader = response.body?.getReader();
                if (!reader) {
                    throw new Error('PGN stream reader not available');
                }

                const decoder = new TextDecoder();
                let buffer = '';

                async function processStream() {
                    try {
                        const { done, value } = await reader.read();
                        if (done) return;

                        buffer += decoder.decode(value, { stream: true });
                        processStream();
                    } catch (err) {
                        if (err.name !== 'AbortError') {
                            console.error('Stream error:', err);
                        }
                    }
                }

                processStream();

                setTimeout(() => {
                    if (buffer) processPGN(buffer);
                }, 100);

            } catch (err) {
                if (err.name !== 'AbortError') {
                    console.error('Error in startStream:', err);
                    if (loading) {
                        setError('Failed to load live broadcast stream');
                        setLoading(false);
                    }
                }
            }
        };

        startStream();
        const refreshInterval = setInterval(startStream, 30000);

        return () => {
            clearInterval(refreshInterval);
            if (abortControllerRef.current) {
                abortControllerRef.current.abort();
            }
        };
    }, [roundId, gameIndex, processPGN]);

    // Group moves into FIDE 2-column tabular pairs
    const movePairs = useMemo(() => {
        const pairs = [];
        for (let i = 0; i < moves.length; i += 2) {
            pairs.push({
                moveNumber: Math.floor(i / 2) + 1,
                white: { san: moves[i], plyIndex: i + 1 },
                black: moves[i + 1] ? { san: moves[i + 1], plyIndex: i + 2 } : null
            });
        }
        return pairs;
    }, [moves]);

    // Stepper navigation
    const gotoStart = () => setActiveMoveIndex(0);
    const gotoEnd = () => setActiveMoveIndex(null); // return to live
    const prevMove = () => {
        setActiveMoveIndex((prev) => {
            const current = prev !== null ? prev : fenHistory.length - 1;
            return Math.max(0, current - 1);
        });
    };
    const nextMove = () => {
        setActiveMoveIndex((prev) => {
            if (prev === null) return null;
            const next = prev + 1;
            if (next >= fenHistory.length - 1) return null; // live
            return next;
        });
    };

    // Copy PGN with feedback
    const handleCopyPgn = () => {
        if (!rawPgn) return;
        navigator.clipboard.writeText(rawPgn);
        setCopiedToast(true);
        setTimeout(() => setCopiedToast(false), 2000);
    };

    // Open in Analysis Studio
    const handleOpenInStudio = () => {
        navigate('/analysis', {
            state: {
                moves: moves,
                white: players.white,
                black: players.black,
                event: meta.event,
                result: result || '*',
                source: 'broadcast'
            }
        });
    };

    // Custom square highlights for the last move
    const customSquareStyles = useMemo(() => {
        if (!arrows || arrows.length === 0) return {};
        const lastMove = arrows[0];
        return {
            [lastMove.startSquare]: {
                backgroundColor: 'rgba(244, 63, 94, 0.22)',
                boxShadow: 'inset 0 0 12px rgba(244, 63, 94, 0.3)'
            },
            [lastMove.endSquare]: {
                backgroundColor: 'rgba(244, 63, 94, 0.32)',
                boxShadow: 'inset 0 0 16px rgba(244, 63, 94, 0.4)'
            }
        };
    }, [arrows]);

    // Evaluation bar height (normalized win probability curve)
    const whiteBarHeight = useMemo(() => {
        if (typeof evaluation !== 'number' || isNaN(evaluation)) return '50%';
        if (evaluation >= 99) return boardOrientation === 'black' ? '0%' : '100%';
        if (evaluation <= -99) return boardOrientation === 'black' ? '100%' : '0%';
        const winProb = 50 + 50 * (2 / (1 + Math.exp(-0.35 * evaluation)) - 1);
        const oriented = boardOrientation === 'black' ? (100 - winProb) : winProb;
        const clamped = Math.max(3, Math.min(97, oriented));
        return `${clamped.toFixed(1)}%`;
    }, [evaluation, boardOrientation]);

    const formattedEval = useMemo(() => {
        if (evaluation >= 99) return '+M';
        if (evaluation <= -99) return '-M';
        if (typeof evaluation === 'number' && !isNaN(evaluation)) {
            return (evaluation >= 0 ? '+' : '') + evaluation.toFixed(2);
        }
        return '+0.18';
    }, [evaluation]);

    const isWhiteTurn = (displayFen.split(' ')[1] || 'w') === 'w';
    const isLiveActive = activeMoveIndex === null;

    if (loading) {
        return (
            <div className="game-view-page cp-subpage">
                <PageAmbient watermark="BROADCAST" theme="classic" />
                <div className="loading-game">
                    <ChessLoader text="Connecting to FIDE live broadcast stream..." />
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="game-view-page cp-subpage">
                <PageAmbient watermark="BROADCAST" theme="classic" />
                <div className="error-game">
                    <Radio size={44} color="#f59e0b" />
                    <p className="error-msg">{error}</p>
                    <button onClick={() => navigate('/tournaments')} className="gv-back-action-btn">
                        <ArrowLeft size={14} />
                        <span>Back to Tournaments</span>
                    </button>
                </div>
            </div>
        );
    }

    // Determine top and bottom players based on orientation
    const topPlayer = boardOrientation === 'white'
        ? { name: players.black, rating: ratings.black, color: 'black', clock: displayClock.b, isTurn: !isWhiteTurn }
        : { name: players.white, rating: ratings.white, color: 'white', clock: displayClock.w, isTurn: isWhiteTurn };

    const bottomPlayer = boardOrientation === 'white'
        ? { name: players.white, rating: ratings.white, color: 'white', clock: displayClock.w, isTurn: isWhiteTurn }
        : { name: players.black, rating: ratings.black, color: 'black', clock: displayClock.b, isTurn: !isWhiteTurn };

    return (
        <div className="game-view-page cp-subpage">
            <PageAmbient watermark="BROADCAST" theme="classic" />

            {/* Atelier Top Navigation Bar */}
            <div className="gv-top-navbar">
                <div className="gv-top-left">
                    <button
                        type="button"
                        onClick={() => navigate('/tournaments')}
                        className="gv-back-btn"
                        title="Back to Tournaments"
                    >
                        <ArrowLeft size={14} />
                        <span>Tournaments</span>
                    </button>

                    <div className="gv-live-status-pill">
                        <span className="gv-live-dot" />
                        <span>FIDE BOARD #{parseInt(gameIndex || 0, 10) + 1}</span>
                    </div>

                    <div className="gv-event-meta-summary">
                        <span className="gv-event-title">{meta.event}</span>
                        {meta.round && (
                            <>
                                <span className="gv-meta-dot">·</span>
                                <span className="gv-event-round">Round {meta.round}</span>
                            </>
                        )}
                        {meta.eco && (
                            <>
                                <span className="gv-meta-dot">·</span>
                                <span className="gv-event-eco">ECO {meta.eco}</span>
                            </>
                        )}
                    </div>
                </div>

                <div className="gv-top-right">
                    <button
                        type="button"
                        onClick={() => setBoardOrientation(prev => prev === 'white' ? 'black' : 'white')}
                        className="gv-toolbar-action-btn"
                        title="Flip board orientation"
                    >
                        <RotateCw size={13} />
                        <span>Flip Board</span>
                    </button>
                </div>
            </div>

            {/* Dual-Pane Broadcast Cockpit Layout */}
            <div className="gv-broadcast-layout">
                {/* Left Column: Top Player + Unified Chessboard & Eval Bar + Bottom Player + Transport */}
                <div className="gv-board-column">
                    {/* Top Player Banner */}
                    <div className={`gv-player-card ${topPlayer.isTurn ? 'is-turn' : ''}`}>
                        <div className="gv-player-left">
                            <span className={`stone-dot ${topPlayer.color}`} />
                            <div className="gv-player-identity">
                                <span className="gv-player-name">{topPlayer.name}</span>
                                {topPlayer.rating && topPlayer.rating !== '-' && (
                                    <span className="gv-player-rating-chip">{topPlayer.rating}</span>
                                )}
                            </div>
                        </div>
                        <div className={`gv-player-clock ${topPlayer.isTurn ? 'active-clock' : ''}`}>
                            {formatClock(topPlayer.clock)}
                        </div>
                    </div>

                    {/* Integrated Board Stage: Eval Bar is a direct extension of the Chessboard */}
                    <div className="gv-board-cockpit">
                        {/* Seamless Vertical Evaluation Bar */}
                        <div className="gv-vertical-eval-gauge" aria-label="Live Stockfish 17 Evaluation Bar">
                            <div
                                className="gv-vertical-eval-fill"
                                style={{ height: whiteBarHeight }}
                            />
                            <div className="gv-eval-midline" />
                            <span className="gv-eval-readout">{formattedEval}</span>
                        </div>

                        {/* Interactive Chessboard Stage */}
                        <div className="gv-board-stage">
                            <Chessboard
                                id="gameview-board"
                                options={{
                                    position: displayFen,
                                    arePiecesDraggable: false,
                                    animationDurationInMs: animationSpeed,
                                    boardOrientation: boardOrientation,
                                    arrows: arrows,
                                    arrowOptions: {
                                        color: arrowColor,
                                        opacity: 0.65
                                    },
                                    showNotation,
                                    squareStyles: customSquareStyles,
                                    darkSquareStyle: { backgroundColor: darkSquareColor },
                                    lightSquareStyle: { backgroundColor: lightSquareColor },
                                    boardStyle: {
                                        borderRadius: '0px',
                                        boxShadow: 'none'
                                    },
                                    pieces: getCustomPieces(pieceSet),
                                    customPieces: getCustomPieces(pieceSet)
                                }}
                            />
                        </div>
                    </div>

                    {/* Bottom Player Banner */}
                    <div className={`gv-player-card ${bottomPlayer.isTurn ? 'is-turn' : ''}`}>
                        <div className="gv-player-left">
                            <span className={`stone-dot ${bottomPlayer.color}`} />
                            <div className="gv-player-identity">
                                <span className="gv-player-name">{bottomPlayer.name}</span>
                                {bottomPlayer.rating && bottomPlayer.rating !== '-' && (
                                    <span className="gv-player-rating-chip">{bottomPlayer.rating}</span>
                                )}
                            </div>
                        </div>
                        <div className={`gv-player-clock ${bottomPlayer.isTurn ? 'active-clock' : ''}`}>
                            {formatClock(bottomPlayer.clock)}
                        </div>
                    </div>

                    {/* Move Transport Stepper Dock */}
                    <div className="gv-transport-dock">
                        <div className="gv-transport-meta">
                            <span className="gv-ply-label">ACTIVE PLY</span>
                            <strong>
                                {activeMoveIndex !== null ? activeMoveIndex : moves.length} / {moves.length}
                            </strong>
                            {!isLiveActive && (
                                <button
                                    type="button"
                                    className="gv-live-jump-btn"
                                    onClick={gotoEnd}
                                    title="Jump to live position"
                                >
                                    <Radio size={11} />
                                    <span>Return to Live</span>
                                </button>
                            )}
                        </div>

                        <div className="gv-playback-group">
                            <button
                                type="button"
                                onClick={gotoStart}
                                className="gv-playback-btn"
                                title="Start position"
                            >
                                <SkipBack size={14} />
                            </button>
                            <button
                                type="button"
                                onClick={prevMove}
                                className="gv-playback-btn"
                                title="Previous move"
                            >
                                <ChevronLeft size={16} />
                            </button>
                            <button
                                type="button"
                                onClick={nextMove}
                                className="gv-playback-btn"
                                title="Next move"
                            >
                                <ChevronRight size={16} />
                            </button>
                            <button
                                type="button"
                                onClick={gotoEnd}
                                className={`gv-playback-btn ${isLiveActive ? 'is-live' : ''}`}
                                title="Current live position"
                            >
                                <SkipForward size={14} />
                            </button>
                        </div>
                    </div>
                </div>

                {/* Right Column: Full-Height Grand FIDE Scoresheet Console */}
                <div className="gv-scoresheet-column">
                    <div className="gv-scoresheet-window">
                        {/* Scoresheet Top Chrome Header */}
                        <div className="gv-scoresheet-header">
                            <div className="gv-scoresheet-title-group">
                                <div className="gv-scoresheet-title-col">
                                    <h3 className="gv-scoresheet-title">Official Scoresheet</h3>
                                    <span className="gv-scoresheet-subtitle">
                                        {moves.length} Half-Moves · Stockfish 17 Evaluated
                                    </span>
                                </div>
                            </div>

                            <div className="gv-scoresheet-actions">
                                <button
                                    type="button"
                                    className="gv-action-pill-btn"
                                    onClick={handleCopyPgn}
                                    title="Copy full game PGN"
                                >
                                    {copiedToast ? <Check size={12} color="#10b981" /> : <Copy size={12} />}
                                    <span>{copiedToast ? "Copied" : "Copy PGN"}</span>
                                </button>
                                <button
                                    type="button"
                                    className="gv-action-pill-btn studio-cta"
                                    onClick={handleOpenInStudio}
                                    title="Analyze in Stockfish Studio"
                                >
                                    <ExternalLink size={12} />
                                    <span>Analysis Studio</span>
                                </button>
                            </div>
                        </div>

                        {/* Telemetry Evaluation Scorebug */}
                        <div className="gv-telemetry-banner">
                            <div className="gv-eval-pill">
                                <span className="gv-eval-kicker">ENGINE EVAL</span>
                                <span className="gv-eval-stat">{formattedEval}</span>
                            </div>
                            <div className="gv-telemetry-divider" />
                            <div className="gv-opening-pill">
                                <span className="gv-opening-kicker">OPENING ARCHIVE</span>
                                <span className="gv-opening-val">
                                    {meta.opening || meta.eco || 'Standard Opening'}
                                </span>
                            </div>
                        </div>

                        {/* Grand FIDE Move Sheet Table */}
                        <div className="gv-scoresheet-body">
                            <div className="gv-table-header">
                                <span className="col-num">#</span>
                                <span className="col-white">WHITE</span>
                                <span className="col-black">BLACK</span>
                            </div>

                            <div className="gv-table-scroll">
                                {movePairs.length === 0 ? (
                                    <div className="gv-moves-empty">
                                        <p>Awaiting opening move from broadcast relay...</p>
                                    </div>
                                ) : (
                                    movePairs.map((pair) => {
                                        const isWhiteActive = activeMoveIndex === pair.white.plyIndex || (isLiveActive && pair.white.plyIndex === moves.length);
                                        const isBlackActive = pair.black && (activeMoveIndex === pair.black.plyIndex || (isLiveActive && pair.black.plyIndex === moves.length));

                                        return (
                                            <div key={pair.moveNumber} className="gv-table-row">
                                                <span className="col-num">{pair.moveNumber}.</span>
                                                <button
                                                    type="button"
                                                    className={`gv-ply-btn ${isWhiteActive ? 'active' : ''}`}
                                                    onClick={() => setActiveMoveIndex(pair.white.plyIndex)}
                                                >
                                                    {pair.white.san}
                                                </button>
                                                {pair.black ? (
                                                    <button
                                                        type="button"
                                                        className={`gv-ply-btn ${isBlackActive ? 'active' : ''}`}
                                                        onClick={() => setActiveMoveIndex(pair.black.plyIndex)}
                                                    >
                                                        {pair.black.san}
                                                    </button>
                                                ) : (
                                                    <span className="gv-ply-btn empty">—</span>
                                                )}
                                            </div>
                                        );
                                    })
                                )}
                                <div ref={scoresheetEndRef} />
                            </div>
                        </div>

                        {/* Match Status & Result Footer */}
                        <div className="gv-scoresheet-footer">
                            {result ? (
                                <div className="gv-result-card">
                                    <Trophy size={16} className="gv-result-icon" />
                                    <span className="gv-result-text">
                                        Match Concluded: <strong>{result}</strong>
                                    </span>
                                </div>
                            ) : (
                                <div className="gv-live-sync-card">
                                    <span className="gv-live-dot" />
                                    <span>Live PGN stream active · 30s auto-refresh</span>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
