import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { puzzleService } from '../../services/puzzleService';
import { puzzleStatsService } from '../../services/puzzleStatsService';
import PuzzleBoard from '../../Components/PuzzleBoard/PuzzleBoard';
import { PageAmbient } from '../../Components/UI/PageHeader';
import {
  ArrowRight,
  BookOpen,
  Brain,
  CheckCircle2,
  Clock3,
  Crosshair,
  Eye,
  Lightbulb,
  LoaderCircle,
  Play,
  RotateCcw,
  ShieldCheck,
  Target,
  Timer,
  Trophy,
} from 'lucide-react';
import './puzzleCurated.css';

const LEVELS = [
  { id: 'new', label: 'Just starting', detail: 'Learning the board and basic ideas' },
  { id: 'beginner', label: 'Beginner', detail: 'Up to about 1,200 rating' },
  { id: 'club', label: 'Club player', detail: 'About 1,200–1,600' },
  { id: 'intermediate', label: 'Intermediate', detail: 'About 1,600–2,000' },
  { id: 'advanced', label: 'Advanced', detail: 'About 2,000–2,200' },
  { id: 'expert', label: 'Expert', detail: 'Above about 2,200' },
];

const GOALS = [
  { id: 'tactics', label: 'Tactics', detail: 'Find forks, pins, and winning shots', Icon: Crosshair },
  { id: 'opening', label: 'Opening theory', detail: 'Recognize ideas in the opening', Icon: BookOpen },
  { id: 'middlegame', label: 'Middlegame plans', detail: 'Turn positions into clear plans', Icon: Brain },
  { id: 'endgame', label: 'Endgames', detail: 'Improve technique in simpler positions', Icon: Trophy },
  { id: 'calculation', label: 'Calculation', detail: 'See forcing lines more accurately', Icon: Target },
  { id: 'boardVision', label: 'Board vision', detail: 'Notice threats and loose pieces', Icon: Eye },
];

const CHALLENGES = [
  { id: 'missTactics', label: 'I miss opponent threats or leave pieces hanging' },
  { id: 'calculateLines', label: 'I struggle to calculate forcing lines' },
  { id: 'openingTransitions', label: 'I leave the opening without a clear plan' },
  { id: 'middlegamePlans', label: 'I am unsure what to improve in the middlegame' },
  { id: 'endgameTechnique', label: 'I lose technique in simplified positions' },
  { id: 'timePressure', label: 'I rush decisions under time pressure' },
  { id: 'unsure', label: 'I am not sure yet—help me explore' },
];

const SESSION_LENGTHS = [10, 20, 30];
const EXTERNAL_PROVIDERS = [
  { id: 'chesscom', label: 'Chess.com', detail: 'Recent rated games and public ratings' },
  { id: 'lichess', label: 'Lichess', detail: 'Recent rated games, openings, and analysis when available' },
];
const EMPTY_PROFILE = {
  level: '',
  rating: '',
  goals: [],
  challenge: 'unsure',
  sessionMinutes: 20,
  externalSources: [],
};

function formatTheme(theme = '') {
  const title = theme
    .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
    .replace(/([A-Z])([A-Z][a-z])/g, '$1 $2')
    .replace(/In(\d)/g, 'In $1')
    .replace(/^./, (letter) => letter.toUpperCase());
  return title.replace(/\bIn\b/g, 'in');
}

function fitPlanToPuzzles(trainingPlan, puzzles) {
  const themeCounts = {};
  let mixedCount = 0;

  puzzles.forEach((puzzle) => {
    const matchingTheme = (trainingPlan.themes || []).find((item) =>
      puzzle.themes?.some((theme) => theme.toLowerCase() === item.theme.toLowerCase())
    )?.theme;

    if (matchingTheme) {
      themeCounts[matchingTheme] = (themeCounts[matchingTheme] || 0) + 1;
    } else {
      mixedCount += 1;
    }
  });

  const themes = (trainingPlan.themes || [])
    .map((item) => ({ ...item, count: themeCounts[item.theme] || 0 }))
    .filter((item) => item.count > 0);

  if (mixedCount > 0) {
    themes.push({
      theme: 'mixedPractice',
      count: mixedCount,
      reason: 'Extra positions reinforce your target difficulty from the verified puzzle library.',
    });
  }

  return { ...trainingPlan, totalCount: puzzles.length, themes };
}

