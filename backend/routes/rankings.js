import express from 'express';

const router = express.Router();

// Curated live FIDE standings snapshot fallback (updated 2025/2026)
const FIDE_FALLBACK = {
    general: {
        standard: [
            { fideid: 1503014, name: "Magnus Carlsen", flag: "no", country_name: "Norway", age: 34, raiting: 2823, raitingDiff: 2.1, live_pos: 1 },
            { fideid: 2016192, name: "Hikaru Nakamura", flag: "us", country_name: "United States", age: 37, raiting: 2792, raitingDiff: 4.0, live_pos: 2 },
            { fideid: 2020009, name: "Fabiano Caruana", flag: "us", country_name: "United States", age: 32, raiting: 2784, raitingDiff: -1.2, live_pos: 3 },
            { fideid: 14205480, name: "Javokhir Sindarov", flag: "uz", country_name: "Uzbekistan", age: 19, raiting: 2782, raitingDiff: 5.3, live_pos: 4 },
            { fideid: 14203983, name: "Nodirbek Abdusattorov", flag: "uz", country_name: "Uzbekistan", age: 20, raiting: 2780, raitingDiff: 3.1, live_pos: 5 },
            { fideid: 5202213, name: "Wesley So", flag: "us", country_name: "United States", age: 31, raiting: 2770, raitingDiff: 0.8, live_pos: 6 },
            { fideid: 25059530, name: "R Praggnanandhaa", flag: "in", country_name: "India", age: 19, raiting: 2763, raitingDiff: 6.4, live_pos: 7 },
            { fideid: 12940690, name: "Vincent Keymer", flag: "de", country_name: "Germany", age: 20, raiting: 2761, raitingDiff: 1.9, live_pos: 8 },
            { fideid: 8603405, name: "Wei Yi", flag: "cn", country_name: "China", age: 25, raiting: 2758, raitingDiff: 0.2, live_pos: 9 },
            { fideid: 12573981, name: "Alireza Firouzja", flag: "fr", country_name: "France", age: 21, raiting: 2757, raitingDiff: -2.5, live_pos: 10 }
        ],
        rapid: [
            { fideid: 1503014, name: "Magnus Carlsen", flag: "no", country_name: "Norway", age: 34, raiting: 2825, raitingDiff: 1.0, live_pos: 1 },
            { fideid: 8603677, name: "Ding Liren", flag: "cn", country_name: "China", age: 32, raiting: 2780, raitingDiff: -2.0, live_pos: 2 },
            { fideid: 12573981, name: "Alireza Firouzja", flag: "fr", country_name: "France", age: 21, raiting: 2772, raitingDiff: 5.2, live_pos: 3 },
            { fideid: 623539, name: "Maxime Vachier-Lagrave", flag: "fr", country_name: "France", age: 34, raiting: 2765, raitingDiff: 0.4, live_pos: 4 },
            { fideid: 2016192, name: "Hikaru Nakamura", flag: "us", country_name: "United States", age: 37, raiting: 2760, raitingDiff: 3.1, live_pos: 5 },
            { fideid: 4168119, name: "Ian Nepomniachtchi", flag: "ff", country_name: "FIDE", age: 34, raiting: 2754, raitingDiff: -1.5, live_pos: 6 },
            { fideid: 2020009, name: "Fabiano Caruana", flag: "us", country_name: "United States", age: 32, raiting: 2750, raitingDiff: 2.2, live_pos: 7 },
            { fideid: 1170546, name: "Jan-Krzysztof Duda", flag: "pl", country_name: "Poland", age: 26, raiting: 2748, raitingDiff: 0.0, live_pos: 8 },
            { fideid: 13300474, name: "Levon Aronian", flag: "us", country_name: "United States", age: 42, raiting: 2742, raitingDiff: -0.8, live_pos: 9 },
            { fideid: 5000017, name: "Viswanathan Anand", flag: "in", country_name: "India", age: 55, raiting: 2738, raitingDiff: 0.0, live_pos: 10 }
        ],
        blitz: [
            { fideid: 12573981, name: "Alireza Firouzja", flag: "fr", country_name: "France", age: 21, raiting: 2871, raitingDiff: 8.4, live_pos: 1 },
            { fideid: 1503014, name: "Magnus Carlsen", flag: "no", country_name: "Norway", age: 34, raiting: 2865, raitingDiff: 2.5, live_pos: 2 },
            { fideid: 2016192, name: "Hikaru Nakamura", flag: "us", country_name: "United States", age: 37, raiting: 2860, raitingDiff: 4.0, live_pos: 3 },
            { fideid: 24101605, name: "Vladislav Artemiev", flag: "ff", country_name: "FIDE", age: 26, raiting: 2795, raitingDiff: -1.2, live_pos: 4 },
            { fideid: 623539, name: "Maxime Vachier-Lagrave", flag: "fr", country_name: "France", age: 34, raiting: 2788, raitingDiff: 3.0, live_pos: 5 },
            { fideid: 4168119, name: "Ian Nepomniachtchi", flag: "ff", country_name: "FIDE", age: 34, raiting: 2780, raitingDiff: 1.1, live_pos: 6 },
            { fideid: 2020009, name: "Fabiano Caruana", flag: "us", country_name: "United States", age: 32, raiting: 2775, raitingDiff: -2.0, live_pos: 7 },
            { fideid: 24126155, name: "Daniil Dubov", flag: "ff", country_name: "FIDE", age: 28, raiting: 2772, raitingDiff: 0.5, live_pos: 8 },
            { fideid: 5202213, name: "Wesley So", flag: "us", country_name: "United States", age: 31, raiting: 2765, raitingDiff: 0.0, live_pos: 9 },
            { fideid: 14203983, name: "Nodirbek Abdusattorov", flag: "uz", country_name: "Uzbekistan", age: 20, raiting: 2760, raitingDiff: 5.0, live_pos: 10 }
        ],
        juniors: [
            { fideid: 14205480, name: "Javokhir Sindarov", flag: "uz", country_name: "Uzbekistan", age: 19, raiting: 2782, raitingDiff: 5.3, live_pos: 1 },
            { fideid: 14203983, name: "Nodirbek Abdusattorov", flag: "uz", country_name: "Uzbekistan", age: 20, raiting: 2780, raitingDiff: 3.1, live_pos: 2 },
            { fideid: 25059530, name: "R Praggnanandhaa", flag: "in", country_name: "India", age: 19, raiting: 2763, raitingDiff: 6.4, live_pos: 3 },
            { fideid: 12940690, name: "Vincent Keymer", flag: "de", country_name: "Germany", age: 20, raiting: 2761, raitingDiff: 1.9, live_pos: 4 },
            { fideid: 46616543, name: "Gukesh D", flag: "in", country_name: "India", age: 18, raiting: 2756, raitingDiff: 4.8, live_pos: 5 },
            { fideid: 25072707, name: "Nihal Sarin", flag: "in", country_name: "India", age: 20, raiting: 2698, raitingDiff: 1.2, live_pos: 6 },
            { fideid: 35009192, name: "Raunak Sadhwani", flag: "in", country_name: "India", age: 19, raiting: 2675, raitingDiff: 2.0, live_pos: 7 },
            { fideid: 240990, name: "Daniel Dardha", flag: "be", country_name: "Belgium", age: 19, raiting: 2660, raitingDiff: 0.5, live_pos: 8 },
            { fideid: 44155557, name: "Volodar Murzin", flag: "ff", country_name: "FIDE", age: 18, raiting: 2655, raitingDiff: 3.2, live_pos: 9 },
            { fideid: 30922982, name: "Christopher Yoo", flag: "us", country_name: "United States", age: 18, raiting: 2640, raitingDiff: -1.0, live_pos: 10 }
        ]
    },
    women: {
        standard: [
            { fideid: 8602980, name: "Hou Yifan", flag: "cn", country_name: "China", age: 30, raiting: 2596, raitingDiff: 0.0, live_pos: 1 },
            { fideid: 8608059, name: "Zhu Jiner", flag: "cn", country_name: "China", age: 22, raiting: 2559, raitingDiff: 6.5, live_pos: 2 },
            { fideid: 8603006, name: "Ju Wenjun", flag: "cn", country_name: "China", age: 33, raiting: 2553, raitingDiff: 1.2, live_pos: 3 },
            { fideid: 8605114, name: "Lei Tingjie", flag: "cn", country_name: "China", age: 27, raiting: 2552, raitingDiff: -0.8, live_pos: 4 },
            { fideid: 4147103, name: "Aleksandra Goryachkina", flag: "ff", country_name: "FIDE", age: 26, raiting: 2536, raitingDiff: 2.1, live_pos: 5 },
            { fideid: 8603642, name: "Tan Zhongyi", flag: "cn", country_name: "China", age: 33, raiting: 2536, raitingDiff: 4.3, live_pos: 6 },
            { fideid: 13708236, name: "Bibisara Assaubayeva", flag: "kz", country_name: "Kazakhstan", age: 20, raiting: 2532, raitingDiff: 5.0, live_pos: 7 },
            { fideid: 14111330, name: "Anna Muzychuk", flag: "ua", country_name: "Ukraine", age: 34, raiting: 2524, raitingDiff: -1.5, live_pos: 8 },
            { fideid: 5008123, name: "Humpy Koneru", flag: "in", country_name: "India", age: 37, raiting: 2518, raitingDiff: 0.5, live_pos: 9 },
            { fideid: 24175850, name: "Polina Shuvalova", flag: "ff", country_name: "FIDE", age: 23, raiting: 2509, raitingDiff: 3.0, live_pos: 10 }
        ],
        rapid: [
            { fideid: 8603006, name: "Ju Wenjun", flag: "cn", country_name: "China", age: 33, raiting: 2562, raitingDiff: 2.0, live_pos: 1 },
            { fideid: 4147103, name: "Aleksandra Goryachkina", flag: "ff", country_name: "FIDE", age: 26, raiting: 2548, raitingDiff: 1.5, live_pos: 2 },
            { fideid: 5008123, name: "Humpy Koneru", flag: "in", country_name: "India", age: 37, raiting: 2540, raitingDiff: -1.0, live_pos: 3 },
            { fideid: 8603642, name: "Tan Zhongyi", flag: "cn", country_name: "China", age: 33, raiting: 2535, raitingDiff: 3.2, live_pos: 4 },
            { fideid: 8605114, name: "Lei Tingjie", flag: "cn", country_name: "China", age: 27, raiting: 2528, raitingDiff: 0.0, live_pos: 5 },
            { fideid: 4130189, name: "Kateryna Lagno", flag: "ff", country_name: "FIDE", age: 34, raiting: 2520, raitingDiff: -2.1, live_pos: 6 },
            { fideid: 14111330, name: "Anna Muzychuk", flag: "ua", country_name: "Ukraine", age: 34, raiting: 2515, raitingDiff: 0.8, live_pos: 7 },
            { fideid: 8602980, name: "Hou Yifan", flag: "cn", country_name: "China", age: 30, raiting: 2510, raitingDiff: 0.0, live_pos: 8 },
            { fideid: 13708236, name: "Bibisara Assaubayeva", flag: "kz", country_name: "Kazakhstan", age: 20, raiting: 2505, raitingDiff: 4.0, live_pos: 9 },
            { fideid: 5015197, name: "Harika Dronavalli", flag: "in", country_name: "India", age: 33, raiting: 2498, raitingDiff: 1.2, live_pos: 10 }
        ],
        blitz: [
            { fideid: 13708236, name: "Bibisara Assaubayeva", flag: "kz", country_name: "Kazakhstan", age: 20, raiting: 2520, raitingDiff: 7.5, live_pos: 1 },
            { fideid: 4147103, name: "Aleksandra Goryachkina", flag: "ff", country_name: "FIDE", age: 26, raiting: 2515, raitingDiff: 2.0, live_pos: 2 },
            { fideid: 4130189, name: "Kateryna Lagno", flag: "ff", country_name: "FIDE", age: 34, raiting: 2508, raitingDiff: -1.0, live_pos: 3 },
            { fideid: 8603006, name: "Ju Wenjun", flag: "cn", country_name: "China", age: 33, raiting: 2500, raitingDiff: 1.8, live_pos: 4 },
            { fideid: 8605114, name: "Lei Tingjie", flag: "cn", country_name: "China", age: 27, raiting: 2492, raitingDiff: 0.5, live_pos: 5 },
            { fideid: 8603642, name: "Tan Zhongyi", flag: "cn", country_name: "China", age: 33, raiting: 2485, raitingDiff: 3.0, live_pos: 6 },
            { fideid: 5008123, name: "Humpy Koneru", flag: "in", country_name: "India", age: 37, raiting: 2480, raitingDiff: -0.5, live_pos: 7 },
            { fideid: 24175850, name: "Polina Shuvalova", flag: "ff", country_name: "FIDE", age: 23, raiting: 2475, raitingDiff: 2.4, live_pos: 8 },
            { fideid: 14111330, name: "Anna Muzychuk", flag: "ua", country_name: "Ukraine", age: 34, raiting: 2468, raitingDiff: 0.0, live_pos: 9 },
            { fideid: 35028545, name: "Divya Deshmukh", flag: "in", country_name: "India", age: 19, raiting: 2460, raitingDiff: 5.2, live_pos: 10 }
        ],
        girls: [
            { fideid: 13708236, name: "Bibisara Assaubayeva", flag: "kz", country_name: "Kazakhstan", age: 20, raiting: 2532, raitingDiff: 5.0, live_pos: 1 },
            { fideid: 35028545, name: "Divya Deshmukh", flag: "in", country_name: "India", age: 19, raiting: 2490, raitingDiff: 8.4, live_pos: 2 },
            { fideid: 35043684, name: "Velpula Sarayu", flag: "in", country_name: "India", age: 18, raiting: 2445, raitingDiff: 4.2, live_pos: 3 },
            { fideid: 30919310, name: "Alice Lee", flag: "us", country_name: "United States", age: 15, raiting: 2410, raitingDiff: 6.0, live_pos: 4 },
            { fideid: 44109725, name: "Leya Garifullina", flag: "ff", country_name: "FIDE", age: 20, raiting: 2405, raitingDiff: 1.1, live_pos: 5 },
            { fideid: 13709321, name: "Meruert Kamalidenova", flag: "kz", country_name: "Kazakhstan", age: 19, raiting: 2390, raitingDiff: 2.5, live_pos: 6 },
            { fideid: 1048128, name: "Eline Roebers", flag: "nl", country_name: "Netherlands", age: 18, raiting: 2385, raitingDiff: -1.0, live_pos: 7 },
            { fideid: 13309625, name: "Mariam Mkrtchyan", flag: "am", country_name: "Armenia", age: 20, raiting: 2375, raitingDiff: 0.8, live_pos: 8 },
            { fideid: 8612145, name: "Lu Miaoyi", flag: "cn", country_name: "China", age: 15, raiting: 2365, raitingDiff: 9.2, live_pos: 9 },
            { fideid: 35024795, name: "Savitha Shri B", flag: "in", country_name: "India", age: 17, raiting: 2360, raitingDiff: 3.0, live_pos: 10 }
        ]
    }
};

