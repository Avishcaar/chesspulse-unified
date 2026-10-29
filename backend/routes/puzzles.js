import express from 'express';
import { authenticate } from '../middleware/auth.js';
import { successResponse, errorResponse } from '../utils/responseHandler.js';
import PuzzleAttempt from '../models/PuzzleAttempt.js';
import UserPuzzleStats from '../models/UserPuzzleStats.js';
import User from '../models/User.js';
import BotGame from '../models/BotGame.js';
import OnlineGame from '../models/OnlineGame.js';
import geminiService from '../utils/geminiService.js';
import { getCachedExternalProfiles, syncExternalChessProfiles } from '../services/externalChessService.js';

const router = express.Router();

const K_FACTOR = 32;

function calculateEloChange(playerRating, puzzleRating, solved) {
    const expectedScore = 1 / (1 + Math.pow(10, (puzzleRating - playerRating) / 400));
    const actualScore = solved ? 1 : 0;
    const change = Math.round(K_FACTOR * (actualScore - expectedScore));
    return change;
}

function getDifficultyTier(rating) {
    if (rating < 1200) return 'beginner';
    if (rating < 1600) return 'intermediate';
    if (rating < 2000) return 'advanced';
    return 'expert';
}

const PULSE_LEVELS = new Set(['new', 'beginner', 'club', 'intermediate', 'advanced', 'expert']);
const PULSE_GOALS = new Set(['tactics', 'opening', 'middlegame', 'endgame', 'calculation', 'boardVision']);
const PULSE_CHALLENGES = new Set([
    'missTactics',
    'calculateLines',
    'openingTransitions',
    'middlegamePlans',
    'endgameTechnique',
    'timePressure',
    'unsure'
]);
const PULSE_SESSION_LENGTHS = new Set([10, 20, 30]);
const PULSE_EXTERNAL_SOURCES = new Set(['chesscom', 'lichess']);

function parsePulseProfile(input = {}, user) {
    const level = typeof input.level === 'string' ? input.level : '';
    const goals = Array.isArray(input.goals)
        ? [...new Set(input.goals.filter((goal) => typeof goal === 'string' && PULSE_GOALS.has(goal)))]
        : [];
    const challenge = typeof input.challenge === 'string' ? input.challenge : 'unsure';
    const sessionMinutes = Number(input.sessionMinutes);
    const externalSources = Array.isArray(input.externalSources)
        ? [...new Set(input.externalSources.filter((source) => typeof source === 'string' && PULSE_EXTERNAL_SOURCES.has(source)))]
        : [];
    const rating = input.rating === null || input.rating === '' || input.rating === undefined
        ? null
        : Number(input.rating);

    if (!PULSE_LEVELS.has(level)) {
        return { error: 'Choose the level that best describes your current chess strength.' };
    }
    if (goals.length === 0 || goals.length > 3) {
        return { error: 'Choose one to three areas you want to improve.' };
    }
    if (!PULSE_CHALLENGES.has(challenge)) {
        return { error: 'Choose the challenge that feels closest to your games.' };
    }
    if (!PULSE_SESSION_LENGTHS.has(sessionMinutes)) {
        return { error: 'Choose a 10, 20, or 30 minute session.' };
    }
    if (rating !== null && (!Number.isInteger(rating) || rating < 400 || rating > 2800)) {
        return { error: 'Enter a rating between 400 and 2800, or leave it blank.' };
    }

    const sourceFields = { chesscom: 'chesscomUsername', lichess: 'lichessUsername' };
    const missingSource = externalSources.find((source) => !user?.[sourceFields[source]]);
    if (missingSource) {
        const label = missingSource === 'chesscom' ? 'Chess.com' : 'Lichess';
        return { error: `Save your ${label} username in Profile settings before including its games.` };
    }

    return {
        profile: { level, rating, goals, challenge, sessionMinutes, externalSources }
    };
}