function PulseHeader({ view, onEndSession }) {
  return (
    <header className="pulse-page-header">
      <div className="pulse-kicker">
        Personal chess training
      </div>
      <div className="pulse-header-row">
        <div>
          <h1>Pulse</h1>
          <p>
            A puzzle session shaped by your goals and the way you play.
          </p>
        </div>
        {view === 'playing' && (
          <button type="button" className="pulse-end-button" onClick={onEndSession}>
            End session
          </button>
        )}
      </div>
    </header>
  );
}

function ActivityContext({ activity }) {
  const externalProfiles = activity?.externalProfiles || [];
  if (!activity?.hasPlayData && externalProfiles.length === 0) {
    return (
      <div className="pulse-first-session">
        <div>
          <strong>A clean starting point</strong>
          <p>
            Pulse will build your first plan from your answers. As you solve puzzles and play games,
            it can use that history to tune future sessions.
          </p>
        </div>
      </div>
    );
  }

  const metrics = activity?.hasChessPulseData ? [
    { label: 'Puzzle attempts', value: activity.puzzleAttempts || 0 },
    { label: 'Multiplayer games', value: activity.multiplayerGames || 0 },
    { label: 'Bot games', value: activity.botGames || 0 },
    { label: 'Puzzle rating', value: activity.puzzleRating || '—' },
  ] : [];

  return (
    <>
      <div className="pulse-history-intro">
        <div>
          <strong>{activity?.hasChessPulseData ? 'Your ChessPulse history is included' : 'Your selected profile history is included'}</strong>
          <p>Pulse combines the selected game summaries with the goals you choose.</p>
        </div>
      </div>
      {metrics.length > 0 && (
        <div className="pulse-activity-grid">
          {metrics.map((metric) => (
            <div className="pulse-activity-metric" key={metric.label}>
              <span>{metric.label}</span>
              <strong>{metric.value}</strong>
            </div>
          ))}
        </div>
      )}
      {activity.weakThemes?.length > 0 && (
        <div className="pulse-activity-focus">
          <span className="pulse-mini-label">RECENT PUZZLE FOCUS</span>
          <div className="pulse-chip-row">
            {activity.weakThemes.slice(0, 4).map((item) => (
              <span className="pulse-data-chip" key={item.theme}>
                {formatTheme(item.theme)} <b>{item.accuracy}%</b>
              </span>
            ))}
          </div>
        </div>
      )}
      {externalProfiles.length > 0 && (
        <div className="pulse-external-history">
          <span className="pulse-mini-label">IMPORTED PUBLIC GAMES</span>
          {externalProfiles.map((external) => (
            <div className="pulse-external-history-card" key={external.provider}>
              <div>
                <strong>{external.provider === 'chesscom' ? 'Chess.com' : 'Lichess'}</strong>
                <span>{external.username}</span>
              </div>
              <p>
                {external.gamesAnalyzed} recent games reviewed
                {external.averageAccuracy != null ? ` | ${external.averageAccuracy}% average accuracy` : ''}
                {external.scorePercent != null ? ` | ${external.scorePercent}% score` : ''}
                {external.puzzleStats?.rating != null ? ` | ${external.puzzleStats.rating} puzzle rating` : ''}
                {external.puzzleStats?.puzzleRushBest != null ? ` | Puzzle Rush best ${external.puzzleStats.puzzleRushBest}` : ''}
              </p>
              {external.analysis && (
                <small>
                  Analysis available for {external.analysis.analyzedGames} games
                  {external.analysis.averageBlunders != null ? ` | ${external.analysis.averageBlunders} average blunders` : ''}
                </small>
              )}
            </div>
          ))}
        </div>
      )}
      {activity.externalWarnings?.length > 0 && (
        <p className="pulse-external-warning" role="status">{activity.externalWarnings.join(' ')}</p>
      )}
    </>
  );
}

