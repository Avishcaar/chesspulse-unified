import { Chess } from 'chess.js';

const MAX_GAMES = 40;
const MAX_CHESSCOM_ARCHIVES = 4;
const PROFILE_CACHE_MS = 12 * 60 * 60 * 1000;
const REQUEST_TIMEOUT_MS = 10000;
const USER_AGENT = `ChessPulse/1.0 (${process.env.APP_URL || 'https://github.com/aavishkark/chesspulse_backend'})`;

const PROVIDERS = {
    chesscom: {
        label: 'Chess.com',
        field: 'chesscomUsername',
        host: 'api.chess.com'
    },
    lichess: {
        label: 'Lichess',
        field: 'lichessUsername',
        host: 'lichess.org'
    }
};

function cleanUsername(provider, value) {
    const raw = String(value || '').trim();
    const patterns = {
        chesscom: /^(?:https?:\/\/)?(?:www\.)?chess\.com\/member\/([^/?#]+).*$/i,
        lichess: /^(?:https?:\/\/)?(?:www\.|en\.)?lichess\.org\/@\/([^/?#]+).*$/i
    };
    const handle = raw.replace(patterns[provider], '$1').replace(/^@/, '');
    const valid = provider === 'chesscom'
        ? /^[a-z0-9_-]{2,30}$/i.test(handle)
        : /^[a-z0-9_-]{2,30}$/i.test(handle);

    if (!valid) {
        throw new Error(`Enter a valid ${PROVIDERS[provider].label} username in Profile settings.`);
    }

    return handle;
}

function createTimeoutSignal() {
    if (typeof AbortSignal.timeout === 'function') return AbortSignal.timeout(REQUEST_TIMEOUT_MS);
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
    timeout.unref?.();
    return controller.signal;
}

async function fetchExternal(url, provider, accept = 'application/json') {
    const parsed = new URL(url);
    if (parsed.protocol !== 'https:' || parsed.hostname !== PROVIDERS[provider].host) {
        throw new Error(`The ${PROVIDERS[provider].label} API returned an unexpected URL.`);
    }

    const response = await fetch(parsed, {
        headers: {
            Accept: accept,
            'User-Agent': USER_AGENT
        },
        signal: createTimeoutSignal()
    });

    if (!response.ok) {
        if (response.status === 404) throw new Error(`The saved ${PROVIDERS[provider].label} username was not found.`);
        if (response.status === 429) throw new Error(`${PROVIDERS[provider].label} is rate limiting imports. Try again later.`);
        throw new Error(`${PROVIDERS[provider].label} could not provide profile data (${response.status}).`);
    }

    return accept.includes('ndjson') ? response.text() : response.json();
}

function safeNumber(value, min = -Infinity, max = Infinity) {
    if (value === null || value === undefined || (typeof value === 'string' && !value.trim())) return null;
    const number = Number(value);
    return Number.isFinite(number) && number >= min && number <= max ? number : null;
}

function safeCount(value, max = 10000000) {
    return Math.max(0, Math.min(max, Math.round(safeNumber(value, 0, max) || 0)));
}

function safePercent(value) {
    return safeNumber(value, 0, 100);
}

function safeText(value, maxLength = 100) {
    if (typeof value !== 'string') return '';
    return value
        .replace(/[^\p{L}\p{N}\p{M}\s.,'():-]/gu, ' ')
        .replace(/[\r\n\t]+/g, ' ')
        .replace(/\s+/g, ' ')
        .trim()
        .slice(0, maxLength);
}

function safeSpeed(value) {
    const speed = String(value || '').toLowerCase();
    return ['bullet', 'blitz', 'rapid', 'classical', 'daily'].includes(speed) ? speed : 'unknown';
}

function safeEco(value) {
    return typeof value === 'string' && /^[A-E]\d{2}$/i.test(value) ? value.toUpperCase() : null;
}

function normalizeRatingEntries(entries = []) {
    return entries
        .filter((entry) => Number.isFinite(entry.rating) && typeof entry.category === 'string')
        .map((entry) => ({
            category: safeSpeed(entry.category),
            rating: Math.round(entry.rating),
            gamesPlayed: safeCount(entry.gamesPlayed),
            wins: safeCount(entry.wins),
            draws: safeCount(entry.draws),
            losses: safeCount(entry.losses)
        }))
        .filter((entry) => entry.category !== 'unknown' && entry.rating >= 0 && entry.rating <= 4000);
}

function summarizeGames(games, ratings) {
    const bySpeed = new Map();
    const byOpening = new Map();
    const counts = { wins: 0, draws: 0, losses: 0 };
    const accuracies = [];
    const analysisTotals = {
        blunders: 0,
        mistakes: 0,
        inaccuracies: 0,
        blunderGames: 0,
        mistakeGames: 0,
        inaccuracyGames: 0,
        analyzedGames: 0
    };
    const recent = games.slice(0, 12);

    games.forEach((game) => {
        const resultKey = game.result === 'win' ? 'wins' : game.result === 'draw' ? 'draws' : game.result === 'loss' ? 'losses' : null;
        if (resultKey) counts[resultKey] += 1;
        const speed = safeSpeed(game.speed);
        const speedRecord = bySpeed.get(speed) || {
            speed,
            games: 0,
            wins: 0,
            draws: 0,
            losses: 0,
            accuracies: [],
            blunders: 0,
            mistakes: 0,
            inaccuracies: 0,
            blunderGames: 0,
            mistakeGames: 0,
            inaccuracyGames: 0,
            analyzedGames: 0
        };
        speedRecord.games += 1;
        if (['win', 'draw', 'loss'].includes(game.result)) {
            speedRecord[game.result === 'win' ? 'wins' : game.result === 'draw' ? 'draws' : 'losses'] += 1;
        }
        const accuracy = safePercent(game.accuracy);
        if (accuracy !== null) {
            speedRecord.accuracies.push(accuracy);
            accuracies.push(accuracy);
        }
        const blunders = game.blunders !== null && game.blunders !== undefined && Number.isFinite(game.blunders)
            ? safeCount(game.blunders, 1000)
            : null;
        const mistakes = game.mistakes !== null && game.mistakes !== undefined && Number.isFinite(game.mistakes)
            ? safeCount(game.mistakes, 1000)
            : null;
        const inaccuracies = game.inaccuracies !== null && game.inaccuracies !== undefined && Number.isFinite(game.inaccuracies)
            ? safeCount(game.inaccuracies, 1000)
            : null;
        if (blunders !== null || mistakes !== null || inaccuracies !== null) {
            speedRecord.analyzedGames += 1;
            analysisTotals.analyzedGames += 1;
        }
        if (blunders !== null) {
            speedRecord.blunders += blunders;
            speedRecord.blunderGames += 1;
            analysisTotals.blunders += blunders;
            analysisTotals.blunderGames += 1;
        }
        if (mistakes !== null) {
            speedRecord.mistakes += mistakes;
            speedRecord.mistakeGames += 1;
            analysisTotals.mistakes += mistakes;
            analysisTotals.mistakeGames += 1;
        }
        if (inaccuracies !== null) {
            speedRecord.inaccuracies += inaccuracies;
            speedRecord.inaccuracyGames += 1;
            analysisTotals.inaccuracies += inaccuracies;
            analysisTotals.inaccuracyGames += 1;
        }
        bySpeed.set(speed, speedRecord);

        const opening = safeText(game.opening);
        if (opening && opening !== 'Unknown') {
            const openingRecord = byOpening.get(opening) || {
                opening,
                eco: safeEco(game.eco),
                games: 0,
                wins: 0,
                draws: 0,
                losses: 0,
                accuracies: []
            };
            openingRecord.games += 1;
            if (game.result === 'win') openingRecord.wins += 1;
            if (game.result === 'draw') openingRecord.draws += 1;
            if (game.result === 'loss') openingRecord.losses += 1;
            if (accuracy !== null) openingRecord.accuracies.push(accuracy);
            byOpening.set(opening, openingRecord);
        }
    });

    const toPerformance = (record) => {
        const total = record.wins + record.draws + record.losses;
        return {
            ...record,
            scorePercent: total ? Math.round(((record.wins + record.draws / 2) / total) * 100) : null,
            averageAccuracy: record.accuracies?.length
                ? Math.round(record.accuracies.reduce((sum, item) => sum + item, 0) / record.accuracies.length)
                : null,
            averageBlunders: record.blunderGames
                ? Number((record.blunders / record.blunderGames).toFixed(1))
                : null,
            averageMistakes: record.mistakeGames
                ? Number((record.mistakes / record.mistakeGames).toFixed(1))
                : null,
            averageInaccuracies: record.inaccuracyGames
                ? Number((record.inaccuracies / record.inaccuracyGames).toFixed(1))
                : null,
            blunders: undefined,
            mistakes: undefined,
            inaccuracies: undefined,
            blunderGames: undefined,
            mistakeGames: undefined,
            inaccuracyGames: undefined,
            analyzedGames: undefined,
            accuracies: undefined
        };
    };

    const speedPerformance = [...bySpeed.values()]
        .map(toPerformance)
        .sort((a, b) => b.games - a.games);
    const openingPerformance = [...byOpening.values()]
        .map(toPerformance)
        .sort((a, b) => b.games - a.games)
        .slice(0, 8);
    const total = games.length;

    return {
        gamesAnalyzed: total,
        totalGamesOnProvider: ratings.reduce((sum, item) => sum + item.gamesPlayed, 0) || null,
        record: counts,
        scorePercent: total ? Math.round(((counts.wins + counts.draws / 2) / total) * 100) : null,
        averageAccuracy: accuracies.length
            ? Math.round(accuracies.reduce((sum, item) => sum + item, 0) / accuracies.length)
            : null,
        analysis: analysisTotals.analyzedGames
            ? {
                analyzedGames: analysisTotals.analyzedGames,
                averageBlunders: analysisTotals.blunderGames
                    ? Number((analysisTotals.blunders / analysisTotals.blunderGames).toFixed(1))
                    : null,
                averageMistakes: analysisTotals.mistakeGames
                    ? Number((analysisTotals.mistakes / analysisTotals.mistakeGames).toFixed(1))
                    : null,
                averageInaccuracies: analysisTotals.inaccuracyGames
                    ? Number((analysisTotals.inaccuracies / analysisTotals.inaccuracyGames).toFixed(1))
                    : null
            }
            : null,
        bySpeed: speedPerformance,
        openings: openingPerformance,
        recentGames: recent.map(({ result, speed, opening, accuracy, rating, moveCount, playedAt }) => ({
            result,
            speed: safeSpeed(speed),
            opening: safeText(opening) || 'Unknown',
            accuracy: safePercent(accuracy),
            rating: safeNumber(rating, 0, 4000),
            moveCount: safeCount(moveCount, 1000) || null,
            playedAt: safeNumber(playedAt, 0) || null
        }))
    };
}

function chesscomResult(game, side, headers) {
    const resultCode = String(game?.[side]?.result || '').toLowerCase();
    if (resultCode === 'win') return 'win';
    if (['agreed', 'stalemate', 'repetition', 'insufficient', '50move'].includes(resultCode)) return 'draw';
    if (['checkmated', 'timeout', 'resigned', 'abandoned'].includes(resultCode)) return 'loss';

    const result = headers.Result || '';
    if (result === '1/2-1/2') return 'draw';
    if ((result === '1-0' && side === 'white') || (result === '0-1' && side === 'black')) return 'win';
    if (result === '1-0' || result === '0-1') return 'loss';
    return 'unknown';
}

function parseChesscomGame(game, username) {
    if (!game?.pgn || game.rated === false || (game.rules && game.rules !== 'chess')) return null;
    const whiteName = String(game.white?.username || '').toLowerCase();
    const side = whiteName === username.toLowerCase() ? 'white' : 'black';
    const chess = new Chess();
    let headers = {};
    let moveCount = 0;
    try {
        chess.loadPgn(game.pgn);
        headers = chess.header();
        moveCount = chess.history().length;
    } catch {
        return null;
    }

    const rawOpening = safeText(headers.Opening || '');
    const eco = safeEco(headers.ECO);
    const ecoUrl = typeof game.eco === 'string' ? game.eco : '';
    const openingFromUrl = ecoUrl.split('/').filter(Boolean).pop()?.replace(/-/g, ' ');
    return {
        result: chesscomResult(game, side, headers),
        speed: safeSpeed(game.time_class),
        opening: rawOpening || safeText(openingFromUrl) || 'Unknown',
        eco,
        accuracy: safePercent(game.accuracies?.[side]),
        rating: safeNumber(game[side]?.rating, 0, 4000),
        moveCount: moveCount ? Math.ceil(moveCount / 2) : null,
        playedAt: safeNumber(game.end_time, 0)
    };
}

async function fetchChesscomProfile(savedUsername) {
    const username = cleanUsername('chesscom', savedUsername);
    const baseUrl = `https://api.chess.com/pub/player/${encodeURIComponent(username)}`;
    const [profile, stats, archivesResponse] = await Promise.all([
        fetchExternal(baseUrl, 'chesscom'),
        fetchExternal(`${baseUrl}/stats`, 'chesscom'),
        fetchExternal(`${baseUrl}/games/archives`, 'chesscom')
    ]);
    const archiveUrls = Array.isArray(archivesResponse.archives) ? archivesResponse.archives.slice(-MAX_CHESSCOM_ARCHIVES).reverse() : [];

    const archives = await Promise.allSettled(
        archiveUrls.map((archiveUrl) => fetchExternal(archiveUrl, 'chesscom'))
    );
    const games = [];
    for (const result of archives) {
        if (games.length >= MAX_GAMES) break;
        if (result.status !== 'fulfilled') continue;
        const archive = result.value;
        const archiveGames = Array.isArray(archive.games) ? [...archive.games].reverse() : [];
        for (const game of archiveGames) {
            const parsed = parseChesscomGame(game, username);
            if (!parsed || parsed.result === 'unknown') continue;
            games.push(parsed);
            if (games.length >= MAX_GAMES) break;
        }
    }

    const ratingKeys = [
        ['chess_bullet', 'bullet'],
        ['chess_blitz', 'blitz'],
        ['chess_rapid', 'rapid'],
        ['chess_daily', 'daily']
    ];
    const ratings = normalizeRatingEntries(ratingKeys.map(([key, category]) => {
        const entry = stats?.[key];
        return {
            category,
            rating: safeNumber(entry?.last?.rating, 0, 4000),
            gamesPlayed: safeCount(entry?.record?.win) + safeCount(entry?.record?.draw) + safeCount(entry?.record?.loss),
            wins: safeCount(entry?.record?.win),
            draws: safeCount(entry?.record?.draw),
            losses: safeCount(entry?.record?.loss)
        };
    }));

    return {
        provider: 'chesscom',
        username,
        fetchedAt: new Date().toISOString(),
        ratings,
        puzzleStats: {
            tacticsHighest: safeNumber(stats?.tactics?.highest?.rating, 0, 4000),
            tacticsLowest: safeNumber(stats?.tactics?.lowest?.rating, 0, 4000),
            puzzleRushBest: safeCount(stats?.puzzle_rush?.best?.score, 10000),
            puzzleRushDaily: safeCount(stats?.puzzle_rush?.daily?.score, 10000)
        },
        performance: summarizeGames(games, ratings)
    };
}

function parseLichessGame(game, username) {
    if (!game?.rated || game.variant !== 'standard') return null;
    const playerId = (player) => String(player?.user?.id || player?.user?.name || player?.name || '').toLowerCase();
    const normalizedUsername = username.toLowerCase();
    const side = playerId(game.players?.white) === normalizedUsername
        ? 'white'
        : playerId(game.players?.black) === normalizedUsername
            ? 'black'
            : null;
    if (!side) return null;
    const ownPlayer = game.players?.[side] || {};
    const result = game.winner === side ? 'win' : game.winner ? 'loss' : 'draw';
    const ownAnalysis = ownPlayer.analysis || {};

    return {
        result,
        speed: safeSpeed(game.speed || game.perf),
        opening: safeText(game.opening?.name) || 'Unknown',
        eco: safeEco(game.opening?.eco),
        accuracy: safePercent(ownAnalysis.accuracy ?? game.accuracy?.[side] ?? ownPlayer.accuracy),
        blunders: ownAnalysis.blunder === undefined ? null : safeCount(ownAnalysis.blunder, 1000),
        mistakes: ownAnalysis.mistake === undefined ? null : safeCount(ownAnalysis.mistake, 1000),
        inaccuracies: ownAnalysis.inaccuracy === undefined ? null : safeCount(ownAnalysis.inaccuracy, 1000),
        rating: safeNumber(ownPlayer.rating, 0, 4000),
        moveCount: safeCount(game.division?.end || game.moves?.split(' ').filter(Boolean).length, 1000) || null,
        playedAt: safeNumber(game.createdAt, 0)
    };
}

async function fetchLichessProfile(savedUsername) {
    const username = cleanUsername('lichess', savedUsername);
    const profileUrl = `https://lichess.org/api/user/${encodeURIComponent(username)}`;
    const gameUrl = new URL(`https://lichess.org/api/games/user/${encodeURIComponent(username)}`);
    gameUrl.searchParams.set('max', String(MAX_GAMES));
    gameUrl.searchParams.set('perfType', 'bullet,blitz,rapid,classical');
    gameUrl.searchParams.set('rated', 'true');
    gameUrl.searchParams.set('opening', 'true');
    gameUrl.searchParams.set('accuracy', 'true');
    gameUrl.searchParams.set('division', 'true');
    gameUrl.searchParams.set('moves', 'false');
    const [profile, ndjson] = await Promise.all([
        fetchExternal(profileUrl, 'lichess'),
        fetchExternal(gameUrl.toString(), 'lichess', 'application/x-ndjson')
    ]);
    const games = ndjson.split('\n').filter(Boolean).flatMap((line) => {
        try {
            const parsed = parseLichessGame(JSON.parse(line), username);
            return parsed && parsed.result !== 'unknown' ? [parsed] : [];
        } catch {
            return [];
        }
    });

    const ratings = normalizeRatingEntries(['bullet', 'blitz', 'rapid', 'classical'].map((category) => ({
        category,
        rating: safeNumber(profile.perfs?.[category]?.rating, 0, 4000),
        gamesPlayed: safeCount(profile.perfs?.[category]?.games)
    })));

    return {
        provider: 'lichess',
        username,
        fetchedAt: new Date().toISOString(),
        ratings,
        puzzleStats: {
            rating: safeNumber(profile.perfs?.puzzle?.rating, 0, 4000),
            gamesPlayed: safeCount(profile.perfs?.puzzle?.games)
        },
        performance: summarizeGames(games, ratings)
    };
}

export function getCachedExternalProfiles(cache = {}, providers = [], user = {}) {
    return providers
        .map((provider) => ({ provider, profile: cache?.providers?.[provider] }))
        .filter(({ provider, profile }) => {
            if (!profile) return false;
            const config = PROVIDERS[provider];
            if (!config || profile.provider !== provider) return false;
            if (!user?.[config.field]) return false;
            try {
                return cleanUsername(provider, user[config.field]).toLowerCase() === String(profile.username || '').toLowerCase();
            } catch {
                return false;
            }
        })
        .map(({ profile }) => profile);
}

export async function syncExternalChessProfiles(user, requestedProviders = [], existingCache = {}) {
    const cache = {
        providers: { ...(existingCache?.providers || {}) }
    };
    const warnings = [];
    const now = Date.now();
    const requested = new Set(requestedProviders);

    for (const provider of Object.keys(cache.providers)) {
        if (PROVIDERS[provider] && !requested.has(provider)) {
            delete cache.providers[provider];
        }
    }

    await Promise.all(requestedProviders.map(async (provider) => {
        const config = PROVIDERS[provider];
        if (!config) return;

        const savedUsername = user?.[config.field];
        if (!savedUsername) {
            warnings.push(`${config.label} is selected, but no username is saved in Profile settings.`);
            return;
        }

        let username;
        try {
            username = cleanUsername(provider, savedUsername);
        } catch (error) {
            warnings.push(error.message);
            return;
        }

        const cached = cache.providers[provider];
        const cachedUsername = typeof cached?.username === 'string' ? cached.username : '';
        if (
            cached && (
                cached.provider !== provider ||
                !cachedUsername ||
                cachedUsername.toLowerCase() !== username.toLowerCase()
            )
        ) {
            delete cache.providers[provider];
        }
        const cacheAge = cached?.fetchedAt ? now - new Date(cached.fetchedAt).getTime() : Infinity;
        if (
            cached?.provider === provider &&
            cachedUsername.toLowerCase() === username.toLowerCase() &&
            Number.isFinite(cacheAge) && cacheAge >= 0 && cacheAge < PROFILE_CACHE_MS
        ) {
            return;
        }

        try {
            cache.providers[provider] = provider === 'chesscom'
                ? await fetchChesscomProfile(savedUsername)
                : await fetchLichessProfile(savedUsername);
        } catch (error) {
            console.error(`Failed to import ${config.label} profile:`, error);
            warnings.push(`${config.label} could not be refreshed. Pulse used any saved summary and your other training data.`);
        }
    }));

    return { cache, warnings };
}