async function getPulseActivity(user, stats, externalProfiles = []) {
    const username = user.username;
    const onlineQuery = username
        ? { $or: [{ 'white.username': username }, { 'black.username': username }] }
        : null;
    const userRatings = user.ratings || {};

    const [puzzleAttemptCount, recentAttempts, onlineGameCount, recentOnlineGames, botGameCount, recentBotGames] = await Promise.all([
        PuzzleAttempt.countDocuments({ userId: user._id }),
        PuzzleAttempt.find({ userId: user._id })
            .sort({ createdAt: -1 })
            .limit(24)
            .select('solved puzzleRating themes mode timeMs createdAt')
            .lean(),
        onlineQuery ? OnlineGame.countDocuments(onlineQuery) : Promise.resolve(0),
        onlineQuery
            ? OnlineGame.find(onlineQuery)
                .sort({ createdAt: -1 })
                .limit(5)
                .select('white.username black.username result resultReason ratingCategory timeControl moves ratingChanges createdAt')
                .lean()
            : Promise.resolve([]),
        BotGame.countDocuments({ user: user._id }),
        BotGame.find({ user: user._id })
            .sort({ createdAt: -1 })
            .limit(5)
            .select('botElo result endReason totalMoves moves createdAt')
            .lean()
    ]);

    const puzzleAttempts = Math.max(stats.totalAttempted || 0, puzzleAttemptCount);
    const gameRatings = ['rapid', 'blitz', 'bullet']
        .map((category) => ({
            category,
            rating: userRatings[category]?.rating || 1200,
            gamesPlayed: userRatings[category]?.gamesPlayed || 0,
            wins: userRatings[category]?.wins || 0,
            losses: userRatings[category]?.losses || 0,
            draws: userRatings[category]?.draws || 0
        }))
        .filter((item) => item.gamesPlayed > 0);
    const ratedGameCount = gameRatings.reduce((sum, item) => sum + item.gamesPlayed, 0);
    const multiplayerGames = Math.max(onlineGameCount, ratedGameCount);

    const themePerformance = [];
    stats.themeStats.forEach((value, theme) => {
        const attempted = value.attempted || 0;
        const solved = value.solved || 0;
        if (attempted > 0) {
            themePerformance.push({
                theme,
                attempted,
                accuracy: Math.round((solved / attempted) * 100)
            });
        }
    });

    const weakThemes = themePerformance
        .filter((item) => item.attempted >= 3)
        .sort((a, b) => a.accuracy - b.accuracy)
        .slice(0, 6);
    const strongThemes = themePerformance
        .filter((item) => item.attempted >= 3 && item.accuracy >= 75)
        .sort((a, b) => b.accuracy - a.accuracy)
        .slice(0, 4);

    const recentGames = recentOnlineGames.map((game) => {
        const isWhite = game.white?.username === username;
        const side = isWhite ? 'white' : 'black';
        const result = game.result === 'draw'
            ? 'draw'
            : game.result === side
                ? 'win'
                : game.result === 'aborted'
                    ? 'aborted'
                    : 'loss';

        return {
            type: 'multiplayer',
            result,
            endReason: game.resultReason,
            timeControl: game.timeControl,
            ratingCategory: game.ratingCategory,
            ratingChange: game.ratingChanges?.[side] || 0,
            moves: (game.moves || []).slice(0, 36).map((move) => String(move).slice(0, 12))
        };
    });

    const recentGamesFromBots = recentBotGames.map((game) => ({
        type: 'bot',
        result: game.result,
        botRating: game.botElo,
        endReason: game.endReason,
        moveCount: game.totalMoves,
        moves: (game.moves || []).slice(0, 36).map((move) => String(move).slice(0, 12))
    }));

    const hasChessPulseData = puzzleAttempts > 0 || multiplayerGames > 0 || botGameCount > 0;
    const hasExternalPlayData = externalProfiles.some((profile) =>
        (profile.performance?.gamesAnalyzed || 0) > 0 ||
        (profile.ratings || []).some((rating) => rating.gamesPlayed > 0) ||
        Object.values(profile.puzzleStats || {}).some((value) => Number.isFinite(value) && value > 0)
    );
    const hasPlayData = hasChessPulseData || hasExternalPlayData;
    const externalSummary = externalProfiles.map((profile) => ({
        provider: profile.provider,
        username: profile.username,
        fetchedAt: profile.fetchedAt,
        ratings: profile.ratings || [],
        puzzleStats: profile.puzzleStats || {},
        gamesAnalyzed: profile.performance?.gamesAnalyzed || 0,
        totalGamesOnProvider: profile.performance?.totalGamesOnProvider || null,
        scorePercent: profile.performance?.scorePercent ?? null,
        averageAccuracy: profile.performance?.averageAccuracy ?? null,
        analysis: profile.performance?.analysis || null,
        bySpeed: profile.performance?.bySpeed || [],
        openings: profile.performance?.openings || []
    }));
    const summary = {
        hasPlayData,
        hasChessPulseData,
        puzzleAttempts,
        multiplayerGames,
        botGames: botGameCount,
        puzzleRating: puzzleAttempts > 0 ? stats.rating : null,
        gameRatings,
        weakThemes,
        strongThemes,
        externalProfiles: externalSummary
    };

    return {
        summary,
        modelContext: {
            hasPlayData,
            puzzle: {
                attempts: puzzleAttempts,
                rating: summary.puzzleRating,
                weakThemes,
                strongThemes,
                recentAttempts: recentAttempts.map((attempt) => ({
                    solved: attempt.solved,
                    rating: attempt.puzzleRating,
                    themes: attempt.themes || [],
                    mode: attempt.mode,
                    timeMs: attempt.timeMs
                }))
            },
            online: {
                games: multiplayerGames,
                ratings: gameRatings,
                recentGames
            },
            bots: {
                games: botGameCount,
                recentGames: recentGamesFromBots
            },
            externalProfiles: externalProfiles.map((profile) => ({
                provider: profile.provider,
                ratings: profile.ratings || [],
                puzzleStats: profile.puzzleStats || {},
                performance: profile.performance || {}
            }))
        }
    };
}