export default function PuzzleCuratedPage() {
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const [view, setView] = useState('loading');
  const [profile, setProfile] = useState(EMPTY_PROFILE);
  const [activity, setActivity] = useState(null);
  const [externalConnections, setExternalConnections] = useState({ chesscom: null, lichess: null });
  const [plan, setPlan] = useState(null);
  const [puzzles, setPuzzles] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [puzzlesSolved, setPuzzlesSolved] = useState(0);
  const [puzzlesAttempted, setPuzzlesAttempted] = useState(0);
  const [formError, setFormError] = useState('');
  const [pageError, setPageError] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [loadingFeedback, setLoadingFeedback] = useState(false);
  const [aiFeedback, setAiFeedback] = useState(null);

  const loadPlanPuzzles = useCallback(async (trainingPlan) => {
    const requestedCount = Math.max(1, Number(trainingPlan?.totalCount) || 8);
    const targetRating = Number(trainingPlan?.targetRating) || 1200;
    const usedIds = new Set();
    const selected = [];

    for (const item of trainingPlan?.themes || []) {
      if (selected.length >= requestedCount) break;
      const count = Math.min(Number(item.count) || 0, requestedCount - selected.length);
      if (count < 1) continue;
      let selectedForTheme = 0;

      for (const ratingRange of [350, 700, 1100]) {
        const remainingForTheme = Math.min(count - selectedForTheme, requestedCount - selected.length);
        if (remainingForTheme < 1) break;

        const batch = await puzzleService.getPuzzlesBatchWithFilters(remainingForTheme, {
          themes: [item.theme],
          rating: targetRating,
          ratingRange,
          exclude: [...usedIds],
          strict: true,
        });

        for (const puzzle of batch) {
          const matchesTheme = puzzle?.themes?.some(
            (theme) => theme.toLowerCase() === item.theme.toLowerCase()
          );
          const matchesRating = puzzle && Math.abs(puzzle.rating - targetRating) <= ratingRange;
          if (!puzzle?.id || usedIds.has(puzzle.id) || !matchesTheme || !matchesRating) continue;
          usedIds.add(puzzle.id);
          selected.push(puzzle);
          selectedForTheme += 1;
        }
      }
    }

    if (selected.length < requestedCount) {
      for (const item of trainingPlan?.themes || []) {
        if (selected.length >= requestedCount) break;
        const remaining = requestedCount - selected.length;
        const filler = await puzzleService.getPuzzlesBatchWithFilters(remaining, {
          themes: [item.theme],
          rating: targetRating,
          ratingRange: 1100,
          exclude: [...usedIds],
          strict: true,
        });

        for (const puzzle of filler) {
          const matchesTheme = puzzle?.themes?.some(
            (theme) => theme.toLowerCase() === item.theme.toLowerCase()
          );
          if (!puzzle?.id || usedIds.has(puzzle.id) || !matchesTheme) continue;
          usedIds.add(puzzle.id);
          selected.push(puzzle);
        }
      }
    }

    if (selected.length < requestedCount) {
      const remaining = requestedCount - selected.length;
      const filler = await puzzleService.getPuzzlesBatchWithFilters(remaining, {
        rating: targetRating,
        ratingRange: 1100,
        exclude: [...usedIds],
        strict: true,
      });

      for (const puzzle of filler) {
        if (!puzzle?.id || usedIds.has(puzzle.id)) continue;
        usedIds.add(puzzle.id);
        selected.push(puzzle);
      }
    }

    return selected.slice(0, requestedCount);
  }, []);

  useEffect(() => {
    if (authLoading || !isAuthenticated) return undefined;

    let active = true;
    const loadProfile = async () => {
      setView('loading');
      try {
        const response = await puzzleStatsService.getCurationPlan();
        const data = response?.data || {};
        if (!active) return;

        setActivity(data.activity || null);
        const connections = data.externalConnections || { chesscom: null, lichess: null };
        setExternalConnections(connections);
        if (data.profile) {
          const externalSources = (data.profile.externalSources || [])
            .filter((source) => Boolean(connections[source]));
          setProfile({
            ...EMPTY_PROFILE,
            ...data.profile,
            externalSources,
            rating: data.profile.rating == null ? '' : String(data.profile.rating),
          });
        }

        if (data.plan) {
          const loadedPuzzles = await loadPlanPuzzles(data.plan);
          if (!active) return;
          if (loadedPuzzles.length === 0) {
            setPageError('Pulse could not find puzzles for your saved focus. Update your answers to build a new plan.');
            setView('intake');
            return;
          }
          setPlan(fitPlanToPuzzles(data.plan, loadedPuzzles));
          setPuzzles(loadedPuzzles);
          setView('ready');
        } else {
          setView('intake');
        }
      } catch (error) {
        if (!active) return;
        setPageError('Pulse could not load your saved training profile. You can still build a new one below.');
        setView('intake');
      }
    };

    loadProfile();
    return () => { active = false; };
  }, [authLoading, isAuthenticated, loadPlanPuzzles]);

  const generatePlan = useCallback(async (nextProfile = profile) => {
    setPageError('');
    setFormError('');
    setIsGenerating(true);

    const requestProfile = {
      ...nextProfile,
      rating: nextProfile.rating === '' || nextProfile.rating == null
        ? null
        : Number(nextProfile.rating),
    };

    try {
      const response = await puzzleStatsService.generateCurationPlan(requestProfile);
      const data = response?.data || {};
      const nextPlan = data.plan;
      if (!nextPlan) throw new Error('Pulse did not return a training plan.');

      const loadedPuzzles = await loadPlanPuzzles(nextPlan);
      if (loadedPuzzles.length === 0) {
        throw new Error('Pulse could not find any matching puzzles. Try changing your goals and build the plan again.');
      }

      setProfile({
        ...EMPTY_PROFILE,
        ...(data.profile || requestProfile),
        rating: (data.profile || requestProfile).rating == null
          ? ''
          : String((data.profile || requestProfile).rating),
      });
      setActivity(data.activity || null);
      setExternalConnections(data.externalConnections || externalConnections);
      setPlan(fitPlanToPuzzles(nextPlan, loadedPuzzles));
      setPuzzles(loadedPuzzles);
      setCurrentIndex(0);
      setAiFeedback(null);
      setView('ready');
    } catch (error) {
      setPageError(error.response?.data?.message || error.message || 'Pulse could not build your plan. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  }, [externalConnections, loadPlanPuzzles, profile]);

  const toggleGoal = (goalId) => {
    setFormError('');
    if (profile.goals.includes(goalId)) {
      setProfile((current) => ({
        ...current,
        goals: current.goals.filter((goal) => goal !== goalId),
      }));
      return;
    }
    if (profile.goals.length >= 3) {
      setFormError('Choose up to three focus areas.');
      return;
    }
    setProfile((current) => ({ ...current, goals: [...current.goals, goalId] }));
  };

  const toggleExternalSource = (sourceId) => {
    setProfile((current) => ({
      ...current,
      externalSources: current.externalSources.includes(sourceId)
        ? current.externalSources.filter((source) => source !== sourceId)
        : [...current.externalSources, sourceId],
    }));
  };

  const submitProfile = (event) => {
    event.preventDefault();
    if (!profile.level) {
      setFormError('Choose the level that best describes your current chess strength.');
      return;
    }
    if (profile.goals.length === 0) {
      setFormError('Choose at least one area you want to improve.');
      return;
    }
    generatePlan(profile);
  };

  const startSession = () => {
    if (puzzles.length === 0) return;
    setPuzzlesSolved(0);
    setPuzzlesAttempted(0);
    setCurrentIndex(0);
    setAiFeedback(null);
    setView('playing');
  };

  const endSession = useCallback(async () => {
    setView('results');
    if (puzzlesAttempted === 0) return;

    setLoadingFeedback(true);
    try {
      const response = await puzzleStatsService.getSessionFeedback({
        mode: 'curated',
        solved: puzzlesSolved,
        failed: Math.max(0, puzzlesAttempted - puzzlesSolved),
        totalAttempted: puzzlesAttempted,
      });
      if (response?.success) setAiFeedback(response.data);
    } catch (error) {
      console.error('Failed to get Pulse session feedback:', error);
    } finally {
      setLoadingFeedback(false);
    }
  }, [puzzlesAttempted, puzzlesSolved]);

  const nextPuzzle = useCallback(() => {
    if (currentIndex + 1 < puzzles.length) {
      setCurrentIndex((index) => index + 1);
    } else {
      endSession();
    }
  }, [currentIndex, puzzles.length, endSession]);

  const handleCorrectSolve = useCallback(async () => {
    setPuzzlesSolved((solved) => solved + 1);
    setPuzzlesAttempted((attempted) => attempted + 1);

    const puzzle = puzzles[currentIndex];
    if (puzzle) {
      try {
        await puzzleStatsService.recordAttempt({
          puzzleId: puzzle.id,
          solved: true,
          puzzleRating: puzzle.rating,
          themes: puzzle.themes || [],
          mode: 'curated',
        });
      } catch (error) {
        console.error('Failed to record Pulse attempt:', error);
      }
    }

    window.setTimeout(nextPuzzle, 450);
  }, [puzzles, currentIndex, nextPuzzle]);

  const handleFailedMove = useCallback(async () => {
    setPuzzlesAttempted((attempted) => attempted + 1);

    const puzzle = puzzles[currentIndex];
    if (puzzle) {
      try {
        await puzzleStatsService.recordAttempt({
          puzzleId: puzzle.id,
          solved: false,
          puzzleRating: puzzle.rating,
          themes: puzzle.themes || [],
          mode: 'curated',
        });
      } catch (error) {
        console.error('Failed to record Pulse attempt:', error);
      }
    }
  }, [puzzles, currentIndex]);

  const accuracy = puzzlesAttempted > 0
    ? Math.round((puzzlesSolved / puzzlesAttempted) * 100)
    : 100;
  const currentPuzzle = puzzles[currentIndex];
  const availableExternalProviders = EXTERNAL_PROVIDERS.filter(
    (provider) => Boolean(externalConnections[provider.id])
  );
  const progress = puzzles.length > 0
    ? Math.round(((currentIndex + 1) / puzzles.length) * 100)
    : 0;
  const challengeLabel = useMemo(
    () => CHALLENGES.find((challenge) => challenge.id === profile.challenge)?.label || CHALLENGES[6].label,
    [profile.challenge]
  );
  const externalProfileCount = activity?.externalProfiles?.length || 0;
  const planSourceLabels = [
    activity?.hasChessPulseData ? 'ChessPulse history' : null,
    externalProfileCount > 0 ? 'selected profile games' : null,
  ].filter(Boolean);
  const planSourceLabel = planSourceLabels.length === 2
    ? 'Built from your answers, ChessPulse history, and selected profile games'
    : planSourceLabels.length === 1
      ? `Built from your answers and ${planSourceLabels[0]}`
      : 'Built from your level and improvement goals';

  return (
    <div className={`puzzle-curated-page cp-subpage ${view === 'playing' ? 'playing' : ''}`}>
      <PageAmbient watermark="PULSE" theme="classic" />

      <main className="pulse-page-frame">
        <PulseHeader view={view} onEndSession={endSession} />

        {view === 'loading' && (
          <div className="pulse-loading-card">
            <LoaderCircle size={25} className="pulse-spinner" />
            <strong>Preparing your training space</strong>
            <span>Checking your saved plan and recent play.</span>
          </div>
        )}

        {view === 'intake' && (
          <form className="pulse-intake-grid" onSubmit={submitProfile}>
            <section className="pulse-card pulse-form-card">
              <div className="pulse-card-heading">
                <span className="pulse-step-label">YOUR TRAINING PROFILE</span>
                <h2>Where would you like to grow?</h2>
                <p>Tell Pulse what your chess looks like today. It will shape a focused set around your answers.</p>
              </div>

              <fieldset className="pulse-form-section">
                <legend>How would you describe your current level?</legend>
                <div className="pulse-level-grid">
                  {LEVELS.map((level) => (
                    <label
                      className={`pulse-choice-card ${profile.level === level.id ? 'selected' : ''}`}
                      key={level.id}
                    >
                      <input
                        type="radio"
                        name="pulse-level"
                        value={level.id}
                        checked={profile.level === level.id}
                        onChange={() => setProfile((current) => ({ ...current, level: level.id }))}
                      />
                      <span className="pulse-choice-title">{level.label}</span>
                      <span className="pulse-choice-detail">{level.detail}</span>
                    </label>
                  ))}
                </div>
                <label className="pulse-rating-field">
                  <span>Know your rating? <em>Optional</em></span>
                  <input
                    type="number"
                    min="400"
                    max="2800"
                    step="25"
                    inputMode="numeric"
                    value={profile.rating}
                    onChange={(event) => setProfile((current) => ({ ...current, rating: event.target.value }))}
                    placeholder="For example, 1450"
                  />
                </label>
              </fieldset>

              <fieldset className="pulse-form-section">
                <legend>What do you want to improve? <span>Choose up to three</span></legend>
                <div className="pulse-goal-grid">
                  {GOALS.map(({ id, label, detail, Icon }) => (
                    <button
                      className={`pulse-goal-card ${profile.goals.includes(id) ? 'selected' : ''}`}
                      type="button"
                      key={id}
                      aria-pressed={profile.goals.includes(id)}
                      onClick={() => toggleGoal(id)}
                    >
                      <Icon size={17} />
                      <span className="pulse-goal-copy">
                        <strong>{label}</strong>
                        <small>{detail}</small>
                      </span>
                      {profile.goals.includes(id) && <CheckCircle2 size={16} className="pulse-goal-check" />}
                    </button>
                  ))}
                </div>
              </fieldset>

              <fieldset className="pulse-form-section pulse-external-section">
                <legend>Use game history from another platform? <span>Optional</span></legend>
                {availableExternalProviders.length > 0 ? (
                  <>
                    <div className="pulse-external-option-grid">
                      {availableExternalProviders.map((provider) => (
                        <label
                          className={`pulse-external-option ${profile.externalSources.includes(provider.id) ? 'selected' : ''}`}
                          key={provider.id}
                        >
                          <input
                            type="checkbox"
                            checked={profile.externalSources.includes(provider.id)}
                            onChange={() => toggleExternalSource(provider.id)}
                          />
                          <span className="pulse-external-option-copy">
                            <strong>{provider.label}</strong>
                          <small>{provider.detail} | {externalConnections[provider.id]}</small>
                          </span>
                          {profile.externalSources.includes(provider.id) && <CheckCircle2 size={16} />}
                        </label>
                      ))}
                    </div>
                    <p className="pulse-external-consent-note">
                      Pulse reviews up to 40 recent rated public games per selected handle. Handles are not identity-verified. It stores a compact summary and sends only that summary to Groq; full PGNs are not stored or sent.
                    </p>
                  </>
                ) : (
                  <p className="pulse-external-empty">
                    Add a Chess.com or Lichess username in <Link to="/profile">Profile settings</Link> to include public game history.
                  </p>
                )}
              </fieldset>

              <fieldset className="pulse-form-section pulse-form-bottom-grid">
                <label className="pulse-select-field">
                  <span>What feels hardest in your games?</span>
                  <select
                    value={profile.challenge}
                    onChange={(event) => setProfile((current) => ({ ...current, challenge: event.target.value }))}
                  >
                    {CHALLENGES.map((challenge) => (
                      <option value={challenge.id} key={challenge.id}>{challenge.label}</option>
                    ))}
                  </select>
                </label>

                <div className="pulse-session-field">
                  <span>How much time do you have?</span>
                  <div className="pulse-time-options">
                    {SESSION_LENGTHS.map((minutes) => (
                      <button
                        type="button"
                        key={minutes}
                        className={profile.sessionMinutes === minutes ? 'selected' : ''}
                        aria-pressed={profile.sessionMinutes === minutes}
                        onClick={() => setProfile((current) => ({ ...current, sessionMinutes: minutes }))}
                      >
                        <Clock3 size={14} />
                        {minutes} min
                      </button>
                    ))}
                  </div>
                </div>
              </fieldset>

              {(formError || pageError) && (
                <p className="pulse-form-error" role="alert">{formError || pageError}</p>
              )}

              <div className="pulse-form-footer">
                <span><ShieldCheck size={15} /> Your training profile and selected summaries are saved.</span>
                <button className="pulse-primary-button" type="submit" disabled={isGenerating}>
                  {isGenerating && <LoaderCircle size={17} className="pulse-spinner" />}
                  {isGenerating ? 'Building your plan…' : 'Build my Pulse plan'}
                  {!isGenerating && <ArrowRight size={16} />}
                </button>
              </div>
            </section>

            <aside className="pulse-card pulse-context-card">
              <div className="pulse-context-top">
                <span className="pulse-step-label">WHAT PULSE WILL USE</span>
              </div>
              <h2>Your chess, in context</h2>
              <ActivityContext activity={activity} />
              <div className="pulse-context-note">
                <Lightbulb size={16} />
                <p>
                  Your answers and selected game summaries guide the focus. Verified puzzle positions provide the board, moves, and solutions.
                </p>
              </div>
            </aside>
          </form>
        )}

        {view === 'ready' && plan && (
          <div className="pulse-plan-layout">
            <section className="pulse-card pulse-plan-card">
              <div className="pulse-plan-overview">
                <div>
                  <span className="pulse-step-label">{plan.source === 'groq' ? 'YOUR AI-CURATED SESSION' : 'YOUR STARTER SESSION'}</span>
                  <h2>{plan.summary}</h2>
                </div>
                <span className="pulse-plan-rating">
                  <Target size={15} /> Around {plan.targetRating} rating
                </span>
              </div>

              <div className="pulse-plan-focus-row">
                <span>Main focus</span>
                <strong>{formatTheme(plan.focusArea || profile.goals[0] || 'tactics')}</strong>
                <span className="pulse-plan-separator" />
                <span>{challengeLabel}</span>
              </div>

              <div className="pulse-plan-themes">
                <div className="pulse-plan-section-title">
                  <div>
                    <span className="pulse-step-label">SESSION MAP</span>
                    <h3>{puzzles.length} positions, selected for you</h3>
                  </div>
                  <span className="pulse-session-duration"><Timer size={14} /> {profile.sessionMinutes} minutes</span>
                </div>
                <div className="pulse-plan-theme-list">
                  {plan.themes?.map((item) => (
                    <article className="pulse-plan-theme" key={item.theme}>
                      <div className="pulse-plan-theme-mark"><Crosshair size={15} /></div>
                      <div className="pulse-plan-theme-copy">
                        <strong>{formatTheme(item.theme)}</strong>
                        <p>{item.reason}</p>
                      </div>
                      <span className="pulse-plan-theme-count">{item.count}</span>
                    </article>
                  ))}
                </div>
              </div>
            </section>

            <aside className="pulse-card pulse-plan-action-card">
              <span className="pulse-step-label">READY WHEN YOU ARE</span>
              <div className="pulse-plan-number">{puzzles.length}</div>
              <p className="pulse-plan-number-label">curated puzzles in this session</p>
              <div className="pulse-plan-source">
                {planSourceLabel}
              </div>
              {activity?.externalWarnings?.length > 0 && (
                <p className="pulse-external-warning" role="status">{activity.externalWarnings.join(' ')}</p>
              )}
              <button type="button" className="pulse-primary-button pulse-start-button" onClick={startSession}>
                <Play size={16} /> Start this session <ArrowRight size={16} />
              </button>
              <button type="button" className="pulse-text-button" onClick={() => { setPageError(''); setView('intake'); }}>
                Adjust my answers
              </button>
              {plan.source === 'fallback' && (
                <p className="pulse-fallback-note">AI curation is unavailable right now. Pulse prepared a starter set from your selected focus.</p>
              )}
              {pageError && <p className="pulse-form-error" role="alert">{pageError}</p>}
            </aside>
          </div>
        )}

        {view === 'playing' && (
          <div className="pulse-play-area">
            <div className="curated-live-hud cp-console-window">
              <div className="live-hud-cell progress-cell">
                <div className="progress-top-row">
                  <span className="hud-code">SESSION PROGRESS</span>
                  <span className="progress-pct">{progress}%</span>
                </div>
                <div className="progress-bar-track">
                  <div className="progress-bar-fill" style={{ width: `${progress}%` }} />
                </div>
                <span className="progress-sub">Puzzle {currentIndex + 1} of {puzzles.length}</span>
              </div>
              <div className="live-hud-cell">
                <span className="hud-code">SOLVED</span>
                <span className="hud-val emerald">{puzzlesSolved}</span>
              </div>
              <div className="live-hud-cell">
                <span className="hud-code">ACCURACY</span>
                <span className="hud-val cyan">{accuracy}%</span>
              </div>
              <div className="live-hud-cell">
                <span className="hud-code">PUZZLE RATING</span>
                <span className="hud-val gold">{currentPuzzle?.rating || '—'}</span>
              </div>
            </div>

            <section className="cp-console-window curated-board-window pulse-board-window">
              <div className="cp-window-topbar">
                <span className="cp-window-title">
                  <span className="cp-window-dot cyan" />
                  <span>{currentPuzzle ? formatTheme(currentPuzzle.themes?.[0] || plan.focusArea) : 'Loading position'}</span>
                </span>
                <button type="button" className="curated-next-top-btn" onClick={nextPuzzle}>
                  <span>{currentIndex + 1 === puzzles.length ? 'Finish session' : 'Skip puzzle'}</span>
                  <ArrowRight size={13} />
                </button>
              </div>

              <div className="curated-board-body">
                {currentPuzzle ? (
                  <div className="curated-board-wrap">
                    <PuzzleBoard
                      key={`pulse-${currentPuzzle.id}-${currentIndex}`}
                      puzzle={currentPuzzle}
                      onSolve={handleCorrectSolve}
                      onFail={handleFailedMove}
                      showControls
                      allowRetry
                    />
                    <div className="curated-stage-bottom-bar">
                      <button type="button" className="curated-advance-btn" onClick={nextPuzzle}>
                        {currentIndex + 1 === puzzles.length ? 'Finish session' : 'Next position'}
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="curated-loading-box"><LoaderCircle size={22} className="pulse-spinner" /><p>Loading your next position…</p></div>
                )}
              </div>
            </section>
          </div>
        )}

        {view === 'results' && (
          <section className="pulse-card pulse-results-card">
            <div className="pulse-results-heading">
              <span className="pulse-results-icon"><CheckCircle2 size={22} /></span>
              <div>
                <span className="pulse-step-label">SESSION COMPLETE</span>
                <h2>Good work. Your next session will build on this one.</h2>
              </div>
            </div>

            <div className="pulse-results-stats">
              <div><span>Solved</span><strong>{puzzlesSolved}<small> / {puzzles.length}</small></strong></div>
              <div><span>Accuracy</span><strong>{accuracy}%</strong></div>
              <div><span>Attempted</span><strong>{puzzlesAttempted}</strong></div>
              <div><span>Focus</span><strong className="pulse-result-focus">{formatTheme(plan?.focusArea || profile.goals[0] || 'tactics')}</strong></div>
            </div>

            <div className="pulse-coach-wrap">
              <div className="pulse-coach-heading"><Brain size={17} /><strong>Pulse reflection</strong></div>
              {loadingFeedback ? (
                <div className="pulse-feedback-loading"><LoaderCircle size={17} className="pulse-spinner" /> Reviewing this session…</div>
              ) : aiFeedback ? (
                <div className="pulse-feedback-content">
                  <p>{aiFeedback.summary}</p>
                  {aiFeedback.tips?.length > 0 && (
                    <ul>{aiFeedback.tips.slice(0, 3).map((tip, index) => <li key={index}>{tip}</li>)}</ul>
                  )}
                  {aiFeedback.strength && <span className="pulse-strength"><ShieldCheck size={14} /> {aiFeedback.strength}</span>}
                </div>
              ) : (
                <p className="pulse-feedback-empty">Your results are saved to your training history and will help shape the next set.</p>
              )}
            </div>

            <div className="pulse-results-actions">
              <button type="button" className="pulse-primary-button" onClick={() => generatePlan(profile)} disabled={isGenerating}>
                {isGenerating ? <LoaderCircle size={16} className="pulse-spinner" /> : <RotateCcw size={16} />}
                {isGenerating ? 'Refreshing your plan…' : 'Build another session'}
              </button>
              <button type="button" className="pulse-text-button" onClick={() => { setPageError(''); setView('intake'); }}>
                Update my profile
              </button>
            </div>
            {pageError && <p className="pulse-form-error" role="alert">{pageError}</p>}
          </section>
        )}
      </main>
    </div>
  );
}