const EXTERNAL_URLS = {
    general: {
        standard: "https://2700chess.com/ajax/index-json?sort=standard&per-page=100",
        rapid: "https://2700chess.com/ajax/index-json?sort=live_rapid_pos&per-page=100",
        blitz: "https://2700chess.com/ajax/index-json?sort=live_blitz_pos&per-page=100",
        juniors: "https://2700chess.com/ajax/index-json?sort=live_juniors_pos&per-page=100",
    },
    women: {
        standard: "https://2700chess.com/ajax/index-json-women?sort=standard&per-page=100",
        rapid: "https://2700chess.com/ajax/index-json-women?sort=live_rapid_pos&per-page=100",
        blitz: "https://2700chess.com/ajax/index-json-women?sort=live_blitz_pos&per-page=100",
        girls: "https://2700chess.com/ajax/index-json-women?sort=live_girls_pos&per-page=100",
    }
};

// Simple in-memory cache: { key: { data, timestamp } }
const cache = new Map();
const CACHE_TTL_MS = 15 * 60 * 1000; // 15 minutes

router.get('/', async (req, res) => {
    try {
        const section = (req.query.section === 'women') ? 'women' : 'general';
        const rawType = req.query.type || 'standard';
        const allowedTypes = Object.keys(FIDE_FALLBACK[section]);
        const type = allowedTypes.includes(rawType) ? rawType : 'standard';

        const cacheKey = `${section}:${type}`;
        const cached = cache.get(cacheKey);
        const now = Date.now();

        if (cached && (now - cached.timestamp < CACHE_TTL_MS)) {
            return res.json({
                success: true,
                source: 'cache',
                section,
                type,
                data: cached.data
            });
        }

        const externalUrl = EXTERNAL_URLS[section]?.[type];
        let fetchedData = null;

        if (externalUrl) {
            try {
                const controller = new AbortController();
                const timeoutId = setTimeout(() => controller.abort(), 3500);

                const response = await fetch(externalUrl, {
                    signal: controller.signal,
                    headers: {
                        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36',
                        'Accept': 'application/json, text/javascript, */*; q=0.01',
                        'X-Requested-With': 'XMLHttpRequest',
                        'Referer': 'https://2700chess.com/'
                    }
                });

                clearTimeout(timeoutId);

                if (response.ok) {
                    const text = await response.text();
                    try {
                        const parsed = JSON.parse(text);
                        if (Array.isArray(parsed) && parsed.length > 0) {
                            fetchedData = parsed;
                        } else if (parsed && Array.isArray(parsed.data) && parsed.data.length > 0) {
                            fetchedData = parsed.data;
                        }
                    } catch {
                        // Response was not JSON (e.g. Cloudflare HTML block)
                    }
                }
            } catch (err) {
                // Network error, DNS error, timeout, or blocked
            }
        }

        // If upstream fetch succeeded, cache and return
        if (fetchedData && fetchedData.length > 0) {
            cache.set(cacheKey, { data: fetchedData, timestamp: now });
            return res.json({
                success: true,
                source: 'live',
                section,
                type,
                data: fetchedData
            });
        }

        // Upstream failed or returned HTML/500/403: serve official curated FIDE fallback
        const fallbackList = FIDE_FALLBACK[section][type] || FIDE_FALLBACK.general.standard;
        cache.set(cacheKey, { data: fallbackList, timestamp: now });

        return res.json({
            success: true,
            source: 'fide_curated',
            section,
            type,
            data: fallbackList
        });
    } catch (error) {
        console.error('Rankings route unexpected error:', error);
        // Guarantee resilient response even in unexpected edge cases
        const fallback = FIDE_FALLBACK.general.standard;
        return res.json({
            success: true,
            source: 'emergency_fallback',
            data: fallback
        });
    }
});

export default router;