router.post('/attempt', authenticate, async (req, res) => {
    try {
        const { puzzleId, solved, timeMs, puzzleRating, themes, mode, difficulty, moveCount } = req.body;
        const userId = req.userId;

        if (!puzzleId || solved === undefined || !puzzleRating || !mode) {
            return errorResponse(res, 'Missing required fields: puzzleId, solved, puzzleRating, mode', 400);
        }

        let stats = await UserPuzzleStats.getOrCreate(userId);

        const userRatingBefore = stats.rating;
        const ratingChange = calculateEloChange(userRatingBefore, puzzleRating, solved);
        const userRatingAfter = Math.max(100, userRatingBefore + ratingChange);

        const attempt = await PuzzleAttempt.create({
            userId,
            puzzleId,
            solved,
            timeMs: timeMs || 0,
            puzzleRating,
            userRatingBefore,
            userRatingAfter,
            ratingChange,
            themes: themes || [],
            mode,
            difficulty: difficulty || 'all',
            moveCount: moveCount || 0
        });

        stats.rating = userRatingAfter;
        if (userRatingAfter > stats.peakRating) {
            stats.peakRating = userRatingAfter;
        }

        stats.totalAttempted += 1;
        if (solved) {
            stats.totalSolved += 1;
        }

        stats.ratingHistory.push({
            date: new Date(),
            rating: userRatingAfter
        });

        if (stats.ratingHistory.length > 100) {
            stats.ratingHistory = stats.ratingHistory.slice(-100);
        }

        stats.updateStreak(solved);

        if (themes && Array.isArray(themes) && themes.length > 0) {
            themes.forEach(theme => {
                const themeLower = theme.toLowerCase();
                const existing = stats.themeStats.get(themeLower) || { solved: 0, attempted: 0 };

                stats.themeStats.set(themeLower, {
                    attempted: (existing.attempted || 0) + 1,
                    solved: solved ? (existing.solved || 0) + 1 : (existing.solved || 0)
                });
            });
            stats.markModified('themeStats');
        }

        const diffTier = getDifficultyTier(puzzleRating);
        if (stats.difficultyStats[diffTier]) {
            stats.difficultyStats[diffTier].attempted += 1;
            if (solved) stats.difficultyStats[diffTier].solved += 1;
        }

        if (stats.modeStats[mode]) {
            stats.modeStats[mode].attempted += 1;
            if (solved) stats.modeStats[mode].solved += 1;
        }

        if (timeMs) {
            stats.totalTimeMs += timeMs;
            stats.averageTimeMs = Math.round(stats.totalTimeMs / stats.totalAttempted);
        }

        const today = new Date();
        today.setHours(0, 0, 0, 0);

        let todayStats = stats.dailyHistory.find(d => {
            const dDate = new Date(d.date);
            dDate.setHours(0, 0, 0, 0);
            return dDate.getTime() === today.getTime();
        });

        if (todayStats) {
            todayStats.attempted += 1;
            if (solved) todayStats.solved += 1;
            todayStats.rating = userRatingAfter;
        } else {
            stats.dailyHistory.push({
                date: today,
                solved: solved ? 1 : 0,
                attempted: 1,
                rating: userRatingAfter
            });
        }

        if (stats.dailyHistory.length > 30) {
            stats.dailyHistory = stats.dailyHistory.slice(-30);
        }

        stats.lastActive = new Date();
        await stats.save();

        return successResponse(res, {
            attemptId: attempt._id,
            newRating: userRatingAfter,
            ratingChange,
            peakRating: stats.peakRating,
            streak: {
                current: stats.currentStreak,
                best: stats.bestStreak
            },
            totals: {
                solved: stats.totalSolved,
                attempted: stats.totalAttempted
            }
        }, 'Puzzle attempt recorded');

    } catch (error) {
        console.error('Error recording puzzle attempt:', error);
        return errorResponse(res, 'Failed to record puzzle attempt', 500);
    }
});

router.get('/rating', authenticate, async (req, res) => {
    try {
        const userId = req.userId;
        const stats = await UserPuzzleStats.getOrCreate(userId);

        return successResponse(res, {
            rating: stats.rating,
            peakRating: stats.peakRating,
            ratingHistory: stats.ratingHistory.slice(-50).map(r => ({
                date: r.date,
                rating: r.rating
            })),
            modeStats: {
                solved: stats.modeStats.rated?.solved || 0,
                attempted: stats.modeStats.rated?.attempted || 0
            }
        }, 'Rating fetched');

    } catch (error) {
        console.error('Error fetching rating:', error);
        return errorResponse(res, 'Failed to fetch rating', 500);
    }
});

router.get('/stats', authenticate, async (req, res) => {
    try {
        const userId = req.userId;
        const stats = await UserPuzzleStats.getOrCreate(userId);

        const accuracy = stats.totalAttempted > 0
            ? Math.round((stats.totalSolved / stats.totalAttempted) * 100)
            : 0;

        const themeStatsObj = {};
        for (const [key, value] of stats.themeStats.entries()) {
            const attempted = value.attempted || 0;
            const solved = value.solved || 0;
            themeStatsObj[key] = {
                solved,
                attempted,
                accuracy: attempted > 0 ? Math.round((solved / attempted) * 100) : 0
            };
        }

        const topThemes = Object.entries(themeStatsObj)
            .sort((a, b) => b[1].attempted - a[1].attempted)
            .slice(0, 10);

        const weakThemes = Object.entries(themeStatsObj)
            .filter(([_, v]) => v.attempted >= 5)
            .sort((a, b) => a[1].accuracy - b[1].accuracy)
            .slice(0, 5);

        return successResponse(res, {
            rating: stats.rating,
            peakRating: stats.peakRating,
            ratingHistory: stats.ratingHistory.slice(-30),
            totalSolved: stats.totalSolved,
            totalAttempted: stats.totalAttempted,
            accuracy,
            streak: {
                current: stats.currentStreak,
                best: stats.bestStreak
            },
            themeStats: themeStatsObj,
            topThemes,
            weakThemes,
            difficultyStats: stats.difficultyStats,
            modeStats: stats.modeStats,
            dailyHistory: stats.dailyHistory.slice(-14),
            averageTimeMs: stats.averageTimeMs,
            lastActive: stats.lastActive
        }, 'Stats retrieved successfully');

    } catch (error) {
        console.error('Error fetching stats:', error);
        return errorResponse(res, 'Failed to fetch stats', 500);
    }
});

router.get('/history', authenticate, async (req, res) => {
    try {
        const userId = req.userId;
        const { page = 1, limit = 20, mode, theme } = req.query;

        const query = { userId };
        if (mode) query.mode = mode;
        if (theme) query.themes = { $in: [theme.toLowerCase()] };

        const attempts = await PuzzleAttempt.find(query)
            .sort({ createdAt: -1 })
            .skip((page - 1) * limit)
            .limit(parseInt(limit))
            .lean();

        const total = await PuzzleAttempt.countDocuments(query);

        return successResponse(res, {
            attempts,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total,
                pages: Math.ceil(total / limit)
            }
        }, 'History retrieved');

    } catch (error) {
        console.error('Error fetching history:', error);
        return errorResponse(res, 'Failed to fetch history', 500);
    }
});

router.get('/leaderboard', async (req, res) => {
    try {
        const { type = 'rating', limit = 50 } = req.query;

        let sortField;
        let displayField;

        switch (type) {
            case 'streak':
                sortField = 'bestStreak';
                displayField = 'bestStreak';
                break;
            case 'solved':
                sortField = 'totalSolved';
                displayField = 'totalSolved';
                break;
            case 'rating':
            default:
                sortField = 'rating';
                displayField = 'rating';
        }

        const stats = await UserPuzzleStats.find({ totalAttempted: { $gte: 10 } })
            .sort({ [sortField]: -1 })
            .limit(parseInt(limit))
            .populate('userId', 'username avatar country')
            .lean();

        const leaderboard = stats.map((stat, index) => ({
            rank: index + 1,
            userId: stat.userId?._id,
            username: stat.userId?.username || 'Anonymous',
            avatar: stat.userId?.avatar,
            country: stat.userId?.country,
            value: stat[displayField],
            rating: stat.rating,
            totalSolved: stat.totalSolved,
            bestStreak: stat.bestStreak,
            accuracy: stat.totalAttempted > 0
                ? Math.round((stat.totalSolved / stat.totalAttempted) * 100)
                : 0
        }));

        return successResponse(res, {
            type,
            leaderboard
        }, 'Leaderboard retrieved');

    } catch (error) {
        console.error('Error fetching leaderboard:', error);
        return errorResponse(res, 'Failed to fetch leaderboard', 500);
    }
});

router.get('/leaderboard/rank', authenticate, async (req, res) => {
    try {
        const userId = req.userId;
        const { type = 'rating' } = req.query;

        let sortField;
        switch (type) {
            case 'streak':
                sortField = 'bestStreak';
                break;
            case 'solved':
                sortField = 'totalSolved';
                break;
            default:
                sortField = 'rating';
        }

        const userStats = await UserPuzzleStats.findOne({ userId });
        if (!userStats) {
            return successResponse(res, { rank: null, value: null }, 'No stats yet');
        }

        const rank = await UserPuzzleStats.countDocuments({
            totalAttempted: { $gte: 10 },
            [sortField]: { $gt: userStats[sortField] }
        }) + 1;

        const totalUsers = await UserPuzzleStats.countDocuments({ totalAttempted: { $gte: 10 } });

        return successResponse(res, {
            rank,
            totalUsers,
            value: userStats[sortField],
            percentile: totalUsers > 0 ? Math.round(((totalUsers - rank + 1) / totalUsers) * 100) : 0
        }, 'Rank retrieved');

    } catch (error) {
        console.error('Error fetching rank:', error);
        return errorResponse(res, 'Failed to fetch rank', 500);
    }
});

router.get('/recommend', authenticate, async (req, res) => {
    try {
        const userId = req.userId;
        const stats = await UserPuzzleStats.getOrCreate(userId);

        const accuracy = stats.totalAttempted > 0
            ? Math.round((stats.totalSolved / stats.totalAttempted) * 100)
            : 0;

        const weakThemes = [];
        const strongThemes = [];
        stats.themeStats.forEach((value, key) => {
            if (value.attempted >= 5) {
                const themeAccuracy = Math.round((value.solved / value.attempted) * 100);
                if (themeAccuracy < 50) {
                    weakThemes.push({ theme: key, accuracy: themeAccuracy, attempted: value.attempted });
                } else if (themeAccuracy >= 70) {
                    strongThemes.push({ theme: key, accuracy: themeAccuracy, attempted: value.attempted });
                }
            }
        });
        weakThemes.sort((a, b) => a.accuracy - b.accuracy);
        strongThemes.sort((a, b) => b.accuracy - a.accuracy);

        let ratingTrend = 'stable';
        if (stats.ratingHistory.length >= 5) {
            const recent = stats.ratingHistory.slice(-5);
            const diff = recent[recent.length - 1].rating - recent[0].rating;
            if (diff > 20) ratingTrend = 'improving';
            else if (diff < -20) ratingTrend = 'declining';
        }

        const aiAdvice = await geminiService.getCoachingAdvice({
            rating: stats.rating,
            peakRating: stats.peakRating,
            totalSolved: stats.totalSolved,
            totalAttempted: stats.totalAttempted,
            accuracy,
            currentStreak: stats.currentStreak,
            bestStreak: stats.bestStreak,
            weakThemes: weakThemes.slice(0, 3),
            strongThemes: strongThemes.slice(0, 3),
            ratingTrend
        });

        return successResponse(res, {
            ...aiAdvice,
            stats: {
                rating: stats.rating,
                accuracy,
                streak: stats.currentStreak,
                weakThemes: weakThemes.slice(0, 3),
                strongThemes: strongThemes.slice(0, 3)
            }
        }, 'AI recommendations generated');

    } catch (error) {
        console.error('Error generating recommendations:', error);
        return errorResponse(res, 'Failed to generate recommendations', 500);
    }
});

router.post('/explain', authenticate, async (req, res) => {
    try {
        const { puzzleId, fen, moves, userMove, solved, themes, rating } = req.body;

        if (!fen || !moves) {
            return errorResponse(res, 'Missing required fields: fen, moves', 400);
        }

        const explanation = await geminiService.explainPuzzle({
            puzzleId,
            fen,
            moves,
            userMove,
            solved,
            themes,
            rating
        });

        return successResponse(res, explanation, 'Puzzle explanation generated');

    } catch (error) {
        console.error('Error explaining puzzle:', error);
        return errorResponse(res, 'Failed to explain puzzle', 500);
    }
});

router.get('/training-plan', authenticate, async (req, res) => {
    try {
        const userId = req.userId;
        const stats = await UserPuzzleStats.getOrCreate(userId);

        const accuracy = stats.totalAttempted > 0
            ? Math.round((stats.totalSolved / stats.totalAttempted) * 100)
            : 0;

        const weakThemes = [];
        const strongThemes = [];
        stats.themeStats.forEach((value, key) => {
            if (value.attempted >= 3) {
                const themeAccuracy = Math.round((value.solved / value.attempted) * 100);
                if (themeAccuracy < 50) {
                    weakThemes.push({ theme: key, accuracy: themeAccuracy });
                } else if (themeAccuracy >= 70) {
                    strongThemes.push({ theme: key, accuracy: themeAccuracy });
                }
            }
        });

        const preferredModes = Object.entries(stats.modeStats)
            .sort((a, b) => b[1].attempted - a[1].attempted)
            .slice(0, 2)
            .map(([mode]) => mode);

        const todayStats = stats.dailyHistory.find(d => {
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            const dDate = new Date(d.date);
            dDate.setHours(0, 0, 0, 0);
            return dDate.getTime() === today.getTime();
        });

        const avgPuzzlesPerDay = stats.dailyHistory.length > 0
            ? Math.round(stats.dailyHistory.reduce((sum, d) => sum + d.attempted, 0) / stats.dailyHistory.length)
            : 5;

        const trainingPlan = await geminiService.generateTrainingPlan({
            rating: stats.rating,
            accuracy,
            weakThemes,
            strongThemes,
            preferredModes,
            avgPuzzlesPerDay,
            puzzlesToday: todayStats?.attempted || 0
        });

        return successResponse(res, trainingPlan, 'Training plan generated');

    } catch (error) {
        console.error('Error generating training plan:', error);
        return errorResponse(res, 'Failed to generate training plan', 500);
    }
});

router.get('/motivation', authenticate, async (req, res) => {
    try {
        const userId = req.userId;
        const stats = await UserPuzzleStats.getOrCreate(userId);

        const recentAttempts = await PuzzleAttempt.find({ userId })
            .sort({ createdAt: -1 })
            .limit(10)
            .lean();

        const recentAccuracy = recentAttempts.length > 0
            ? Math.round((recentAttempts.filter(a => a.solved).length / recentAttempts.length) * 100)
            : 0;

        let ratingTrend = 'stable';
        if (stats.ratingHistory.length >= 5) {
            const recent = stats.ratingHistory.slice(-5);
            const diff = recent[recent.length - 1].rating - recent[0].rating;
            if (diff > 20) ratingTrend = 'improving';
            else if (diff < -20) ratingTrend = 'declining';
        }

        const todayStats = stats.dailyHistory.find(d => {
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            const dDate = new Date(d.date);
            dDate.setHours(0, 0, 0, 0);
            return dDate.getTime() === today.getTime();
        });

        const motivation = await geminiService.getMotivation({
            currentStreak: stats.currentStreak,
            bestStreak: stats.bestStreak,
            recentAccuracy,
            ratingTrend,
            puzzlesToday: todayStats?.attempted || 0
        });

        return successResponse(res, motivation, 'Motivation generated');

    } catch (error) {
        console.error('Error generating motivation:', error);
        return errorResponse(res, 'Failed to generate motivation', 500);
    }
});

router.post('/session-feedback', authenticate, async (req, res) => {
    try {
        const { mode, solved, failed, totalAttempted, duration, score, streak, avgRating, failedThemes, solvedThemes } = req.body;

        if (!mode || totalAttempted === undefined) {
            return errorResponse(res, 'Missing required fields: mode, totalAttempted', 400);
        }

        const feedback = await geminiService.getSessionFeedback({
            mode,
            solved: solved || 0,
            failed: failed || 0,
            totalAttempted,
            duration,
            score,
            streak,
            avgRating,
            failedThemes,
            solvedThemes
        });

        return successResponse(res, feedback, 'Session feedback generated');

    } catch (error) {
        console.error('Error generating session feedback:', error);
        return errorResponse(res, 'Failed to generate session feedback', 500);
    }
});

router.get('/curation-plan', authenticate, async (req, res) => {
    try {
        const stats = await UserPuzzleStats.getOrCreate(req.userId);
        const savedProfile = stats.pulseProfile?.toObject?.() || stats.pulseProfile || null;
        const externalProfiles = getCachedExternalProfiles(
            stats.externalActivity,
            savedProfile?.externalSources || [],
            req.user
        );
        const { summary } = await getPulseActivity(req.user, stats, externalProfiles);

        return successResponse(res, {
            profile: savedProfile,
            plan: stats.pulsePlan || null,
            activity: summary,
            externalConnections: {
                chesscom: req.user.chesscomUsername || null,
                lichess: req.user.lichessUsername || null
            },
            planUpdatedAt: stats.pulsePlanUpdatedAt || null
        }, 'Pulse profile retrieved');
    } catch (error) {
        console.error('Error loading Pulse profile:', error);
        return errorResponse(res, 'Failed to load Pulse profile', 500);
    }
});

router.post('/curation-plan', authenticate, async (req, res) => {
    try {
        const parsed = parsePulseProfile(req.body?.profile, req.user);
        if (parsed.error) return errorResponse(res, parsed.error, 400);

        const stats = await UserPuzzleStats.getOrCreate(req.userId);
        const externalSync = await syncExternalChessProfiles(
            req.user,
            parsed.profile.externalSources,
            stats.externalActivity
        );
        stats.externalActivity = externalSync.cache;
        stats.markModified('externalActivity');

        const externalProfiles = getCachedExternalProfiles(
            externalSync.cache,
            parsed.profile.externalSources,
            req.user
        );
        const { summary, modelContext } = await getPulseActivity(req.user, stats, externalProfiles);
        summary.externalWarnings = externalSync.warnings;
        const plan = await geminiService.getCuratedCuration({
            profile: parsed.profile,
            activity: modelContext
        });

        stats.pulseProfile = parsed.profile;
        stats.pulsePlan = plan;
        stats.pulsePlanUpdatedAt = new Date();
        stats.markModified('pulsePlan');
        await stats.save();

        return successResponse(res, {
            profile: parsed.profile,
            plan,
            activity: summary,
            externalConnections: {
                chesscom: req.user.chesscomUsername || null,
                lichess: req.user.lichessUsername || null
            },
            planUpdatedAt: stats.pulsePlanUpdatedAt
        }, 'Pulse training plan generated');
    } catch (error) {
        console.error('Error generating Pulse training plan:', error);
        return errorResponse(res, 'Failed to generate Pulse training plan', 500);
    }
});

export default router;
